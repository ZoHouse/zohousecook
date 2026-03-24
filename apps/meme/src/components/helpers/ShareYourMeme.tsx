/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { MediaUploadModal } from "../ui";

interface ShareYourMemeProps {}

const ShareYourMeme: React.FC<ShareYourMemeProps> = () => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  return (
    <>
      <section className="h-screen w-full relative mb-10">
        <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] z-30 text-center">
          <button
            onClick={setModalOpen.bind(null, true)}
            className="border-4 border-zui-white rounded-full whitespace-nowrap text-2xl md:text-[56px] py-6 px-14 font-bold hover:bg-white hover:text-black"
          >
            Share Memes
          </button>
          <p className="text-2xl mt-4">
            Will be added to unicorn’s training data
          </p>
        </div>
        <img
          className="absolute z-0 right-[15%] top-[65%] md:top-[35%] rotate-15 w-[110px] md:w-[180px] aspect-square"
          src="https://cdn.zo.xyz/gallery/media/images/e5b8150c-045c-4956-a804-15800bbc843f_20240724150555.gif"
          alt=""
        />
        <img
          className="absolute z-0 w-[100px] left-[10%] md:left-[35%] bottom-[15%] md:bottom-[10%]"
          src="https://cdn.zo.xyz/gallery/media/images/b094c3b6-236d-4c5c-a6ba-e662d04890a0_20240724150547.gif"
          alt=""
        />
        <img
          className="absolute z-0 w-[136px] md:w-[300px] top-[25%] md:top-[30%] left-[10%] -rotate-15"
          src="https://cdn.zo.xyz/gallery/media/images/0ec63b46-494d-498c-b901-80bcac542a73_20240724150539.gif"
          alt=""
        />

        <img
          className="absolute z-0 w-[90px] md:w-[224px] top-[20%] md:top-0 left-[55%] md:left-[45%] -rotate-15"
          src="https://cdn.zo.xyz/gallery/media/images/b3d39269-3ff5-43b8-8972-b069d3b3aca2_20240724150529.gif"
          alt=""
        />

        <img
          className="absolute z-0 w-[70px] md:w-[150px] top-[10%] md:top-0 left-[30%] rotate-15"
          src="https://cdn.zo.xyz/gallery/media/images/1304a50d-1efd-4728-9808-d9f4cd605f46_20240724150521.gif"
          alt=""
        />

        <img
          className="absolute z-0 w-[80px] md:w-[190px] top-[30%] md:top-[5%] right-10 md:right-[20%] -rotate-15"
          src="https://cdn.zo.xyz/gallery/media/images/28f1c997-844d-46e7-aa55-60fff82ae213_20240724150503.gif"
          alt=""
        />

        <img
          className="absolute z-0 w-[280px] md:w-[400px] -bottom-[10%] md:bottom-0 right-[20%] "
          src="https://cdn.zo.xyz/gallery/media/images/62ac4d87-7d7a-458a-a8a2-3afc8f720802_20240725164755.png"
          alt=""
        />
      </section>
      <MediaUploadModal
        isOpen={isModalOpen}
        onClose={setModalOpen.bind(null, false)}
      />
    </>
  );
};

export default ShareYourMeme;
