import { Zo } from "@zo/assets/brands";
import Icon, { IconName } from "@zo/assets/icons";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { socialLinks } from "../../config";
import Button from "../ui/Button";
import { cn, rubikClassName } from "../utils";

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const router = useRouter();

  const [focus, setFocus] = useState<string | null>(null);
  const [zoWorldFocus, setZoWorldFocus] = useState<boolean>(false);
  //comment to trigger build

  return (
    <footer className="mt-10 md:pt-0 lg:mt-32 mx-auto w-full max-w-[1400px] px-6 lg:px-[108px] mb-20 md:mb-[120px]">
      <div className="border-t border-zui-light w-full h-fit flex flex-col py-10 lg:py-16 items-center">
        <div className="flex flex-col-reverse flex-wrap gap-10 items-center md:items-center lg:flex-row justify-between w-full">


          <Link
            onMouseEnter={setZoWorldFocus.bind(null, true)}
            onMouseLeave={setZoWorldFocus.bind(null, false)}
            className="flex items-center gap-4"
            href="/"
          >
            <Zo
              fill={zoWorldFocus ? "#fff" : "#5a5a5a"}
              className="h-10 w-10"
            />
            <div className={rubikClassName}>
              <h6
                className={cn(
                  "font-semibold",
                  zoWorldFocus ? "text-zui-white" : "text-zui-silver"
                )}
              >
                Zo World
              </h6>
              <p
                className={cn(
                  "text-sm text-zui-white pointer-events-none",
                  zoWorldFocus ? "text-zui-white" : "text-zui-silver"
                )}
              >
                Follow Your Heart
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center justify-center space-x-6 md:space-x-10">
            <Button
              type="tertiary"
              onClick={router.push.bind(null, "/privacy")}
            >
              Privacy
            </Button>
            <Button type="tertiary" onClick={router.push.bind(null, "/terms")}>
              Terms
            </Button>
          </div>

          <div className="flex gap-6 flex-1 md:flex-grow-0 justify-between items-center">
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


          <div className="flex md:hidden items-center justify-center gap-10">
            <Button
              type="tertiary"
              onClick={router.push.bind(null, "/privacy")}
            >
              Privacy
            </Button>
            <Button type="tertiary" onClick={router.push.bind(null, "/terms")}>
              Terms
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
