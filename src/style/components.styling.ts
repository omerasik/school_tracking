import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from "@style/theme";
import { StyleSheet, TextStyle, ViewStyle } from "react-native";

const hairlineWidth = StyleSheet.hairlineWidth;

export const errorMessageStyles = {
  text: {
    width: "100%",
    textAlign: "center" as const,
    backgroundColor: Colors.error["100"],
    color: Colors.error["500"],
    padding: Spacing.sm,
    borderRadius: Spacing.xs,
    marginBottom: Spacing.md,
  } satisfies TextStyle,
};

export const buttonStyles = {
  background: {
    backgroundColor: Colors.primary["500"],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  backgroundDisabled: {
    backgroundColor: Colors.gray["300"],
  },
  text: {
    textAlign: "center" as const,
    color: Colors.white,
    fontSize: FontSizes.default,
  },
  textDisabled: {
    opacity: 0.3,
    color: Colors.text,
  },
  pressed: {
    opacity: 0.9,
  },
};

export const textButtonStyles = {
  title: {
    textAlign: "center" as const,
    color: Colors.primary["500"],
    fontFamily: Fonts.bold,
    fontSize: FontSizes.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  } satisfies TextStyle,
};

export const listItemStyles = {
  container: {
    width: "100%",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  } satisfies ViewStyle,
  containerText: {
    flex: 1,
  },
  title: {},
  titleFlex: {
    flex: 1,
  },
  description: {
    color: Colors.gray["500"],
  },
  right: {
    marginLeft: "auto" as const,
  },
  icon: {
    marginLeft: Spacing.xs,
    marginRight: Spacing.md,
  },
};

export const dividerStyles = {
  divider: {
    width: "100%",
    height: hairlineWidth,
    backgroundColor: Colors.gray["200"],
  } satisfies ViewStyle,
};

export const themedTextStyles = {
  default: {
    fontSize: FontSizes.default,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  title: {
    fontSize: FontSizes.xl,
  },
  bold: {
    fontFamily: Fonts.bold,
  },
  light: {
    color: Colors.gray["600"],
  },
};

export const centeredViewStyles = {
  view: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: Spacing["2xl"],
  },
};

export const emptyViewStyles = {
  title: {
    marginVertical: Spacing.xs,
  },
  text: {
    textAlign: "center" as const,
    paddingHorizontal: Spacing.lg,
  },
  button: {
    marginTop: Spacing.md,
  },
};

export const defaultViewStyles = {
  view: {
    flex: 1,
  },
  viewPadding: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
};
