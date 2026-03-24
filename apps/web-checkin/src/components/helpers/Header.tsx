import { useMemo } from "react";
import { ArrowLeft } from "../icons";
interface HeaderProps {
  isHeaderVisible: boolean;
  showBackButton: boolean;
  step: string;
  goBack: () => void;
  progressSteps: { id: string; label: string }[];
  getCurrentProgressStep: () => number;
  isRepeatUser: boolean;
  goBackHandlerForRepeatUser: () => void;
}

const Header = ({
  isHeaderVisible,
  showBackButton,
  step,
  goBack,
  progressSteps,
  getCurrentProgressStep,
  isRepeatUser,
  goBackHandlerForRepeatUser,
}: HeaderProps) => {
  const showBackButtonMemo = useMemo(() => {
    if (!showBackButton) {
      return false;
    }

    if (isRepeatUser) {
      return false;
    }

    return true;
  }, [showBackButton, isRepeatUser]);

  const backButtonInRepeatUserScreen = useMemo(() => {
    return isRepeatUser && ["basic-info", "upload-ids"].includes(step);
  }, [step, isRepeatUser]);

  if (!isHeaderVisible) return null;

  return (
    <header className="bg-white">
      <div className="flex items-center justify-between py-3 w-full bg-white">
        {showBackButtonMemo && (
          <button onClick={goBack}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.2804 4.46356C12.1289 5.17069 12.2436 6.43181 11.5364 7.28037L9.27008 10H19C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14H9.27008L11.5364 16.7196C12.2436 17.5682 12.1289 18.8293 11.2804 19.5364C10.4318 20.2436 9.17069 20.1289 8.46356 19.2804L3.46356 13.2804C2.84548 12.5387 2.84548 11.4613 3.46356 10.7196L8.46356 4.71963C9.17069 3.87108 10.4318 3.75643 11.2804 4.46356Z"
                fill="#111111"
              />
            </svg>
          </button>
        )}

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex items-center gap-4">
            {backButtonInRepeatUserScreen && (
              <button onClick={goBackHandlerForRepeatUser}>
                <ArrowLeft />
              </button>
            )}
            <h2 className="text-lg font-semibold text-[#111111]">
              Web Check-in
            </h2>
          </div>
          {/* Progress indicators */}
          {!isRepeatUser && (
            <div className="flex px-2 pb-3 mt-1 justify-center">
              {progressSteps.map((progressStep, index) => {
                const isLast = index === progressSteps.length - 1;
                const currentStepIndex = getCurrentProgressStep();
                const isActive = index === currentStepIndex;
                const isPast = index < currentStepIndex;

                return (
                  <div key={progressStep.id} className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 ${
                        isActive
                          ? "border-2 border-[#111111]"
                          : isPast
                          ? "bg-green-500"
                          : "border border-gray-300"
                      }`}
                    >
                      {isPast && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.33334 2.5L3.75001 7.08333L1.66667 5"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <span
                      className={`text-sm whitespace-nowrap ${
                        isActive
                          ? "text-[#111111] font-medium"
                          : isPast
                          ? "text-[#111111]"
                          : "text-[#111111]/50"
                      }`}
                    >
                      {progressStep.label}
                    </span>
                    {!isLast && (
                      <div className="mx-2 flex items-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M8.47976 2.97558C7.91406 3.447 7.83762 4.28774 8.30904 4.85346L9.81994 6.66654H3.33334C2.59695 6.66654 2 7.2635 2 7.99988C2 8.73626 2.59695 9.33321 3.33334 9.33321H9.81994L8.30904 11.1463C7.83762 11.712 7.91406 12.5528 8.47976 13.0242C9.04546 13.4956 9.8862 13.4192 10.3576 12.8535L13.691 8.85346C14.103 8.35898 14.103 7.64077 13.691 7.1463L10.3576 3.1463C9.8862 2.58058 9.04546 2.50416 8.47976 2.97558Z"
                            fill={isPast ? "#111111" : "#111111"}
                            fillOpacity={isPast ? "1" : "0.16"}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
