import { Colors, FontSizes, Fonts, Spacing, BorderRadius } from "@style/theme";
import { StyleSheet } from "react-native";

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 90,
    height: 90,
  },
  brandName: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.bold,
    color: Colors.primary["500"],
    marginTop: Spacing.sm,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.gray[500],
    marginTop: 4,
  },
  form: {
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.md,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.gray[700],
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.default,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.white,
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.primary["500"],
  },
  button: {
    marginTop: Spacing.xs,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.gray[500],
  },
  footerLink: {
    color: Colors.primary["500"],
    fontFamily: Fonts.semiBold,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray[200],
  },
  dividerText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
});
