import { Zo } from "@zo/assets/brands";
import { FillingZo } from "@zo/assets/lotties";
import { useQueryApi } from "@zo/auth";
import { NextPage } from "next";
import { QRCode } from "../components/common";
import { useLogin } from "../hooks";

const QR: NextPage = () => {
  const { isLoggedIn } = useLogin();

  const {
    data: crossLoginRequest,
    isSuccess,
    isFetching,
  } = useQueryApi(
    "AUTH_LOGIN_CROSS_LOGIN_REQUEST",
    {
      enabled: isLoggedIn === true,
    },
    "",
    ""
  );

  return (
    <section className="w-full grid place-items-center pt-32 pb-12">
      <div className="flex flex-col items-center justify-center max-w-5xl w-full px-4">
        <Zo className="h-6" fill="rgb(249, 250, 251)" />
        <h2 className="text-xl md:text-3xl font-bold my-8 text-center">
          Open Zo Club App and
          <br />
          scan QR to log in instantly.
        </h2>
        {!isFetching && isSuccess ? (
          <QRCode
            link={`https://zo.xyz/login/${crossLoginRequest?.data?.token}`}
            className="w-[300px] h-[300px]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-[300px] h-[300px] bg-gray-800">
            <FillingZo className="w-16 h-16" />
            <span>Please wait...</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default QR;
