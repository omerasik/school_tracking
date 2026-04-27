import { useTheme } from "@/src/context/ThemeContext";
import { qrStyles } from "@/src/style/qr.styling";
import { getThemeColors, Colors, BorderRadius, Fonts, FontSizes, Spacing } from "@/src/style/theme";
import { autoCheckoutExpiredAttendances } from "@core/modules/attendances/api.attendances";
import { prototypeTeacherScan } from "@core/modules/checkin/api.prototypeTeacherScan";
import ConfettiAnimation from "@design/Animation/ConfettiAnimation";
import LoadingIndicator from "@design/Loading/LoadingIndicator";
import AnimatedQRCode from "@design/QR/AnimatedQRCode";
import AnimatedTabView from "@design/View/AnimatedTabView";
import CenteredView from "@design/View/CenteredView";
import DefaultView from "@design/View/DefaultView";
import useUser from "@functional/auth/useUser";
import { useFeedback } from "@functional/feedback/useFeedback";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Time constants (milliseconds)
const QR_REFRESH_INTERVAL = 10 * 1000; // 10s
const SCAN_TIMEOUT = 2 * 1000; // 2s cooldown
const AUTO_CHECKOUT_INTERVAL = 60 * 1000; // 1 min

const QrLayout = () => {
  const user = useUser();
  const userId = user?.id;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const locationRef = useRef<Location.LocationObject | null>(null);
  const feedback = useFeedback();
  const [qrHash, setQrHash] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(
    QR_REFRESH_INTERVAL / 1000
  );
  const lastScannedRef = useRef<string>("");
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const [showConfetti, setShowConfetti] = useState(false);

  // Progress animation for QR countdown bar
  const progressAnim = useRef(new Animated.Value(1)).current;

  const animateProgress = useCallback(() => {
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: QR_REFRESH_INTERVAL,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  useEffect(() => {
    // GPS location on mount
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          locationRef.current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch {
          // ignore — use last known location
        }
      }
    };
    requestLocationPermission();
  }, []);

  // Auto-checkout when courses end
  useEffect(() => {
    const checkAndAutoCheckout = async () => {
      try {
        await autoCheckoutExpiredAttendances();
      } catch (error) {
        console.error("Auto checkout failed:", error);
      }
    };
    checkAndAutoCheckout();
    const interval = setInterval(checkAndAutoCheckout, AUTO_CHECKOUT_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Generate unique QR hash
  const generateQRHash = useCallback(() => {
    if (!userId) return;
    const timestamp = Date.now();
    const hash = `${userId}_${timestamp}`;
    setQrHash(hash);
    setCountdown(QR_REFRESH_INTERVAL / 1000);
    animateProgress();
  }, [userId, animateProgress]);

  useEffect(() => {
    if (user?.role === "student") {
      generateQRHash();
      const interval = setInterval(generateQRHash, QR_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [user?.role, user?.id, generateQRHash]);

  // Countdown timer
  useEffect(() => {
    if (user?.role === "student") {
      const timer = setInterval(() => {
        setCountdown((prev) =>
          prev > 0 ? prev - 1 : QR_REFRESH_INTERVAL / 1000
        );
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [user?.role]);

  if (!user) {
    return (
      <AnimatedTabView>
        <DefaultView>
          <LoadingIndicator />
        </DefaultView>
      </AnimatedTabView>
    );
  }

  if (user.role === "student") {
    const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });
    const progressColor = progressAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [Colors.error["500"], Colors.warning["500"], Colors.success["500"]],
    });

    return (
      <AnimatedTabView>
        <CenteredView>
          {/* Header */}
          <Text
            style={[
              qrStyles.title,
              { color: themeColors.text, marginBottom: Spacing.xs },
            ]}
          >
            Jouw QR-code
          </Text>
          <Text
            style={{
              fontSize: FontSizes.sm,
              fontFamily: Fonts.regular,
              color: themeColors.textSecondary,
              textAlign: "center",
              marginBottom: Spacing.xl,
            }}
          >
            Show this QR code to your teacher to check in
          </Text>

          {/* QR Code Card */}
          <View
            style={[
              qrStyles.qrWrapper,
              {
                backgroundColor: themeColors.card,
                borderWidth: 1.5,
                borderColor: themeColors.border,
              },
            ]}
          >
            <AnimatedQRCode
              value={qrHash || user.id}
              size={220}
              refreshInterval={QR_REFRESH_INTERVAL}
            />

            {/* Progress bar */}
            <View
              style={{
                width: 220,
                height: 4,
                backgroundColor: themeColors.border,
                borderRadius: 2,
                marginTop: Spacing.md,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  height: "100%",
                  width: progressWidth,
                  backgroundColor: progressColor,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>

          {/* Countdown pill */}
          <View
            style={[
              qrStyles.countdownContainer,
              { backgroundColor: themeColors.cardElevated },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={countdown <= 3 ? Colors.error["500"] : themeColors.primary}
            />
            <Text
              style={[
                qrStyles.countdownText,
                {
                  color:
                    countdown <= 3
                      ? Colors.error["500"]
                      : themeColors.textSecondary,
                },
              ]}
            >
              Vernieuwt over {countdown}s
            </Text>
          </View>

          {/* Student info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
              marginTop: Spacing.xl,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.sm,
              backgroundColor: themeColors.card,
              borderRadius: BorderRadius.full,
              borderWidth: 1.5,
              borderColor: themeColors.border,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.primary["500"],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: FontSizes.xs,
                  fontFamily: Fonts.bold,
                  color: Colors.white,
                }}
              >
                {initials}
              </Text>
            </View>
            <Text
              style={{
                fontSize: FontSizes.sm,
                fontFamily: Fonts.semiBold,
                color: themeColors.text,
              }}
            >
              {user.first_name} {user.last_name}
            </Text>
          </View>
        </CenteredView>
      </AnimatedTabView>
    );
  }

  if (user.role === "docent") {
    if (!permission) {
      return (
        <AnimatedTabView>
          <DefaultView>
            <LoadingIndicator />
          </DefaultView>
        </AnimatedTabView>
      );
    }

    if (!permission.granted) {
      return (
        <AnimatedTabView>
          <CenteredView>
            <View
              style={{
                alignItems: "center",
                padding: Spacing["2xl"],
                gap: Spacing.xl,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: Colors.primary["100"],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="camera-outline"
                  size={36}
                  color={Colors.primary["500"]}
                />
              </View>
              <Text
                style={[qrStyles.message, { color: themeColors.text }]}
              >
                Camera-toegang nodig om QR-codes te scannen.
              </Text>
              <TouchableOpacity
                style={qrStyles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={qrStyles.permissionButtonText}>
                  Toegang verlenen
                </Text>
              </TouchableOpacity>
            </View>
          </CenteredView>
        </AnimatedTabView>
      );
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
      if (scanned || !data) return;
      if (lastScannedRef.current === data) return;

      setScanned(true);
      lastScannedRef.current = data;

      try {
        if (!locationRef.current?.coords) {
          setMessageType("error");
          setMessage(
            "GPS locatie niet beschikbaar. Zorg dat locatieservices aanstaan."
          );
          await feedback.error();
          setTimeout(() => setScanned(false), SCAN_TIMEOUT);
          return;
        }

        const userLat = locationRef.current.coords.latitude;
        const userLon = locationRef.current.coords.longitude;

        const result = await prototypeTeacherScan({
          qr: data,
          location: {
            lat: userLat,
            lon: userLon,
            accuracy_m: locationRef.current.coords.accuracy ?? null,
          },
        });

        setMessageType("success");
        setMessage(
          `✓ ${result.student.first_name} ${result.student.last_name} aanwezig!`
        );
        setShowConfetti(true);
        await feedback.success();
        setTimeout(() => {
          setScanned(false);
          setShowConfetti(false);
          setMessage(null);
        }, SCAN_TIMEOUT);
      } catch (error: any) {
        setMessageType("error");
        const apiError =
          (error?.context?.body ? JSON.parse(error.context.body) : null) ??
          null;
        const code = apiError?.error ?? null;
        const msg =
          code === "qr_expired"
            ? "QR-code verlopen. Student moet de code vernieuwen."
            : code === "student_not_found"
              ? "Ongeldige QR-code of student niet gevonden!"
              : code === "no_active_course"
                ? "Geen actieve les op dit moment!"
                : code === "already_checked_in"
                  ? "Student is al ingecheckt voor deze les!"
                  : code === "qr_reused"
                    ? "Deze QR-code is al gebruikt!"
                    : code === "outside_geofence"
                      ? `Je bent te ver van de campus.`
                      : null;
        setMessage(msg ?? error.message ?? "Kon aanwezigheid niet markeren");
        await feedback.error();
        setTimeout(() => {
          setScanned(false);
          setMessage(null);
        }, SCAN_TIMEOUT);
      }
    };

    return (
      <AnimatedTabView>
        <View style={qrStyles.container}>
          <CameraView
            style={qrStyles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          {/* Scan frame overlay */}
          <View style={StyleSheet.absoluteFillObject}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            />
            <View style={{ flexDirection: "row" }}>
              <View
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
              />
              <View
                style={{
                  width: 250,
                  height: 250,
                  position: "relative",
                }}
              >
                {/* Corner markers */}
                <View style={qrStyles.scanFrameCornerTL} />
                <View style={qrStyles.scanFrameCornerTR} />
                <View style={qrStyles.scanFrameCornerBL} />
                <View style={qrStyles.scanFrameCornerBR} />
              </View>
              <View
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
              />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                alignItems: "center",
                paddingTop: Spacing.xl,
                gap: Spacing.md,
              }}
            >
              <Text style={qrStyles.overlayText}>
                Scan de QR-code van de student
              </Text>

              {message && (
                <View
                  style={[
                    qrStyles.messageBox,
                    messageType === "success"
                      ? qrStyles.messageBoxSuccess
                      : qrStyles.messageBoxError,
                  ]}
                >
                  <Text style={qrStyles.messageText}>{message}</Text>
                </View>
              )}

              {scanned && !message && (
                <TouchableOpacity
                  style={qrStyles.scanAgainButton}
                  onPress={() => {
                    setScanned(false);
                    lastScannedRef.current = "";
                  }}
                >
                  <Text style={qrStyles.scanAgainText}>
                    Tik om opnieuw te scannen
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ConfettiAnimation
            show={showConfetti}
            onComplete={() => setShowConfetti(false)}
          />
        </View>
      </AnimatedTabView>
    );
  }

  return null;
};

export default QrLayout;
