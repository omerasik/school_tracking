import { useTheme } from "@/src/context/ThemeContext";
import { getThemeColors, Fonts, FontSizes, Spacing, BorderRadius } from "@/src/style/theme";
import DefaultView from "@design/View/DefaultView";
import EmptyView from "@design/View/EmptyView";
import useUser from "@functional/auth/useUser";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

const NotificationsScreen = () => {
  const user = useUser();
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);

  if (!user) return null;

  return (
    <DefaultView>
      <EmptyView
        title="Bildirimler"
        description="Bildirim altyapısı v2’de push + in-app olarak aktif olacak."
        icon="notifications"
      />

      <View
        style={{
          marginTop: Spacing.lg,
          padding: Spacing.lg,
          borderRadius: BorderRadius.xl,
          backgroundColor: themeColors.card,
          borderWidth: 1,
          borderColor: themeColors.border,
          flexDirection: "row",
          gap: Spacing.md,
          alignItems: "center",
        }}
      >
        <Ionicons name="information-circle-outline" size={22} color={themeColors.textSecondary} />
        <Text style={{ flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.sm, color: themeColors.textSecondary }}>
          Şu an demo amaçlı. Gerçek sistemde: “session başlamadı”, “riskli devamsızlık”, “correction isteği” gibi olaylar buradan yönetilecek.
        </Text>
      </View>
    </DefaultView>
  );
};

export default NotificationsScreen;

