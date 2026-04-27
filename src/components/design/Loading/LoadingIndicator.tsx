import { Colors } from "@style/theme";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

type Props = {
  timeout?: number;
};

// loading indicator that only shows if it takes longer than 1 second
const LoadingIndicator = ({ timeout = 1000 }: Props) => {
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setVisible(true);
    }, timeout);
    return () => clearTimeout(id);
  }, [timeout]);

  if (!isVisible) {
    return null;
  }

  return <ActivityIndicator color={Colors.primary["600"]} />;
};

export default LoadingIndicator;