import { useTheme } from "@/src/context/ThemeContext";
import { defaultViewStyles } from "@style/components.styling";
import { getThemeColors } from "@style/theme";
import { Platform, ScrollView, StyleProp, ViewStyle } from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: boolean;
  children: React.ReactNode;
};

const DefaultView = ({ style, contentStyle, padding = true, children }: Props) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);

  return (
    <ScrollView
      style={[
        defaultViewStyles.view,
        { backgroundColor: themeColors.background },
        style,
      ]}
      contentContainerStyle={[
        padding ? defaultViewStyles.viewPadding : undefined,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={Platform.OS === "web"}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
};

export default DefaultView;