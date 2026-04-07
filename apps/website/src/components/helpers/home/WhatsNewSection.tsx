import React, { useState } from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName, rubikClassName } from "../../utils/font";
import { cn } from "@zo/utils/font";

interface Role {
  icon: string;
  title: string;
  tagline: string;
  taglineColor: string;
  description: string;
  bullets: string[];
  bulletIcon: string;
  bulletColor: string;
  comingSoon?: boolean;
  proSection?: { text: string };
}

const roles: Role[] = [
  {
    icon: "🎬",
    title: "Creator",
    tagline: "Turn travel stories into income",
    taglineColor: "#f59e0b",
    description:
      "Complete daily quests — film reels, take photo dumps, share day-in-my-life stories at Zostel properties. Your content earns based on views and engagement.",
    bullets: [
      "Pick a daily quest (new every 24 hours)",
      "Create a reel or carousel at a Zostel property",
      "Post on Instagram, tag @zostel, send collab",
      "Earn rewards once reviewed and approved",
    ],
    bulletIcon: "✦",
    bulletColor: "text-amber-500",
    proSection: {
      text: "Earn real money per view instead of Zo Credits. Guaranteed payouts on every quest — not just the top 1 winner. Withdraw earnings directly to your bank account.",
    },
  },
  {
    icon: "🔗",
    title: "Tribebuilder",
    tagline: "Grow the tribe, earn commission",
    taglineColor: "#22c55e",
    description:
      "Get your personal Zo affiliate link. Share it on social media, with friends, in travel groups. Every booking that comes through your link earns you a commission.",
    bullets: [
      "Share your unique zo.xyz/c/you link anywhere",
      "Drive bookings to any Zostel, Zo House, or Zo Trip",
      "Track clicks, signups, and conversions in real-time",
      "Earn commission on every confirmed booking",
    ],
    bulletIcon: "✓",
    bulletColor: "text-emerald-500",
    proSection: {
      text: "Higher commission rates. Priority placement in the Zo creator directory. Exclusive referral bonuses on milestone bookings.",
    },
  },
  {
    icon: "⭐",
    title: "Host",
    tagline: "Bring people together",
    taglineColor: "#3b82f6",
    description:
      "Host events, workshops, jam sessions, treks, or cultural experiences at Zostel properties. Be the reason travellers have their best night.",
    bullets: [
      "Propose an event at any listed Zostel property",
      "Get approved and promoted to the property's guests",
      "Host the event and get rated by attendees",
      "Build your hosting reputation across the community",
    ],
    bulletIcon: "✓",
    bulletColor: "text-blue-500",
    comingSoon: true,
  },
  {
    icon: "🏗",
    title: "Builder",
    tagline: "Open doors for the community",
    taglineColor: "#f97316",
    description:
      "Have a space — a terrace, a café, a studio, a farmhouse? List it as a venue for community events, meetups, and co-working sessions.",
    bullets: [
      "List your space on the Zo World platform",
      "Set availability, capacity, and event types",
      "Host community events booked through Zo",
      "Earn from space rentals and become a Zo Partner",
    ],
    bulletIcon: "✓",
    bulletColor: "text-orange-500",
    comingSoon: true,
  },
];

const WhatsNewSection: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <>
      <div
        className="relative z-20 px-6 lg:px-[108px] max-w-[1400px] mx-auto"
        ref={sectionRef}
      >
        <h2
          className={cn("sub-heading-2 text-center font-bold", syneClassName)}
        >
          ✨ What&apos;s New? ✨
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {roles.map((role) => (
            <button
              key={role.title}
              onClick={() => setSelectedRole(role)}
              className="w-full rounded-2xl p-5 md:p-6 bg-gradient-to-b from-zui-light/80 to-zui-dark border border-zui-stroke/30 text-left hover:border-white/20 transition-colors"
            >
              <span className="text-3xl md:text-4xl">{role.icon}</span>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "text-lg md:text-2xl font-bold",
                    syneClassName
                  )}
                >
                  {role.title}
                </h3>
                {role.comingSoon && (
                  <span className="text-[10px] font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Coming Soon
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs md:text-sm font-medium italic mt-1",
                  rubikClassName
                )}
                style={{ color: role.taglineColor }}
              >
                {role.tagline}
              </p>
            </button>
          ))}
        </div>

        <hr className="w-[80%] md:w-[60%] horizontal-divider my-20 mx-auto" />
      </div>

      {/* Drawer */}
      {selectedRole && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setSelectedRole(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-zui-dark border-l border-zui-stroke/30 z-[101] overflow-y-auto animate-slide-in-right">
            <div className="p-6 md:p-8">
              {/* Close */}
              <button
                onClick={() => setSelectedRole(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl"
              >
                ✕
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-4xl">{selectedRole.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "text-3xl font-bold",
                        syneClassName
                      )}
                    >
                      {selectedRole.title}
                    </h3>
                    {selectedRole.comingSoon && (
                      <span className="text-[10px] font-semibold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium italic",
                      rubikClassName
                    )}
                    style={{ color: selectedRole.taglineColor }}
                  >
                    {selectedRole.tagline}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p
                className={cn(
                  "mt-6 text-base text-white/80 leading-relaxed",
                  rubikClassName
                )}
              >
                {selectedRole.description}
              </p>

              {/* What you do */}
              <div className="mt-6">
                <p
                  className={cn(
                    "text-xs font-semibold text-white/50 uppercase tracking-wider mb-4",
                    rubikClassName
                  )}
                >
                  What you do
                </p>
                <ul className="space-y-3">
                  {selectedRole.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-start gap-3 text-sm text-white/90",
                        rubikClassName
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 text-sm flex-shrink-0",
                          selectedRole.bulletColor
                        )}
                      >
                        {selectedRole.bulletIcon}
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Section */}
              {selectedRole.proSection && (
                <div className="mt-6 bg-zui-light/40 rounded-xl p-5 border border-zui-stroke/20">
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={cn(
                        "text-xs font-semibold text-white/60",
                        rubikClassName
                      )}
                    >
                      With Pro Passport
                    </p>
                    <span className="bg-gradient-to-br from-amber-400 to-purple-500 text-transparent bg-clip-text font-bold text-sm">
                      PRO
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm text-white/70 leading-relaxed",
                      rubikClassName
                    )}
                  >
                    {selectedRole.proSection.text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </>
  );
};

export default WhatsNewSection;
