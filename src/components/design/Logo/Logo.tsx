import LogoAsset from "@assets/images/icon.png";
import { Image, ImageStyle, StyleProp } from "react-native";

type Props = {
  style?: StyleProp<ImageStyle>;
};

const Logo = ({ style }: Props) => {
  return <Image style={style} source={LogoAsset} />;
};

export default Logo;