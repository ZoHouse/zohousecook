import {
  CustomButton,
  EmailLogin,
  MobileLogin,
  useAuth,
} from "@zo/auth";
import { Button } from "@zo/moal";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isLoggedIn, logout, login } = useAuth();

  const [step, setStep] = useState<"ENTRY" | "WALLET" | "MOBILE" | "EMAIL">(
    "ENTRY"
  );

  const handleSuccessFullLogin = () => {
    setStep("ENTRY");
    router.push("/dashboard");
  };

  useEffect(() => {
    if (isConnected && step === "WALLET") {
      router.push("/dashboard");
    }
  }, [isConnected, router, step]);

  const handleWalletClick = () => {
    if (!isConnected) {
      setStep("WALLET");
    }
  };

  return (
    <div className="w-screen h-screen bg-zui-dark flex flex-col items-center justify-center">
      <span className="font-semibold text-3xl leading-none">Welcome to</span>
      <h1 className="font-bold text-6xl mt-2 text-zui-pink ">Zo World</h1>

      {!isLoggedIn ? (
        <div className="w-96 mt-10">
          {step === "ENTRY" ? (
            <div className="flex flex-col items-start justify-start gap-2 mt-6">
              <div role="button" onClick={handleWalletClick} className="w-full">
                <CustomButton />
              </div>
              <Button
                className="w-full font-normal"
                onClick={() => setStep("MOBILE")}
              >
                Continue with Mobile
              </Button>
              <Button
                className="w-full font-normal"
                onClick={() => setStep("EMAIL")}
              >
                Continue with Email
              </Button>
            </div>
          ) : null}
          <>
            {step === "MOBILE" && (
              <MobileLogin
                login={login}
                setStep={() => {}}
                setFocus={() => {}}
                onSuccess={handleSuccessFullLogin}
              />
            )}
            {step === "EMAIL" && (
              <EmailLogin
                login={login}
                setStep={() => {}}
                setFocus={() => {}}
                onSuccess={handleSuccessFullLogin}
              />
            )}
          </>

          {step !== "ENTRY" && (
            <div className="w-96 mt-6">
              <Button
                type="secondary"
                icon="ArrowLeft"
                className="w-full"
                onClick={() => setStep("ENTRY")}
              >
                Back
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-96 mt-10">
          <Button className="w-full" onClick={logout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

export default Login;
