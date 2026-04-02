/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @next/next/no-img-element */
import { ZoSpinner } from "../ui/ZoSpinner";
import { useProfile } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FC, useEffect, useState } from "react";

interface FounderNFTsModalProps {
  close: () => void;
}

const FounderNFTsModal: FC<FounderNFTsModalProps> = ({ close }) => {
  const { profile } = useProfile();

  const [isFetchingNFTs, setFetchingNFTs] = useState<boolean>(false);
  const [founderNFTs, setFounderNFTs] = useState<GeneralObject[]>([]);

  useEffect(() => {
    if (profile) {
      setFetchingNFTs(true);
      Promise.all(
        profile.founder_tokens.map((token: string) =>
          fetch(`https://nft-cdn.zo.xyz/founders/${token}.json`).then(
            async (res) => {
              const data = await res.json();
              return { ...data, token };
            }
          )
        )
      )
        .then((res) => {
          setFounderNFTs(res);
          setFetchingNFTs(false);
        })
        .catch(console.log);
    }
  }, [profile]);

  const openNFT = (token: number) => {
    window.open(
      `https://opensea.io/assets/ethereum/0xf9e631014ce1759d9b76ce074d496c3da633ba12/${token}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-20 px-4 bg-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" onClick={close} />
      <div className="w-full h-auto max-h-full overflow-y-auto bg-zui-black relative max-w-4xl">
        <button
          className="absolute z-10 top-4 right-4 flex items-center bg-zui-white hover:bg-zui-yellow justify-center w-8 h-8 text-zui-white text-xl text-zui-black"
          onClick={close}
        >
          <i className="uil uil-times" />
        </button>
        {isFetchingNFTs ? (
          <div className="flex flex-col items-center text-zui-white justify-center my-24">
            <ZoSpinner size={40} />
            <span className="text-2xl mt-4 portrait:text-lg uppercase font-bold">
              Please Wait...
            </span>
            <span className=" text-xl mt-2 font-bold text-zui-yellow leading-none">
              Fetching your NFTs
            </span>
          </div>
        ) : (
          <div className="flex flex-1 flex-col w-full items-start relative">
            <span className=" text-2xl p-4 text-zui-yellow portrait:text-xl font-semibold">
              Your Founder NFTs
            </span>

            <ul className="w-full max-h-[80vh] p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-8">
              {(founderNFTs || []).map((nft, index) => (
                <li
                  key={index}
                  className="flex flex-col w-full h-full cursor-pointer group border-2 divide-y-2 divide-zui-yellow border-zui-yellow"
                  onClick={openNFT.bind(null, nft.token)}
                >
                  <img
                    src={nft.image_url}
                    alt=""
                    className="w-full flex-grow max-h-56 bg-zui-yellow object-cover"
                  />
                  <span className="text-zui-white p-4 flex-shrink-0 flex items-center">
                    {nft.name}
                    <i className="uil uil-external-link-alt ml-2 opacity-0 group-hover:opacity-100" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FounderNFTsModal;
