import SettingsProvider from "@/src/components/functional/settings/SettingsProvider";
import { Colors, Fonts } from "@style/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const AppLayout = () => {
  return (
    <SettingsProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary["500"],
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontFamily: Fonts.regular,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="attendances/[id]"
          options={{
            title: "Aanwezigheid Details",
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </SettingsProvider>
  );
};

export default AppLayout;
