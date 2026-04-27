import { useTheme } from "@/src/context/ThemeContext";
import { getThemeColors, Colors, Fonts, FontSizes, Spacing } from "@/src/style/theme";
import Logo from "@design/Logo/Logo";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const Register = () => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <View style={styles.hero}>
        <Logo style={styles.logo} />
        <Text style={[styles.brandName, { color: Colors.primary["500"] }]}>School Tracking</Text>
      </View>

      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.primary["100"] }]}>
          <Ionicons name="lock-closed" size={32} color={Colors.primary["500"]} />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Registratie gesloten
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          Accounts worden aangemaakt door de school. Neem contact op met uw schoolbeheerder om toegang te krijgen.
        </Text>
        <View style={[styles.infoBadge, { backgroundColor: Colors.primary["50"] }]}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary["500"]} />
          <Text style={[styles.infoText, { color: Colors.primary["600"] }]}>
            School Tracking attendance system
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
          Heeft u al een account?{" "}
          <Link href="/(auth)/login" style={styles.footerLink}>
            Inloggen
          </Link>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logo: {
    width: 80,
    height: 80,
  },
  brandName: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.bold,
    marginTop: Spacing.sm,
    letterSpacing: -0.5,
  },
  card: {
    borderRadius: 24,
    padding: Spacing["2xl"],
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    textAlign: "center",
    lineHeight: 22,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 99,
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
  },
  footerLink: {
    color: Colors.primary["500"],
    fontFamily: Fonts.semiBold,
  },
});

export default Register;
