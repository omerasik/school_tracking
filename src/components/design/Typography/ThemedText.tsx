import { themedTextStyles } from "@style/components.styling";
import { StyleProp, Text, type TextProps, TextStyle } from "react-native";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "subtitle" | "link";
  color?: "default" | "light";
  weight?: "normal" | "semi-bold" | "bold";
  style?: StyleProp<TextStyle>;
};

const ThemedText = ({
  style,
  type = "default",
  color = "default",
  weight = "normal",
  ...rest
}: ThemedTextProps) => {
  return (
    <Text
      style={[
        themedTextStyles.default,
        type === "title" && themedTextStyles.title,
        style,
        weight === "bold" && themedTextStyles.bold,
        color === "light" && themedTextStyles.light,
      ]}
      {...rest}
    />
  );
};

export default ThemedText;