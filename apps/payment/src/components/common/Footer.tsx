import Icon, { IconName } from "@zo/assets/icons";
import Link from "next/link";
import React from "react";
import { socialLinks } from "../../config";

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="mt-10 lg:mt-32 mx-auto max-w-[1400px] w-full px-6 lg:px-[108px]">
      <div className="border-t border-zui-light w-full h-fit flex flex-col pt-6 lg:pt-20 items-center">
        <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row justify-between items-center w-full">
          <div className="flex-1 flex justify-start">
            <span className="text-zui-silver">Zo World Inc</span>
          </div>
          <ul className="flex items-center justify-center flex-1 space-x-10">
            <Link className="hover:text-zui-neon" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-zui-neon" href="/terms">
              Terms
            </Link>
          </ul>
          <div className="flex flex-1 justify-end items-center space-x-6">
            {socialLinks.map((link, index) => (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                key={index}
                className="cursor-pointer"
              >
                <Icon name={link.icon as IconName} fill="#5a5a5a" size={24} />
              </a>
            ))}
          </div>
        </div>
        <span className="lg:text-[250px] lg:h-[274px] text-[72px] h-[76px] mt-12 lg:mt-0 overflow-hidden tracking-[1%] text-zui-light font-bold select-none">
          Zo World
        </span>
      </div>
    </footer>
  );
};

export default Footer;
