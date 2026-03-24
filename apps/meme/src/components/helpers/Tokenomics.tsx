import React from "react";

interface TokenomicsProps {}

const tokenomicsData = [
  { ques: "Ticker", ans: "$Unicorn" },
  { ques: "Supply", ans: "1,000,000,000" },
  { ques: "Liquidity", ans: "100% burnt" },
  { ques: "Freeze & Mint", ans: "Fuck No" },
  { ques: "Tax", ans: "0/0" },
  { ques: "Contract", ans: "Renounced" },
];

const Tokenomics: React.FC<TokenomicsProps> = () => {
  return (
    <div className="mx-auto">
      <h3 className="text-2xl md:text-[56px] font-bold text-center">Tokenomics</h3>
      <div className="grid grid-cols-2 text-center px-6 md:px-24">
        {tokenomicsData.map((ele) => (
          <div key={ele.ques} className="mt-10">
            <span className="text-xs md:text-2xl">{ele.ques}</span>
            <h6 className="text-base md:text-[32px] font-bold">{ele.ans}</h6>
          </div>
        ))}
        <div className="col-span-2 flex justify-center mt-10">
          <button className="border-4 border-zui-white rounded-full whitespace-nowrap text-2xl md:text-[56px] py-6 px-14 font-bold hover:bg-white hover:text-black">
            BUY $UNICORN
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tokenomics;
