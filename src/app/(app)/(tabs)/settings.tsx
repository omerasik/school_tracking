import useAuth from "@/src/components/functional/auth/useAuth";
import { useHaptics } from "@/src/components/functional/settings/useHaptics";
import useSettings from "@/src/components/functional/settings/useSettings";
import { useSoundEffects } from "@/src/components/functional/settings/useSoundEffects";
import { useTheme } from "@/src/context/ThemeContext";
import { settingstyles } from "@/src/style/settings.styling";
import { Colors, FontSizes, Fonts, Spacing, getThemeColors } from "@/src/style/theme";
import { formatName } from "@core/modules/profiles/utils.profiles";
import Button from "@design/Button/Button";
import AnimatedSwitch from "@design/Input/AnimatedSwitch";
import AnimatedTabView from "@design/View/AnimatedTabView";
import DefaultView from "@design/View/DefaultView";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Text, View } from "react-native";

const SettingsLayout = () => {
  const { auth, logout } = useAuth();
  const { settings, updateSoundSetting, updateVibrationSetting, isLoading } =
    useSettings();
  const { playClick } = useSoundEffects();
  const haptics = useHaptics();
  const { isDark, toggleTheme } = useTheme();
  const themeColors = getThemeColors(isDark);

  if (!auth?.user) {
    return null;
  }

  const user = auth.user;
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleSoundToggle = async (value: boolean) => {
    await haptics.light();
    await updateSoundSetting(value);
  };

  const handleVibrationToggle = async (value: boolean) => {
    playClick();
    await haptics.light();
    await updateVibrationSetting(value);
  };

  const handleThemeToggle = async () => {
    playClick();
    await haptics.light();
    toggleTheme();
  };

  const handleLogout = async () => {
    playClick();
    await haptics.medium();
    await logout();
  };

  const cardStyle = {
    backgroundColor: themeColors.card,
    borderColor: themeColors.border,
  };
  const textStyle = { color: themeColors.text };
  const subTextStyle = { color: themeColors.textSecondary };
  const dividerStyle = { backgroundColor: themeColors.border };

  return (
    <AnimatedTabView>
      <DefaultView>
        {/* User Profile Card */}
        <View style={[settingstyles.userSection, cardStyle]}>
          {/* Avatar */}
          <View style={settingstyles.avatarCircle}>
            <Text style={settingstyles.avatarText}>{initials}</Text>
          </View>

          <Text style={[settingstyles.userName, textStyle]}>
            {formatName(user)}
          </Text>

          <Text style={[settingstyles.userEmail, textStyle]}>
            {user.email}
          </Text>

          {/* Role badge */}
          <View
            style={[
              settingstyles.userRole,
              {
                backgroundColor: user.role === "docent"
                  ? Colors.primary["100"]
                  : Colors.success["100"],
              },
            ]}
          >
            <Text
              style={[
                settingstyles.userRoleText,
                {
                  color: user.role === "docent"
                    ? Colors.primary["600"]
                    : Colors.success["600"],
                },
              ]}
            >
              {user.role === "docent" ? "Teacher" : "Student"}
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={[settingstyles.settingsSection, cardStyle]}>
          <Text style={[settingstyles.sectionTitle, subTextStyle]}>
            Voorkeuren
          </Text>

          {/* Dark mode */}
          <View style={settingstyles.settingItem}>
            <View style={settingstyles.settingInfo}>
              <View style={settingstyles.settingIconRow}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={20}
                  color={Colors.primary["500"]}
                />
                <Text style={[settingstyles.settingLabel, textStyle]}>
                  {isDark ? "Donkere modus" : "Lichte modus"}
                </Text>
              </View>
              <Text style={[settingstyles.settingDescription, subTextStyle]}>
                Schakel tussen licht en donker thema
              </Text>
            </View>
            <AnimatedSwitch value={isDark} onValueChange={handleThemeToggle} />
          </View>

          <View style={[settingstyles.divider, dividerStyle]} />

          {/* Sound */}
          <View style={settingstyles.settingItem}>
            <View style={settingstyles.settingInfo}>
              <View style={settingstyles.settingIconRow}>
                <Ionicons
                  name={settings.soundEnabled ? "volume-high" : "volume-mute"}
                  size={20}
                  color={Colors.primary["500"]}
                />
                <Text style={[settingstyles.settingLabel, textStyle]}>
                  Geluid
                </Text>
              </View>
              <Text style={[settingstyles.settingDescription, subTextStyle]}>
                Schakel geluidseffecten in of uit
              </Text>
            </View>
            <AnimatedSwitch
              value={settings.soundEnabled}
              onValueChange={handleSoundToggle}
              disabled={isLoading}
            />
          </View>

          <View style={[settingstyles.divider, dividerStyle]} />

          {/* Vibration */}
          <View style={settingstyles.settingItem}>
            <View style={settingstyles.settingInfo}>
              <View style={settingstyles.settingIconRow}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={Colors.primary["500"]}
                />
                <Text style={[settingstyles.settingLabel, textStyle]}>
                  Trillen
                </Text>
              </View>
              <Text style={[settingstyles.settingDescription, subTextStyle]}>
                Schakel haptische feedback in of uit
              </Text>
            </View>
            <AnimatedSwitch
              value={settings.vibrationEnabled}
              onValueChange={handleVibrationToggle}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={[settingstyles.appInfoSection, cardStyle]}>
          <Text style={[settingstyles.sectionTitle, subTextStyle]}>
            Over de app
          </Text>

          <View style={settingstyles.appInfoRow}>
            <Text style={[settingstyles.appInfoLabel, subTextStyle]}>
              Versie
            </Text>
            <Text style={[settingstyles.appInfoValue, textStyle]}>
              {appVersion}
            </Text>
          </View>

          <View style={[settingstyles.divider, dividerStyle]} />

          <View style={settingstyles.appInfoRow}>
            <Text style={[settingstyles.appInfoLabel, subTextStyle]}>
              Scholen
            </Text>
            <Text style={[settingstyles.appInfoValue, textStyle]}>
              School Tracking
            </Text>
          </View>

          <View style={[settingstyles.divider, dividerStyle]} />

          <View style={settingstyles.appInfoRow}>
            <Text style={[settingstyles.appInfoLabel, subTextStyle]}>
              Platform
            </Text>
            <Text style={[settingstyles.appInfoValue, textStyle]}>
              School Tracking v{appVersion}
            </Text>
          </View>
        </View>

        {/* Logout */}
        <View style={settingstyles.logoutSection}>
          <Button onPress={handleLogout}>Afmelden</Button>
        </View>
      </DefaultView>
    </AnimatedTabView>
  );
};

export default SettingsLayout;
