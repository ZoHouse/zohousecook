import React, { useEffect, useState } from "react";
const formattedSeconds = (t: number) => {
  return t > 0 ? (t < 10 ? `0${t}` : `${t}`) : "00";
};
const getDays = (s: number) => {
  return Math.floor(s / (60 * 60 * 24));
};
const getHours = (s: number) => {
  return Math.floor((s / (60 * 60)) % 24);
};
const getMinutes = (s: number) => {
  return Math.floor((s / 60) % 60);
};
const getSeconds = (s: number) => {
  return Math.floor(s % 60);
};

const Timer: React.FC<{ eta: number }> = ({ eta }) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    let timer: any;
    if (eta) {
      timer = setInterval(() => {
        const timeElapsed = Math.round(eta - +new Date() / 1000);
        setSecondsLeft(timeElapsed);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => {
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eta]);

  return (
    <div className="flex items-start space-x-4 my-4">
      <div className="flex flex-col items-center">
        <span className="font-semibold text-2xl text-zui-yellow tracking-wide">
          {formattedSeconds(getDays(secondsLeft))}
        </span>
        <span className="mt-2 uppercase font-medium text-zui-white text-sm tracking-wide">
          Days
        </span>
      </div>
      <span className="font-semibold text-2xl text-zui-yellow">:</span>
      <div className="flex flex-col items-center">
        <span className="font-semibold text-2xl text-zui-yellow tracking-wide">
          {formattedSeconds(getHours(secondsLeft))}
        </span>
        <span className="mt-2 uppercase font-medium text-zui-white text-sm tracking-wide">
          Hours
        </span>
      </div>
      <span className="font-semibold text-2xl text-zui-yellow">:</span>
      <div className="flex flex-col items-center">
        <span className="font-semibold text-2xl text-zui-yellow tracking-wide">
          {formattedSeconds(getMinutes(secondsLeft))}
        </span>
        <span className="mt-2 uppercase font-medium text-zui-white text-sm tracking-wide">
          Minutes
        </span>
      </div>
      <span className="font-semibold text-2xl text-zui-yellow">:</span>
      <div className="flex flex-col items-center">
        <span className="font-semibold text-2xl text-zui-yellow tracking-wide">
          {formattedSeconds(getSeconds(secondsLeft))}
        </span>
        <span className="mt-2 uppercase font-medium text-zui-white text-sm tracking-wide">
          Seconds
        </span>
      </div>
    </div>
  );
};

export default Timer;
