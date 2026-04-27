import ThemedText from "@design/Typography/ThemedText";
import { buttonStyles } from "@style/components.styling";
import { Colors } from "@style/theme";
import { Href, Link } from "expo-router";
import { Pressable, StyleProp, TextStyle, View, ViewStyle } from "react-native";

type BaseProps = {
  children: string;
  disabled?: boolean;
};

type HrefProps = BaseProps & {
  href: Href;
  onPress?: never;
  style?: StyleProp<TextStyle>;
};

type PressProps = BaseProps & {
  onPress: () => void;
  href?: never;
  style?: StyleProp<ViewStyle>;
};

const Button = ({ onPress, href, children, style, disabled = false }: HrefProps | PressProps) => {
  const content = (
    <View style={[buttonStyles.background, disabled && buttonStyles.backgroundDisabled]}>
      <ThemedText style={[buttonStyles.text, disabled && buttonStyles.textDisabled]}>{children}</ThemedText>
    </View>
  );

  if (href) {
    return (
      <Link href={href} disabled={disabled} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      accessibilityLabel={children}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && buttonStyles.pressed]}
      android_ripple={{ color: Colors.ripple, foreground: true }}
    >
      {content}
    </Pressable>
  );
};

export default Button;