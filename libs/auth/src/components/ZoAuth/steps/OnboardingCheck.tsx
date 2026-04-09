import { FC, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/auth";
import useProfile from "../../../hooks/useProfile";
import { fetchWhereabouts, WhereaboutsRecord } from "../../../utils/whereabouts";
import { ZoAuthStep, ZoAuthStepProps } from "../ZoAuth";
import { computeOnboardingQueue } from "./computeOnboardingQueue";

interface OnboardingCheckProps extends ZoAuthStepProps {
  setOnboardingQueue: (queue: ZoAuthStep[]) => void;
}

const OnboardingCheck: FC<OnboardingCheckProps> = ({
  setStep,
  setOnboardingQueue,
}) => {
  const { skipOnboarding } = useAuth();
  const { profile } = useProfile();
  const [whereabouts, setWhereabouts] = useState<
    WhereaboutsRecord | null | undefined
  >(undefined);

  useEffect(() => {
    fetchWhereabouts()
      .then((result) => setWhereabouts(result))
      .catch(() => setWhereabouts(null));
  }, []);

  useEffect(() => {
    if (!profile || whereabouts === undefined) return;

    if (skipOnboarding) {
      setStep("WELCOME");
      return;
    }

    const queue = computeOnboardingQueue(profile, whereabouts);

    if (queue.length === 0) {
      setStep("WELCOME");
    } else {
      setOnboardingQueue(queue);
      setStep(queue[0]);
    }
  }, [profile, whereabouts, skipOnboarding, setStep, setOnboardingQueue]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <i className="uil uil-spinner animate-spin text-2xl" />
      <span className="text-sm mt-4 text-white/50">Setting things up...</span>
    </div>
  );
};

export default OnboardingCheck;
