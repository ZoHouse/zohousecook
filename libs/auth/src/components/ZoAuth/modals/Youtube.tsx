import React from "react";

interface YoutubeModalProps {
  videoCode: string;
  close: () => void;
}

const YoutubeModal: React.FC<YoutubeModalProps> = ({ close, videoCode }) => {
  return (
    <div className="fixed inset-0 z-20 p-[4vw] bg-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" onClick={close} />
      <div className="w-[50vw] portrait:w-[100vw] h-[30vw] portrait:h-[30vh] bg-zui-dark p-[4vh] portrait:p-[4vw] relative flex flex-col max-w-full">
        <button
          className="absolute top-[1vw] right-[1vw] flex items-center bg-zui-white justify-center w-[2vw] h-[2vw] portrait:w-[8vw] portrait:h-[8vw] text-zui-white text-[3vh] portrait:text-[5vw] text-zui-zui-dark"
          onClick={close}
        >
          <i className="uil uil-times" />
        </button>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoCode}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
        <span className="font-medium mt-4">
          Zo Studios is working on this communication.
        </span>
      </div>
    </div>
  );
};

export default YoutubeModal;
