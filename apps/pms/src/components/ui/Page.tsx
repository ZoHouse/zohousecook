import { Breadcrumbs } from "@zo/moal";
import { Breadcrumb } from "@zo/definitions/admin";
import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

interface PageProps {
  children: React.ReactNode;
  breadCrumbs?: Breadcrumb[];
}

const Page: React.FC<PageProps> = ({ children, breadCrumbs }) => {
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
        className="flex flex-col w-full h-full py-6 md:py-10 px-6 xl:pr-[108px]"
        ref={pageRef}
      >
        {breadCrumbs && breadCrumbs.length > 0 && (
          <Breadcrumbs links={breadCrumbs} />
        )}
        {children}
      </section>
    </CSSTransition>
  );
};

export default Page;
