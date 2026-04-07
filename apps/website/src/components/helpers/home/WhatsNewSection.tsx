import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName, rubikClassName } from "../../utils/font";
import { cn } from "@zo/utils/font";

/* ── SVG Icons matching Figma ── */

const TravellerIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{
      background: "linear-gradient(135.38deg, #FFB68F 3.44%, #F66409 98.45%)",
    }}
  >
    <div className="flex flex-row items-start gap-0">
      <div
        className="w-[19px] h-[48px] rounded-[2px]"
        style={{
          background:
            "linear-gradient(161.08deg, #E28539 5.06%, #A44D01 66.51%)",
        }}
      />
      <div
        className="w-[19px] h-[48px] rounded-[2px] -scale-x-100"
        style={{
          background:
            "linear-gradient(136.97deg, #E18710 31.79%, #8B4414 68.7%)",
        }}
      />
      <div
        className="w-[19px] h-[48px] rounded-[2px]"
        style={{
          background:
            "linear-gradient(161.44deg, #B9481F 5.1%, #B35F10 85.46%)",
        }}
      />
    </div>
  </div>
);

const CreatorIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{
      background: "linear-gradient(135.38deg, #E7C7FF 3.44%, #6000AA 98.45%)",
    }}
  >
    <svg width="56" height="56" viewBox="0 0 47 47" fill="none">
      <path
        d="M23.5 0L29.5 17.5H47L33 29L38.5 47L23.5 35.5L8.5 47L14 29L0 17.5H17.5L23.5 0Z"
        fill="url(#creator-grad)"
      />
      <defs>
        <linearGradient
          id="creator-grad"
          x1="0"
          y1="0"
          x2="47"
          y2="47"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.3179" stopColor="#950DFF" />
          <stop offset="0.687" stopColor="#590899" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const TribebuilderIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{
      background: "linear-gradient(135.38deg, #FFC7DD 3.44%, #AA0036 98.45%)",
    }}
  >
    <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
      <path
        d="M24 2L44 14V34L24 46L4 34V14L24 2Z"
        fill="url(#tribe-grad)"
      />
      <defs>
        <linearGradient
          id="tribe-grad"
          x1="4"
          y1="2"
          x2="44"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.3179" stopColor="#FF0D56" />
          <stop offset="0.687" stopColor="#99083B" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const HostIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{
      background: "linear-gradient(135.38deg, #CEFFF9 3.44%, #00AA61 98.45%)",
    }}
  >
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <path
        d="M28 2L34.5 20.5H54L38.5 32L44 52L28 40L12 52L17.5 32L2 20.5H21.5L28 2Z"
        fill="url(#host-grad)"
      />
      <defs>
        <linearGradient
          id="host-grad"
          x1="2"
          y1="2"
          x2="54"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.3179" stopColor="#0E825A" />
          <stop offset="0.687" stopColor="#08995A" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ── Small icons for Pro Passport perks ── */

const SmallTravellerIcon = () => (
  <div
    className="w-8 h-8 flex items-center justify-center rounded-[6.4px] flex-shrink-0"
    style={{
      background: "linear-gradient(135.38deg, #FFB68F 3.44%, #F66409 98.45%)",
    }}
  >
    <div className="flex flex-row items-start gap-0">
      <div
        className="w-[6.5px] h-[16px] rounded-[0.7px]"
        style={{
          background:
            "linear-gradient(161.08deg, #E28539 5.06%, #A44D01 66.51%)",
        }}
      />
      <div
        className="w-[6.5px] h-[16px] rounded-[0.7px] -scale-x-100"
        style={{
          background:
            "linear-gradient(136.97deg, #E18710 31.79%, #8B4414 68.7%)",
        }}
      />
      <div
        className="w-[6.5px] h-[16px] rounded-[0.7px]"
        style={{
          background:
            "linear-gradient(161.44deg, #B9481F 5.1%, #B35F10 85.46%)",
        }}
      />
    </div>
  </div>
);

const SmallCreatorIcon = () => (
  <div
    className="w-8 h-8 flex items-center justify-center rounded-[6.4px] flex-shrink-0"
    style={{
      background: "linear-gradient(135.38deg, #E7C7FF 3.44%, #6000AA 98.45%)",
    }}
  >
    <svg width="24" height="24" viewBox="0 0 47 47" fill="none">
      <path
        d="M23.5 0L29.5 17.5H47L33 29L38.5 47L23.5 35.5L8.5 47L14 29L0 17.5H17.5L23.5 0Z"
        fill="url(#creator-grad-sm)"
      />
      <defs>
        <linearGradient
          id="creator-grad-sm"
          x1="0"
          y1="0"
          x2="47"
          y2="47"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.3179" stopColor="#950DFF" />
          <stop offset="0.687" stopColor="#590899" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const SmallTribebuilderIcon = () => (
  <div
    className="w-8 h-8 flex items-center justify-center rounded-[6.4px] flex-shrink-0"
    style={{
      background: "linear-gradient(135.38deg, #FFC7DD 3.44%, #AA0036 98.45%)",
    }}
  >
    <svg width="19" height="19" viewBox="0 0 48 48" fill="none">
      <path
        d="M24 2L44 14V34L24 46L4 34V14L24 2Z"
        fill="url(#tribe-grad-sm)"
      />
      <defs>
        <linearGradient
          id="tribe-grad-sm"
          x1="4"
          y1="2"
          x2="44"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.3179" stopColor="#FF0D56" />
          <stop offset="0.687" stopColor="#99083B" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const TickIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0" style={{ background: "#322832" }}>
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="url(#tick-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="tick-grad" x1="1" y1="5" x2="11" y2="1.5" gradientUnits="userSpaceOnUse">
          <stop offset="0.3155" stopColor="#950DFF" />
          <stop offset="1.6869" stopColor="#590899" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ── Card config ── */

interface RoleCard {
  title: string;
  tagline: string;
  taglineColor: string;
  description?: string;
  glowColor: string;
  comingSoon?: boolean;
  icon: React.ReactNode;
}

const roles: RoleCard[] = [
  {
    title: "Traveller",
    tagline: "Travel like a pro",
    taglineColor: "#F87B2F",
    glowColor: "#FDAA7B",
    icon: <TravellerIcon />,
  },
  {
    title: "Creator",
    tagline: "Turn travel stories into income",
    taglineColor: "#B85DFF",
    glowColor:
      "linear-gradient(180deg, #950DFF 18.27%, rgba(212, 156, 255, 0.3) 52.88%)",
    description: undefined,
    icon: <CreatorIcon />,
  },
  {
    title: "Tribebuilder",
    tagline: "Grow the tribe, earn commission",
    taglineColor: "#FF0D55",
    glowColor: "#CE0A48",
    icon: <TribebuilderIcon />,
  },
  {
    title: "Host",
    tagline: "Bring people together",
    taglineColor: "#29BB7F",
    glowColor: "#1CB675",
    comingSoon: true,
    icon: <HostIcon />,
  },
];

/* ── Pro Passport perks ── */

const proPerks = [
  {
    section: "Travel Perks",
    icon: <SmallTravellerIcon />,
    items: [
      "Earn real money on views \u2014 withdraw to bank",
      "Guaranteed rewards on every quest",
      "Earn real money per view",
      "One more perk if available",
    ],
  },
  {
    section: "Creator Perks",
    icon: <SmallCreatorIcon />,
    items: [
      "Earn real money on views \u2014 withdraw to bank",
      "Guaranteed rewards on every quest",
      "Earn real money per view",
      "One more perk if available",
    ],
  },
  {
    section: "Tribebuilder Perks",
    icon: <SmallTribebuilderIcon />,
    items: [
      "Higher commission rates on referrals",
      "One more Benefit",
    ],
  },
];

/* ── Component ── */

const WhatsNewSection: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <div
      className="relative z-20 px-6 lg:px-[108px] max-w-[1400px] mx-auto"
      ref={sectionRef}
    >
      {/* Section heading */}
      <p
        className={cn(
          "text-xs md:text-sm uppercase tracking-[0.2em] text-white/60 text-center font-medium",
          rubikClassName
        )}
      >
        THE ZO COMMUNITY
      </p>
      <h2
        className={cn(
          "text-3xl md:text-[48px] md:leading-[58px] text-center font-semibold text-white mt-4",
          syneClassName
        )}
      >
        One passport.<br />
        Unlimited ways to belong.
      </h2>
      <p
        className={cn(
          "text-sm md:text-base text-white/70 text-center mt-4 leading-relaxed",
          rubikClassName
        )}
      >
        Every human has a unique vibration.<br />
        Pick your Vibe and join the journey.
      </p>

      {/* ── Vibe Cards ── */}
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mt-10">
        {roles.map((role) => (
          <div
            key={role.title}
            className="relative flex-1 min-w-0 flex flex-col items-start p-6 gap-4 overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #292929 -14.43%, #000000 116.42%)",
              boxShadow:
                "0px 4px 4px rgba(0, 0, 0, 0.25), inset 0px 1.93px 7.71px rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(48px)",
              borderRadius: "24px",
            }}
          >
            {/* Glow */}
            <div
              className="absolute w-[159px] h-[159px] -left-9 -top-9 pointer-events-none"
              style={{
                background: role.glowColor,
                filter: "blur(80px)",
                zIndex: 0,
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col gap-4">
              {role.icon}

              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <h3
                    className={cn(
                      "text-2xl md:text-[28px] md:leading-[34px] font-semibold text-white",
                      syneClassName
                    )}
                  >
                    {role.title}
                  </h3>
                  {role.comingSoon && (
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                        rubikClassName
                      )}
                      style={{
                        background: "#2B3228",
                        color: "#54B835",
                      }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm md:text-base leading-[24px] mt-1",
                    rubikClassName
                  )}
                  style={{ color: role.taglineColor }}
                >
                  {role.tagline}
                </p>
              </div>

              {role.description && (
                <p
                  className={cn(
                    "text-xs md:text-[13px] leading-[20px] tracking-[0.01em]",
                    rubikClassName
                  )}
                  style={{ color: "rgba(255, 255, 255, 0.55)" }}
                >
                  {role.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Plans Section ── */}
      <div className="flex flex-col items-center mt-20 gap-6">
        <div className="flex flex-col items-center gap-4 max-w-[808px] text-center">
          <h2
            className={cn(
              "text-3xl md:text-[56px] md:leading-[67px] font-semibold text-white",
              syneClassName
            )}
          >
            Free gets you in. Pro gets you paid.
          </h2>
          <p
            className={cn(
              "text-lg md:text-xl leading-[30px] text-white",
              rubikClassName
            )}
          >
            Every citizen can participate. Pro citizens earn real money.
          </p>
        </div>

        {/* Pro Passport Card */}
        <div
          className="relative w-full max-w-[808px] flex flex-col p-6 gap-4 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #292929 -14.43%, #000000 116.42%)",
            boxShadow:
              "0px 4px 4px rgba(0, 0, 0, 0.25), inset 0px 1.93px 7.71px rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(48px)",
            borderRadius: "24px",
          }}
        >
          {/* Glow */}
          <div
            className="absolute w-[159px] h-[159px] -left-9 -top-9 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, #FFAE0D 18.27%, rgba(255, 206, 156, 0.3) 52.88%)",
              filter: "blur(80px)",
              zIndex: 0,
            }}
          />

          {/* Header row: passport icon + title + price */}
          <div className="relative z-10 flex items-center gap-4 p-4">
            {/* Passport icon */}
            <img
              src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/9685203b-b49f-4c52-9caf-7869cce83eb0_20240823082641.png?w=400`}
              alt="Pro Passport"
              className="w-16 h-16 md:w-20 md:h-20 object-contain flex-shrink-0"
            />

            <div className="flex flex-col gap-1 flex-1">
              <h3
                className={cn(
                  "text-2xl font-bold text-white",
                  syneClassName
                )}
              >
                Pro Passport
              </h3>
              <p
                className={cn(
                  "text-sm text-white tracking-[0.01em]",
                  rubikClassName
                )}
              >
                All roles. All perks. One price.
              </p>
            </div>

            <div className="flex flex-col items-end flex-shrink-0">
              <span
                className={cn(
                  "text-[36px] leading-[43px] font-semibold",
                  syneClassName
                )}
                style={{
                  background:
                    "linear-gradient(0deg, rgba(255,255,255,0.8), rgba(255,255,255,0.8)), linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0px 0px 3.5px rgba(49, 255, 155, 0.7)",
                }}
              >
                &#8377;499
              </span>
              <span
                className={cn(
                  "text-sm tracking-[0.01em]",
                  rubikClassName
                )}
                style={{ color: "rgba(255, 255, 255, 0.55)" }}
              >
                /per month
              </span>
            </div>
          </div>

          {/* Perk sections */}
          {proPerks.map((perk) => (
            <div key={perk.section} className="relative z-10 p-4 rounded-3xl">
              <div className="flex items-center gap-4 mb-4">
                {perk.icon}
                <h4
                  className={cn(
                    "text-xl font-semibold text-white",
                    syneClassName
                  )}
                >
                  {perk.section}
                </h4>
              </div>
              <div className="flex flex-col gap-2">
                {perk.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <TickIcon />
                    <span
                      className={cn(
                        "text-sm leading-[21px] tracking-[0.01em] text-white",
                        rubikClassName
                      )}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* CTA Button */}
          <div className="relative z-10 flex justify-end mt-4">
            <a
              href="/passport"
              className={cn(
                "px-8 py-[14px] text-center font-medium text-base text-[#111111] rounded-xl",
                rubikClassName
              )}
              style={{
                background:
                  "linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(89.93deg, #B9FFCF 1.66%, #FFE880 31.68%, #FFB591 64.46%, #FFB4CA 97.11%)",
              }}
            >
              Get Pro Passport
            </a>
          </div>
        </div>
      </div>

      <hr className="w-[80%] md:w-[60%] horizontal-divider my-20 mx-auto" />
    </div>
  );
};

export default WhatsNewSection;
