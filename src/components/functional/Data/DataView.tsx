import ErrorMessage from "@design/Alert/ErrorMessage";
import LoadingIndicator from "@design/Loading/LoadingIndicator";
import DefaultView from "@design/View/DefaultView";
import { QueryFunction, useQuery } from "@tanstack/react-query";

type Props<T> = {
  queryKey: string[];
  queryFn: QueryFunction<T>;
  render: (data: NonNullable<T>) => React.ReactNode;
};

const DataView = <T,>({ queryKey, queryFn, render }: Props<T>) => {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
  });

  if (isLoading) {
    return (
      <DefaultView>
        <LoadingIndicator />
      </DefaultView>
    );
  }

  if (error) {
    return (
      <DefaultView>
        <ErrorMessage error={(error as Error).message} />
      </DefaultView>
    );
  }

  if (!data) {
    return (
      <DefaultView>
        <ErrorMessage error="No data found" />
      </DefaultView>
    );
  }

  return <>{render(data)}</>;
};

export default DataView;
