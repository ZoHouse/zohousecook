import React from "react";
import { rubikClassName, syneClassName } from "../../utils";
import { cn } from "@zo/utils/font";
import { useFadeInOnScroll } from "../../../hooks";

export interface Node {
  id: number;
  media: string;
  text: string;
}

interface NodesProps {
  nodes: Node[];
  title?: string;
  subtitle?: string;
}

const Nodes: React.FC<NodesProps> = ({ nodes, title, subtitle }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section className={`min-h-fit pt-10 md:pt-20 px-6 lg:px-[108px] max-w-[1400px] mx-auto ${nodes.length > 0 ? 'pb-10 md:pb-20' : 'pb-0'}`} ref={sectionRef}>
      {title && (
        <h4
          className={cn(
            "text-[40px] leading-8 -tracking-[3%] font-bold text-center uppercase",
            syneClassName
          )}
        >
          {title}
        </h4>
      )}
      {subtitle && (
        <p
          className={cn(
            "mt-4 md:mt-10 md:text-2xl md:leading-8 font-medium text-white/40 text-center tracking-[1%]",
            rubikClassName
          )}
        >
          {subtitle}
        </p>
      )}

      <div className={`flex flex-col h-full md:flex-row gap-8 md:gap-6 ${nodes.length > 0 ? 'mt-10' : ''}`}>
        {nodes.map((node) => (
          <div key={node.id} className="w-full md:w-1/3 rounded-3xl h-fit">
            <video
              src={node.media}
              className="w-full h-[400px] object-cover rounded-2xl"
              autoPlay
              loop
              playsInline
              controls={false}
              controlsList="nodownload"
              muted
            />
            <p
              className={cn(
                rubikClassName,
                "mt-6 text-2xl leading-8 font-medium text-center tracking-[1%]"
              )}
            >
              {node.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Nodes;
