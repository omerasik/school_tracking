import DefaultView from "@design/View/DefaultView";
import { centeredViewStyles } from "@style/components.styling";
import { StyleProp, ViewStyle } from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const CenteredView = ({ children, style }: Props) => {
  return (
    <DefaultView
      padding={false}
      contentStyle={[centeredViewStyles.view, style]}
    >
      {children}
    </DefaultView>
  );
};

export default CenteredView;