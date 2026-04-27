import useAuth from "./useAuth";

const useUser = () => {
  const { auth } = useAuth();
  return auth?.user ?? null;
};

export default useUser;