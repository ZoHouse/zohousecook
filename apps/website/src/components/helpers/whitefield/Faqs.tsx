import { sendGTMEvent } from "@next/third-parties/google";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { formatCapitalize } from "@zo/utils/string";
import React, { useEffect, useRef, useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName } from "../../utils";

interface FaqsProps {
  faqs: GeneralObject;
}

const FAQsSection: React.FC<FaqsProps> = ({ faqs }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const [selectedCategory, setCategory] = useState<string>(
    Object.keys(faqs)?.[0] || ""
  );

  return (
    <section ref={sectionRef} id="faqs">
      <h2 id="faqs" className="sub-heading-2 text-center">
        FAQs
      </h2>
      <div className="flex justify-start md:justify-center items-center gap-4 mt-6 md:mt-10 overflow-x-scroll hide-scrollbar">
        {Object.keys(faqs).map((faqCategory: string) => (
          <button
            onClick={setCategory.bind(null, faqCategory)}
            className={cn(
              "px-4 py-2 rounded-full border",
              selectedCategory === faqCategory
                ? "border-zui-white"
                : "border-zui-stroke"
            )}
            key={faqCategory}
          >
            {formatCapitalize(faqCategory)}
          </button>
        ))}
      </div>
      <div className="w-full md:w-1/2 mx-auto mt-10">
        {faqs[selectedCategory].map(
          (faq: { id: number; title: string; description: string }) => (
            <Faq key={faq.id} description={faq.description} title={faq.title} />
          )
        )}
      </div>
    </section>
  );
};

interface FaqProps {
  title: string;
  description: string;
}

const Faq: React.FC<FaqProps> = ({ description, title }) => {
  const [isExpanded, setExpanded] = useState<boolean>(false);
  const [maxHeight, setMaxHeight] = useState<string>("0px");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(isExpanded ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [isExpanded]);

  const toggleExpand = () => {
    sendGTMEvent({ event: "expand_faq" });
    setExpanded((prev) => !prev);
  };

  return (
    <>
      <div className={cn("w-full relative z-20", rubikClassName)}>
        <div
          onClick={toggleExpand}
          className="flex justify-between items-center cursor-pointer"
        >
          <h6 className="font-medium text-base">{title}</h6>
          <button>
            <Icon
              name={isExpanded ? "AngleUp" : "AngleDown"}
              size={24}
              fill="#5a5a5a"
            />
          </button>
        </div>
        <div
          ref={contentRef}
          style={{ maxHeight }}
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded && "mt-4"
          )}
        >
          <p
            className="font-medium text-base text-zui-silver"
            dangerouslySetInnerHTML={{ __html: description }}
          ></p>
        </div>
      </div>
      <hr className="horizontal-divider my-6" />
    </>
  );
};

export default FAQsSection;
