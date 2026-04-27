import { useTheme } from "@/src/context/ThemeContext";
import { DefaultScreenOptions, Fonts, FontSizes, getThemeColors } from "@style/theme";
import useUser from "@functional/auth/useUser";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TabLayout = () => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const user = useUser();
  const isTeacher = user?.role === "docent" || user?.app_role === "teacher";

  return (
    <Tabs
      screenOptions={{
        ...DefaultScreenOptions,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 11,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: themeColors.cardElevated,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        },
        headerTitleStyle: {
          fontFamily: Fonts.bold,
          fontSize: FontSizes.default,
          color: themeColors.text,
        },
        headerTintColor: themeColors.text,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerTitle: "School Tracking",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="attendances"
        options={{
          title: isTeacher ? "Sessie" : "Geçmiş",
          headerTitle: isTeacher ? "Yoklama" : "Attendance geçmişi",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qrs"
        options={{
          title: isTeacher ? "Scan" : "QR",
          headerTitle: isTeacher ? "QR Scanner" : "QR Check-in",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "qr-code" : "qr-code-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Bildirim",
          headerTitle: "Bildirimler",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "notifications" : "notifications-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          headerTitle: "Ayarlar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={24}
              name={focused ? "settings" : "settings-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
