import React from "react";
import Marquee from "react-fast-marquee";
import { cn } from "../../../lib/cn";
import { rubikClassName, syneClassName } from "../../../lib/font";
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll";

export interface Event {
  id: number;
  media: string;
  text: string;
}

interface EventsProps {
  events: Event[];
}

const Events: React.FC<EventsProps> = ({ events }) => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section className="py-20 px-6 lg:px-[108px] max-w-[1400px] mx-auto" ref={sectionRef}>
      <h4
        className={cn(
          "text-[40px] leading-8 -tracking-[3%] font-bold text-center uppercase",
          syneClassName
        )}
      >
        Events
      </h4>
      <p
        className={cn(
          "mt-4 md:mt-10 md:text-2xl md:leading-8 font-medium text-white/40 text-center tracking-[1%]",
          rubikClassName
        )}
      >
        Round the year cultural events from art to code at Zo Nodes
      </p>

      <Marquee className="mt-10 overflow-hidden" speed={40}>
        <div className="flex">
          {events.map((event) => (
            <div key={event.id} className="w-[288px] rounded-3xl flex-shrink-0 mx-3">
              <video
                src={event.media}
                className="w-[288px] aspect-square object-cover rounded-2xl"
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
                  "mt-6 md:text-2xl md:leading-8 font-medium text-center tracking-[1%]"
                )}
              >
                {event.text}
              </p>
            </div>
          ))}
        </div>
      </Marquee>
    </section>
  );
};

export default Events;
