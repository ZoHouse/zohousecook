import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useWindowSize } from "@zo/utils/hooks";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { navigationLinks } from "../../config";
import { scrollToId } from "../utils";
import Button from "./Button";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { isMobile } = useWindowSize();

  const openMembership = () => {
    router.push("/membership");
  };

  const goto = (route: string | undefined) => {
    if (route) {
      router.push(route, undefined, { shallow: true });
    }
  };

  const handleScroll = (id: string | undefined) => {
    if (id) {
      scrollToId(id);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  return (
    <section
      className={cn(
        "relative duration-300 ease-out bg-zui-dark fixed top-0  w-screen h-screen z-100 px-6w-[60%] md:px-[108px] pt-32 -right-full overflow-hidden",
        isOpen ? "-translate-x-full" : "translate-x-0"
      )}
    >
      <button
        onClick={onClose}
        className="absolute bg-zui-light md:bg-transparent p-3 rounded-full top-6 right-6 md:top-10 md:right-28"
      >
        <Icon name="Cross" size={isMobile ? 16 : 40} fill="#fff" />
      </button>
      <div className="flex flex-col items-center gap-6 w-full">
        {navigationLinks[router.asPath]?.links.map((link, index) => (
          <>
            <button
              role="link"
              key={`menu-navlink-${index}`}
              onClick={
                link.id
                  ? handleScroll.bind(null, link.id)
                  : goto.bind(null, link.href)
              }
              className="text-base font-medium text-zui-white"
            >
              {link.label}
            </button>
            <hr className="horizontal-divider w-[80%] md:w-[60%]" />
          </>
        ))}
      </div>

      {!isMobile && (
        <Button className="h-fit max-w-xs" onClick={openMembership}>
          Become a Member
        </Button>
      )}
    </section>
  );
};

export default Menu;
