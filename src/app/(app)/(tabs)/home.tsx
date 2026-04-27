import { useTheme } from "@/src/context/ThemeContext";
import { getThemeColors, Colors, Fonts, FontSizes, Spacing, BorderRadius } from "@/src/style/theme";
import { getTodayCourses } from "@core/modules/courses/api.courses";
import { CourseWithCampus } from "@core/modules/courses/types.courses";
import LoadingIndicator from "@design/Loading/LoadingIndicator";
import DefaultView from "@design/View/DefaultView";
import EmptyView from "@design/View/EmptyView";
import useUser from "@functional/auth/useUser";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const HomeScreen = () => {
  const user = useUser();
  const router = useRouter();
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const [today, setToday] = useState<CourseWithCampus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodayCourses()
      .then(setToday)
      .catch((e) => setError(e.message));
  }, []);

  const header = useMemo(() => {
    const roleLabel =
      user?.app_role === "teacher" || user?.role === "docent"
        ? "Teacher"
        : user?.app_role === "admin"
          ? "Admin"
          : "Student";
    const name = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();
    return { roleLabel, name: name || user?.email || "" };
  }, [user]);

  if (!user) return null;
  if (error) {
    return (
      <DefaultView>
        <EmptyView title="Kon niet laden" description={error} icon="alert-circle" />
      </DefaultView>
    );
  }
  if (!today) {
    return (
      <DefaultView>
        <LoadingIndicator />
      </DefaultView>
    );
  }

  const isTeacher = user.role === "docent" || user.app_role === "teacher";
  const isAdmin = user.app_role === "admin" || user.app_role === "school_manager";

  return (
    <DefaultView padding={false}>
      <View style={{ padding: Spacing.lg, gap: Spacing.sm }}>
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, color: themeColors.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>
          {header.roleLabel}
        </Text>
        <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.xxl, color: themeColors.text }}>
          {header.name}
        </Text>

        {isAdmin && (
          <View style={{ marginTop: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, backgroundColor: themeColors.card, borderWidth: 1, borderColor: themeColors.border, gap: Spacing.xs }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.default, color: themeColors.text }}>
              Admin panel
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: themeColors.textSecondary }}>
              Mobilde yalnızca temel görünüm var. Yönetim işlemleri web panelden yapılacak (v2).
            </Text>
          </View>
        )}

        <View style={{ marginTop: Spacing.md, flexDirection: "row", gap: Spacing.sm }}>
          <TouchableOpacity
            onPress={() => router.push("/(app)/(tabs)/qrs")}
            style={{
              flex: 1,
              padding: Spacing.md,
              borderRadius: BorderRadius.xl,
              backgroundColor: Colors.primary["500"],
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="qr-code-outline" size={18} color={Colors.white} />
            <Text style={{ fontFamily: Fonts.bold, color: Colors.white }}>
              {isTeacher ? "Yoklama al" : "Check-in"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(app)/(tabs)/attendances")}
            style={{
              flex: 1,
              padding: Spacing.md,
              borderRadius: BorderRadius.xl,
              backgroundColor: themeColors.card,
              borderWidth: 1,
              borderColor: themeColors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="list-outline" size={18} color={themeColors.textSecondary} />
            <Text style={{ fontFamily: Fonts.bold, color: themeColors.text }}>
              {isTeacher ? "Canlı liste" : "Geçmiş"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {today.length === 0 ? (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <EmptyView title="Bugün ders yok" description="Bugün için planlanmış ders bulunamadı." icon="calendar" />
        </View>
      ) : (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.sm, color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: Spacing.sm }}>
            Bugünkü dersler
          </Text>
          <FlatList
            data={today}
            keyExtractor={(i) => i.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: Spacing.md,
                  borderRadius: BorderRadius.xl,
                  backgroundColor: themeColors.card,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                  gap: 6,
                }}
              >
                <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.default, color: themeColors.text }}>
                  {item.course_name}
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: themeColors.textSecondary }}>
                  {item.start_time?.substring(0, 5)} – {item.end_time?.substring(0, 5)} · {item.classroom}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </DefaultView>
  );
};

export default HomeScreen;

