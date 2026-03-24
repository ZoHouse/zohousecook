import Icon from "@zo/assets/icons";
import Link from "next/link";
import React from "react";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <div className="overflow-hidden w-full">
      <nav className="fixed w-full px-6 lg:px-[108px] bg-gradient-to-b from-zui-dark to-transparent flex z-50 justify-between items-center py-6 lg:py-10 lg h-fit">
        <Link href="/">
          <Icon name="Zo" size={40} fill="#fff" />
        </Link>
      </nav>
    </div>
  );
};

export default Header;
