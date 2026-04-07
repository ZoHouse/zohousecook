import React from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import GlowCard from "./GlowCard";

interface ReferralSectionProps {
  handle: string;
}

const ReferralSection: React.FC<ReferralSectionProps> = ({ handle }) => {
  const router = useRouter();
  const basePath = router.basePath || "";

  const copyLink = () => {
    navigator.clipboard.writeText(`https://zo.xyz/@${handle}`);
    toast.success("Link copied!");
  };

  return (
    <div>
      {/* Top card */}
      <GlowCard className="rounded-tl-2xl rounded-tr-2xl rounded-bl-none rounded-br-none p-4">
        <p
          className="text-white leading-[30px]"
          style={{ fontSize: 20 }}
        >
          Invite friends to unlock their Passport with your link and earn 7%
          on every booking they make for up to 1 year
        </p>

        {/* Zo Link pill */}
        <div className="bg-[#202020] rounded-full flex items-center px-3 py-1 gap-1 mt-4 w-fit">
          <span
            className="text-white/55"
            style={{ fontSize: 12 }}
          >
            Your Zo Link
          </span>
          <span
            className="text-white font-medium"
            style={{ fontSize: 16 }}
          >
            zo.xyz/@{handle}
          </span>
          <button
            className="bg-[#111] rounded-full px-3 py-2 text-white font-medium ml-1"
            style={{ fontSize: 12 }}
            onClick={copyLink}
          >
            Copy
          </button>
        </div>

        <button
          className="text-white font-medium mt-2 block"
          style={{ fontSize: 14 }}
        >
          How it Works?
        </button>
      </GlowCard>

      {/* Bottom card — gradient bar */}
      <div
        className="rounded-bl-2xl rounded-br-2xl backdrop-blur p-4 flex items-center justify-center gap-2"
        style={{
          backgroundImage: `url(${basePath}/passport/gradient-bar.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "inset 0px 2px 8px 0px rgba(255,255,255,0.25)",
        }}
      >
        <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center flex-shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
              fill="#111"
            />
          </svg>
        </span>
        <span
          className="text-white font-medium"
          style={{ fontSize: 14 }}
        >
          Share your Passport on Instagram
        </span>
      </div>
    </div>
  );
};

export default ReferralSection;
