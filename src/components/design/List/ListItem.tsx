import isEmptyText from "@core/utils/isEmptyText";
import ThemedText from "@design/Typography/ThemedText";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { listItemStyles } from "@style/components.styling";
import { Colors } from "@style/theme";
import { Href, Link } from "expo-router";
import { ColorValue, Pressable, View } from "react-native";

type BaseProps = {
  title: string;
  description?: string;
  icon?: any;
  iconColor?: ColorValue;
  color?: ColorValue;
  right?: string;
};

type HrefProps = BaseProps & {
  href: Href;
  onPress?: never;
};

type PressProps = BaseProps & {
  onPress: () => void;
  href?: never;
};

const ListItem = ({
  onPress,
  href,
  title,
  description,
  icon,
  iconColor = Colors.text,
  color,
  right,
}: HrefProps | PressProps) => {
  let textContent: React.ReactNode;
  if (!isEmptyText(description)) {
    textContent = (
      <View style={listItemStyles.containerText}>
        <ThemedText style={[listItemStyles.title, color && { color }]}>{title}</ThemedText>
        <ThemedText style={[listItemStyles.description]}>{description}</ThemedText>
      </View>
    );
  } else {
    textContent = <ThemedText style={[listItemStyles.titleFlex, color && { color }]}>{title}</ThemedText>;
  }

  let content = (
    <View style={listItemStyles.container}>
      {icon && <Icons style={listItemStyles.icon} name={icon} color={iconColor} size={24} />}
      {textContent}
      {right && <ThemedText style={[listItemStyles.right, color && { color }]}>{right}</ThemedText>}
    </View>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <Pressable onPress={onPress} android_ripple={{ color: Colors.ripple, foreground: true }}>
      {content}
    </Pressable>
  );
};

export default ListItem;