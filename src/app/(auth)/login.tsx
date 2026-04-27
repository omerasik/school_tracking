import { useTheme } from "@/src/context/ThemeContext";
import { getThemeColors, Colors, Fonts, FontSizes, Spacing, BorderRadius } from "@/src/style/theme";
import ErrorMessage from "@design/Alert/ErrorMessage";
import Button from "@design/Button/Button";
import Logo from "@design/Logo/Logo";
import { translateError, validateLogin } from "@functional/auth/authValidation";
import useAuth from "@functional/auth/useAuth";
import { authStyles } from "@style/auth.styling";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const validationError = validateLogin(email, password);
    if (validationError) { setError(validationError); return; }
    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace("/(app)/(tabs)/attendances");
    } catch (err) {
      setError(translateError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = [
    authStyles.input,
    { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border },
  ];

  return (
    <KeyboardAvoidingView
      style={[authStyles.screen, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Hero */}
      <View style={authStyles.hero}>
        <Logo style={authStyles.logo} />
        <Text style={[authStyles.brandName, { color: Colors.primary["500"] }]}>School Tracking</Text>
        <Text style={[authStyles.brandTagline, { color: themeColors.textSecondary }]}>
          Secure school attendance
        </Text>
      </View>

      {/* Form */}
      <View style={authStyles.form}>
        <View>
          <Text style={[{ fontSize: FontSizes.xxxl, fontFamily: Fonts.bold, marginBottom: 4 }, { color: themeColors.text }]}>
            Welkom terug 👋
          </Text>
          <Text style={[{ fontSize: FontSizes.sm, fontFamily: Fonts.regular, marginBottom: Spacing.xl }, { color: themeColors.textSecondary }]}>
            Log in om je aanwezigheid te bekijken
          </Text>
        </View>

        <View style={authStyles.field}>
          <Text style={[authStyles.fieldLabel, { color: themeColors.textSecondary }]}>E-mailadres</Text>
          <TextInput
            style={inputStyle}
            placeholder="name@example.com"
            placeholderTextColor={themeColors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isLoading}
            keyboardAppearance={isDark ? "dark" : "light"}
          />
        </View>

        <View style={authStyles.field}>
          <Text style={[authStyles.fieldLabel, { color: themeColors.textSecondary }]}>Wachtwoord</Text>
          <TextInput
            style={inputStyle}
            placeholder="••••••••"
            placeholderTextColor={themeColors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            keyboardAppearance={isDark ? "dark" : "light"}
          />
        </View>

        <ErrorMessage error={error} />

        <Button style={authStyles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? "Bezig met inloggen..." : "Inloggen"}
        </Button>
      </View>

      {/* Footer */}
      <View style={authStyles.footer}>
        <Text style={[authStyles.footerText, { color: themeColors.textSecondary }]}>
          Uw inloggegevens worden verstrekt door de school.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;
