import { GeneralObject } from "@zo/definitions/general";
import { useQueryClient } from "react-query";
import { useAuth, useMutationApi, useQueryApi } from "..";

const useProfile = () => {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const refetchProfile = () => {
    queryClient.resetQueries(["PROFILE", "ME"]);
    refetch();
  };

  const { mutate: updateProfile, isLoading: isUpdatingProfile } =
    useMutationApi("PROFILE_ME", {
      onSuccess: refetchProfile,
    });

  const {
    data: profile,
    isLoading,
    isFetching,
    refetch,
  } = useQueryApi<GeneralObject>(
    "PROFILE_ME",
    {
      enabled: isLoggedIn === true,
      staleTime: Infinity,
    },
    "",
    ""
  );

  return {
    profile: profile?.data,
    updateProfile,
    isLoading: isLoading || isFetching,
    isUpdatingProfile,
    refetchProfile,
  };
};

export default useProfile;
