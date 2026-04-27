import { Colors, FontSizes, Fonts, Spacing, BorderRadius, Shadow } from "@style/theme";
import { StyleSheet } from "react-native";

export const attandancesStyles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSizes.default,
    fontFamily: Fonts.regular,
    backgroundColor: Colors.white,
    color: Colors.text,
  },
  calendarButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    height: 48,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  clearButtonText: {
    color: Colors.gray[700],
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing["2xs"],
    flexWrap: "wrap",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.gray[50],
    gap: Spacing["2xs"],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary["500"],
    borderColor: Colors.primary["500"],
  },
  filterButtonPresent: {
    backgroundColor: Colors.success["500"],
    borderColor: Colors.success["500"],
  },
  filterButtonAbsent: {
    backgroundColor: Colors.error["500"],
    borderColor: Colors.error["500"],
  },
  filterButtonText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  // ─── Course card (student view) ────────────────────────────────
  courseCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadow.sm,
  },
  courseCardPresent: {
    backgroundColor: Colors.success["50"],
    borderColor: Colors.success["500"],
  },
  courseCardAbsent: {
    backgroundColor: Colors.error["50"],
    borderColor: Colors.error["500"],
  },
  courseCardUpcoming: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[300],
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  courseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  courseCode: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.primary["500"],
  },
  courseDate: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.gray[500],
  },
  courseName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  courseDetails: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.gray[700],
  },
  // ─── Student card (docent view) ────────────────────────────────
  studentCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    ...Shadow.sm,
  },
  studentCardPresent: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success["500"],
  },
  studentCardAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error["500"],
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  studentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary["100"],
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
    color: Colors.primary["600"],
  },
  studentName: {
    fontSize: FontSizes.default,
    fontFamily: Fonts.bold,
    color: Colors.text,
    flex: 1,
  },
  studentStatus: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.gray[600],
  },
  studentDetails: {
    gap: Spacing["2xs"],
    paddingLeft: 46, // align under avatar
  },
  goneHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.error["500"],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  goneHomeText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  // ─── Course filter chips ────────────────────────────────────────
  courseFilterContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  courseFilterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    borderWidth: 1,
  },
  courseFilterChipActive: {
    backgroundColor: Colors.primary["500"],
    borderColor: Colors.primary["500"],
  },
  courseFilterChipInactive: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[200],
  },
  courseFilterChipText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
  courseFilterChipTextActive: {
    color: Colors.white,
  },
  courseFilterChipTextInactive: {
    color: Colors.gray[700],
  },
  // ─── Stat/summary bar ──────────────────────────────────────────
  statsBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
  },
  // ─── Day navigation ────────────────────────────────────────────
  dayNavigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dayNavButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  dayNavButtonDisabled: {
    opacity: 0.35,
  },
  dayNavButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
    color: Colors.primary["500"],
  },
  dayNavButtonTextDisabled: {
    color: Colors.gray[300],
  },
  currentDateDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  currentDateText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
    color: Colors.text,
    textAlign: "center",
  },
  compactCourseCard: {
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactCourseCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  compactCourseIcon: {
    marginRight: Spacing.sm,
  },
  compactCourseName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  compactCourseDate: {
    fontSize: FontSizes.xs,
    color: Colors.gray[600],
    fontFamily: Fonts.regular,
  },
});

// Attendances Detail Page Styles
export const attendancesDetailStyles = StyleSheet.create({
  heroSection: {
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  heroIcon: {
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  heroDate: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.white,
    opacity: 0.85,
    marginTop: 4,
  },
  courseNameCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  courseNameText: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    ...Shadow.sm,
  },
  sectionCardBottom: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  detailsContainer: {
    gap: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary["100"],
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.gray[500],
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
  detailSubValue: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.gray[600],
  },
  teachersContainer: {
    gap: Spacing.sm,
  },
});
