import ThemedText from "@design/Typography/ThemedText";
import { errorMessageStyles } from "@style/components.styling";

type Props = {
  error: unknown;
};

const ErrorMessage = ({ error }: Props) => {
  if (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    return <ThemedText style={errorMessageStyles.text}>{message}</ThemedText>;
  }
  return null;
};

export default ErrorMessage;