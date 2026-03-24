import { useRouter } from "next/router";
import React from "react";

interface PageButtonProps {
  link: string;
  name: string;
  subtext?: string;
}

const PageButton: React.FC<PageButtonProps> = ({ name, subtext, link }) => {
  const router = useRouter();

  const goto = (link: string) => {
    router.push(link);
  };

  return (
    <button
      className="flex flex-col items-center justify-center w-full h-auto px-4 py-10 md:w-80 bg-zui-light hover:opacity-80"
      onClick={goto.bind(null, link)}
    >
      <div className="text-xl mb-2 font-semibold">{name}</div>
      <div className="text-sm font-semibold text-zinc-400">
        {subtext || `Manage ${name}`}
      </div>
    </button>
  );
};

export default PageButton;
