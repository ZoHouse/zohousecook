import { ZoWorld } from "@zo/assets/brands";
import Icon, { IconName } from "@zo/assets/icons";
import Link from "next/link";
import React, { useState } from "react";
import { socialLinks } from "../../../config";

interface SingaporePageFooterProps {}

const SingaporePageFooter: React.FC<SingaporePageFooterProps> = () => {
  const [focus, setFocus] = useState<string | null>(null);
  const [zoWorldFocus, setZoWorldFocus] = useState<boolean>(false);

  return (
    <footer>
      <hr className="w-full horizontal-divider my-10" />
      <div className="flex gap-6 justify-center items-center mt-10">
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

      <Link
        href="/"
        className="flex flex-row justify-center items-center group hover:cursor-pointer mt-10"
        onMouseEnter={setZoWorldFocus.bind(null, true)}
        onMouseLeave={setZoWorldFocus.bind(null, false)}
      >
        <ZoWorld className="w-40" fill={zoWorldFocus ? "#fff" : "#5a5a5a"} />
      </Link>
    </footer>
  );
};

export default SingaporePageFooter;
