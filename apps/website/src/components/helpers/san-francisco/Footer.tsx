import { ZoWorld } from "@zo/assets/brands";
import Icon, { IconName } from "@zo/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import { socialLinks } from "../../../config";

const Footer: React.FC = () => {
  const [focus, setFocus] = useState<string | null>(null);
  const [zoWorldFocus, setZoWorldFocus] = useState<boolean>(false);

  return (
    <footer>
      <hr className="w-full horizontal-divider my-6" />
      <div className="flex flex-col-reverse md:flex-row items-center justify-between py-10">
        <Link
          href="/"
          className="flex flex-row justify-center items-center group hover:cursor-pointer gap-4 h-full mt-6 md:mt-0"
          onMouseEnter={setZoWorldFocus.bind(null, true)}
          onMouseLeave={setZoWorldFocus.bind(null, false)}
        >
          <ZoWorld fill={zoWorldFocus ? "#fff" : "#5a5a5a"} />
        </Link>
        <div className="hidden md:flex items-center justify-center space-x-6 md:space-x-10">
          <Link
            className="text-zui-silver hover:text-zui-white"
            href={"/privacy"}
          >
            Privacy
          </Link>
          <Link
            className="text-zui-silver hover:text-zui-white"
            href={"/terms"}
          >
            Terms
          </Link>
        </div>
        <div className="flex md:gap-10 flex-1 md:flex-grow-0 justify-center gap-6 items-center">
          {socialLinks.map((link, index) => (
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              key={index}
              className="cursor-pointer"
              onMouseEnter={setFocus.bind(null, link.icon)}
              onMouseLeave={setFocus.bind(null, null)}
            >
              <Icon
                name={link.icon as IconName}
                fill={focus === link.icon ? "#fff" : "#5a5a5a"}
                size={24}
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
