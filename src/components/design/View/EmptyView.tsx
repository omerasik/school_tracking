import Button from "@design/Button/Button";
import ThemedText from "@design/Typography/ThemedText";
import CenteredView from "@design/View/CenteredView";
import Icons from "@expo/vector-icons/MaterialIcons";
import { emptyViewStyles } from "@style/components.styling";
import { Colors, Spacing } from "@style/theme";
import { Href } from "expo-router";

type Props = {
  title: string;
  description: string;
  icon: keyof typeof Icons.glyphMap;
  href?: Href;
};

const EmptyView = ({ title, description, icon, href }: Props) => {
  return (
    <CenteredView>
      <Icons name={icon} size={Spacing["3xl"]} color={Colors.primary["400"]} />
      <ThemedText style={[emptyViewStyles.title, emptyViewStyles.text]} type="title">
        {title}
      </ThemedText>
      <ThemedText color="light" style={emptyViewStyles.text}>
        {description}
      </ThemedText>
      {href && (
        <Button href={href} style={emptyViewStyles.button}>
          Toevoegen
        </Button>
      )}
    </CenteredView>
  );
};

export default EmptyView;
