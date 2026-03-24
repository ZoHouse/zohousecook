import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

interface PageProps {
  children?: React.ReactNode;
}

const Page: React.FC<PageProps> = ({ children }) => {
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
      <section className="pl-6 pr-6 pt-10 h-full flex flex-col" ref={pageRef}>
        {children}
      </section>
    </CSSTransition>
  );
};

export default Page;
