import React, { useState } from "react";

interface LiveDevProps {}

const LiveDev: React.FC<LiveDevProps> = () => {
  const [isUnderstood, setUnderstood] = useState<boolean>(false);

  return isUnderstood ? (
    <></>
  ) : (
    <aside className="fixed inset-0 bg-zui-dark bg-opacity-50 z-[1000] grid place-items-center">
      <div className="flex flex-col items-center mx-auto bg-zui-red p-6 space-y-8">
        <span className="zui-heading-2">Live Development going on.</span>
        <span>Things which are not broken might feel broken.</span>
        <button
          className="zui-text-1 bg-zui-purple text-zui-dark py-8 px-16"
          onClick={setUnderstood.bind(null, true)}
        >
          I understand the risk
        </button>
      </div>
    </aside>
  );
};

export default LiveDev;
