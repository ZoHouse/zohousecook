import Icon from "@zo/assets/icons";
import { useAuth } from "@zo/auth";
import { useWindowSize } from "@zo/utils/hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { navigationLinks } from "../../config/";
import { Button, Menu } from "../ui";
import { cn, rubikClassName, scrollToId } from "../utils";

interface HeaderProps {}

export type NavigationLinksType = {
  [key: string]: {
    links: Array<{
      id?: string;
      href?: string;
      label: string;
      showOnWebHeader?: boolean;
    }>;
  };
};

const Header: React.FC<HeaderProps> = () => {
  const router = useRouter();
  const { isMobile } = useWindowSize();

  const [hasUserScrolled, setScrolled] = useState<boolean>(false);
  const [isMenuOpen, setMenuOpen] = useState<boolean>(false);

  const goto = (route: string | undefined) => {
    if (route) {
      router.push(route, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { showLoginModal, isLoggedIn } = useAuth();

  const handleLogin = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      showLoginModal(undefined, "/dashboard");
    }
  };

  return (
    <>
      <div className="overflow-hidden w-full">
        <nav className="fixed w-full px-6 lg:px-[108px] bg-gradient-to-b from-zui-dark to-transparent flex z-80 justify-between items-center py-6 lg:py-10 lg:h-fit">
          <Link className="flex items-center gap-4" href="/">
            <img
              className="w-10 aspect-square object-contain"
              src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/338ca184-4bb8-4487-b6e1-79a9b3809f0f_20240828105503.gif`}
              alt="zo-zo"
            />
            <div className={rubikClassName}>
              <h6 className={cn("hidden md:block font-semibold")}>Zo World</h6>
              <p className="hidden md:block text-sm text-zui-white pointer-events-none">
                Follow Your Heart
              </p>
            </div>
          </Link>

          {isMobile ? (
            navigationLinks[router.asPath] && (
              <button onClick={() => setMenuOpen(true)}>
                <Icon name="Menu" size={40} />
              </button>
            )
          ) : (
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-10 w-fit cursor-pointer"
              >
                {navigationLinks[router.asPath]?.links
                  .filter((l) => l.showOnWebHeader)
                  .map((link, index) => (
                    <Button
                      key={`web-navlink-${index}`}
                      type="tertiary"
                      onClick={
                        link.id
                          ? scrollToId.bind(null, link.id)
                          : goto.bind(null, link.href)
                      }
                    >
                      {link.label}
                    </Button>
                  ))}
                {router.pathname === "/" && (
                  <button
                    onClick={handleLogin}
                    className={cn(
                      "px-6 py-4 rounded-xl md:w-fit border border-zui-lightest bg-zui-dark font-semibold",
                      rubikClassName
                    )}
                  >
                    {isLoggedIn ? "Passport" : "Login"}
                  </button>
                )}
              </div>

            </div>
          )}
        </nav>
      </div>

      {isMobile && navigationLinks[router.asPath] && (
        <Menu isOpen={isMenuOpen} onClose={setMenuOpen.bind(null, false)} />
      )}
    </>
  );
};

export default Header;
