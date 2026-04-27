import { DefaultScreenOptions } from "@style/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          ...DefaultScreenOptions,
          headerTitle: "",
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: "",
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: "",
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}