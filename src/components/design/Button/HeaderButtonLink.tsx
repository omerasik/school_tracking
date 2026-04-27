import Icons from "@expo/vector-icons/MaterialIcons";
import { Colors, Spacing } from "@style/theme";
import { Href, Link } from "expo-router";

type Props = {
  icon: keyof typeof Icons.glyphMap;
  href: Href;
  title: string;
  color?: string;
};

const HeaderButtonLink = ({ icon, color, href }: Props) => {
  return (
    <Link href={href}>
      <Icons name={icon} color={color || Colors.headerText} size={Spacing.xl} />
    </Link>
  );
};

export default HeaderButtonLink;
