import { Breadcrumb } from "antd";
import { cn } from "@zo/utils/font";
import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";
import Link from "next/link";

interface PageProps {
  children: React.ReactNode;
  breadCrumbs?: Array<{ label: string; href: string }>;
  className?: string;
}

const Page: React.FC<PageProps> = ({ children, breadCrumbs, className }) => {
  const pageRef = useRef<HTMLElement>(null);

  return (
    <CSSTransition
      classNames="fade-up-small"
      in
      unmountOnExit
      mountOnEnter
      timeout={300}
      nodeRef={pageRef}
      appear
    >
      <section
        className={cn(
          "flex flex-col mt-[72px] md:mt-0 w-full h-full py-6 md:py-10 px-6 xl:pr-[108px]",
          className
        )}
        ref={pageRef}
      >
        {breadCrumbs && breadCrumbs.length > 0 && (
          <Breadcrumb
            items={breadCrumbs.map((link) => ({
              title: link.href ? (
                <Link href={link.href}>{link.label}</Link>
              ) : (
                link.label
              ),
            }))}
          />
        )}
        {children}
      </section>
    </CSSTransition>
  );
};

export default Page;
