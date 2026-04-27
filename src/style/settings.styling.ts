import { Colors, FontSizes, Fonts, Spacing, BorderRadius, Shadow } from "@style/theme";
import { StyleSheet } from "react-native";

export const settingstyles = StyleSheet.create({
  userSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    alignItems: "center",
    ...Shadow.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary["500"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  userName: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  userEmail: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: 4,
    opacity: 0.7,
  },
  userRole: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary["100"],
  },
  userRoleText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
    color: Colors.primary["600"],
    textTransform: "capitalize",
  },
  settingsSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    opacity: 0.55,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingLabel: {
    fontSize: FontSizes.default,
    fontFamily: Fonts.semiBold,
  },
  settingDescription: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginTop: 2,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: 2,
    opacity: 0.4,
  },
  appInfoSection: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadow.sm,
  },
  appInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  appInfoLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    opacity: 0.65,
  },
  appInfoValue: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  logoutSection: {
    marginBottom: Spacing["3xl"],
  },
});
