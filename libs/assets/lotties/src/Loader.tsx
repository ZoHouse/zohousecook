import dynamic from "next/dynamic";
import React from "react";

interface LoadingProps {
  className?: string;
  style?: React.CSSProperties;
}

// Dynamically import the Lottie component with SSR disabled
const LottieLoader = dynamic(
  () => import("lottie-react").then((mod) => {
    const Lottie = mod.default;
    return import("./lib/spinner.json").then((animationFile) => {
      return function DynamicLottieLoader({ className, style }: LoadingProps) {
        return <Lottie animationData={animationFile.default} className={className} style={style} />;
      };
    });
  }),
  {
    ssr: false,
    loading: () => (
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    ),
  }
);

const Loading: React.FC<LoadingProps> = ({ className, style }) => {
  return <LottieLoader className={className} style={style} />;
};

export default Loading;
