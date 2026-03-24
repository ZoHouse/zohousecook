import React from "react";
import { footerLinks } from "../../config";

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="w-4/5 mx-auto py-20">
      <div className="flex flex-col md:flex-row items-start gap-10 md:gap-0 justify-between ">
        <div>
          <h4 className="text-[56px] font-bold leading-none">unicorn</h4>
          <p>A billion dollar meme from SF</p>
        </div>

        <div className="flex flex-1 gap-10 justify-around">
          {footerLinks.map((col) => (
            <ul key={col.id} className="space-y-4">
              {col.links.map((ele) => (
                <li key={ele.label}>
                  <a
                    className="underline md:no-underline hover:underline"
                    href={ele.link}
                    target="_blank"
                  >
                    {ele.label}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <div className="w-48">
          <p>
            Dr. Charlotte Fang <br /> 69, street 420, San Francisco, CA 1111,
            United States
          </p>
          <br />
          <p>
            Email:{" "}
            <a href="mailto:gm@unicornsf.com" className="underline">
              gm@unicornsf.com
            </a>
          </p>
        </div>
      </div>

      <div className="w-full md:w-2/3 md:mx-auto text-left md:text-center mt-10 md:mt-[120px] text-zui-silver text-xs md:text-sm">
        This coin is completely useless and for entertainment purposes only,
        you’d have to be a retarded unicorn to think otherwise. Oh well! © 2024
        rights reserved, you will be sued if not used improperly.{" "}
      </div>
    </footer>
  );
};

export default Footer;
