import { DefaultTheme } from "@react-navigation/native";

const Primary = {
  "50": "#FFF5EB",
  "100": "#FFE8D6",
  "200": "#FFD0AD",
  "300": "#FFB885",
  "400": "#FF9F5C",
  "500": "#F36E21", // primary orange
  "600": "#DB5A1B",
  "700": "#B54A16",
  "800": "#8F3A11",
  "900": "#692A0D",
  "950": "#361607",
};

const Gray = {
  50: "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
};

export const Colors = {
  primary: {
    ...Primary,
  },
  gray: { ...Gray },
  success: {
    "50": "#f0fdf4",
    "100": "#dcfce7",
    "200": "#bbf7d0",
    "300": "#86efac",
    "400": "#4ade80",
    "500": "#22c55e",
    "600": "#16a34a",
    "700": "#15803d",
    "800": "#166534",
    "900": "#14532d",
    "950": "#052e16",
  },
  error: {
    "50": "#fef2f2",
    "100": "#fee2e2",
    "200": "#fecaca",
    "300": "#fca5a5",
    "400": "#f87171",
    "500": "#ef4444",
    "600": "#dc2626",
    "700": "#b91c1c",
    "800": "#991b1b",
    "900": "#7f1d1d",
    "950": "#450a0a",
  },
  warning: {
    "500": "#f59e0b",
    "600": "#d97706",
  },
  white: "#ffffff",
  black: "#000000",

  text: Primary["950"],
  lightText: Gray["400"],
  headerText: Primary["50"],
  ripple: "rgba(0, 0, 0, 0.1)",
};

// Dark mode color scheme — premium dark
export const DarkColors = {
  background: "#09090B", // Zinc-950, very sleek
  card: "#18181B", // Zinc-900
  cardElevated: "#27272A", // Zinc-800
  border: "#3F3F46", // Zinc-700
  text: "#FAFAFA", // Zinc-50
  textSecondary: "#A1A1AA", // Zinc-400
  textTertiary: "#71717A", // Zinc-500
  primary: Primary["500"],
  primaryLight: Primary["400"],
  success: Colors.success["500"],
  error: Colors.error["500"],
  warning: Colors.warning["500"],
  // Gradient accent for headers
  gradientStart: "#18181B",
  gradientEnd: "#09090B",
};

// Light mode color scheme — clean and modern
export const LightColors = {
  background: "#F8FAFC", // Slate-50, airy and clean
  card: Colors.white,
  cardElevated: Colors.white,
  border: "#E2E8F0", // Slate-200
  text: "#0F172A", // Slate-900
  textSecondary: "#475569", // Slate-600
  textTertiary: "#94A3B8", // Slate-400
  primary: Primary["500"],
  primaryLight: Primary["400"],
  success: Colors.success["500"],
  error: Colors.error["500"],
  warning: Colors.warning["500"],
  gradientStart: Primary["500"],
  gradientEnd: Primary["600"],
};

// Theme-aware color getter
export const getThemeColors = (isDark: boolean) => {
  return isDark ? DarkColors : LightColors;
};

export const Fonts = {
  regular: "inter",
  medium: "inter-medium",
  semiBold: "inter-semibold",
  bold: "inter-bold",
};

export const Spacing = {
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
  "5xl": 80,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  default: 16,
  md: 18,
  lg: 20,
  xl: 23,
  xxl: 24,
  xxxl: 28,
};

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  "2xl": 32,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary["500"],
    background: Colors.primary["50"],
    card: Colors.primary["500"],
    tint: Colors.primary["500"],
    icon: Colors.primary["500"],
  },
};

export const DefaultScreenOptions = {
  tabBarStyle: {
    backgroundColor: Colors.white,
  },
  headerTitleStyle: {
    fontFamily: Fonts.regular,
  },
  headerRightContainerStyle: {
    paddingRight: Spacing.md,
  },
  tabBarLabelStyle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
  },
  headerTintColor: Colors.white,
  tabBarInactiveTintColor: Colors.gray["400"],
};
