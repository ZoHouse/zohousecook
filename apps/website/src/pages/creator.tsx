import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@zo/auth";

function Benefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/5 border border-white/10">
      <h3 className="text-white font-semibold text-base">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function CreatorLandingPage() {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();

  const handleBecomeCitizen = () => {
    if (isLoggedIn) {
      router.push("/passport");
    } else {
      showLoginModal(undefined, "/passport");
    }
  };

  const handleBecomePro = () => {
    if (isLoggedIn) {
      router.push("/passport");
    } else {
      showLoginModal(undefined, "/passport");
    }
  };

  return (
    <>
      <Head>
        <title>Start Your Creator Journey · Zo World</title>
        <meta
          name="description"
          content="Travel and earn with Zo Passport. Join the creator program, turn your reels into rewards, and invite your tribe."
        />
        <meta property="og:title" content="Start Your Creator Journey · Zo World" />
        <meta
          property="og:description"
          content="Travel and earn with Zo Passport. Join the creator program, turn your reels into rewards, and invite your tribe."
        />
      </Head>

      <main className="flex-1 min-h-screen bg-[#111]">
        <section className="max-w-3xl mx-auto px-4 pt-36 pb-12 text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-4">
            Zo World Creator Program
          </p>
          <h1 className="text-white font-bold text-4xl md:text-6xl leading-tight mb-6">
            Start your creator journey with Zo World
          </h1>
          <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Unlock your Passport, post reels, invite your tribe, and earn
            commissions on every booking that happens through your link.
          </p>

          <div className="flex flex-col md:flex-row gap-3 max-w-md mx-auto">
            <button
              onClick={handleBecomeCitizen}
              className="flex-1 py-3.5 rounded-full bg-white text-black font-semibold text-base"
            >
              Become a Citizen
            </button>
            <button
              onClick={handleBecomePro}
              className="flex-1 py-3.5 rounded-full bg-white/10 text-white font-semibold text-base border border-white/20"
            >
              Become a Pro Citizen
            </button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            <Benefit
              title="Travel and earn"
              description="Copy your Passport link to your IG bio. Earn commission on every booking from anyone who unlocks their Passport through your link, for up to 1 year."
            />
            <Benefit
              title="Reel quests"
              description="Post weekly reels about Zostel destinations. Qualify for XP, Zo Credits, and bed drops. The more you create, the more you earn."
            />
            <Benefit
              title="Passport rank"
              description="Unlock stamps, badges, and trophies as you travel and create. Climb the Zo World leaderboard and become a Season Champion."
            />
          </div>
        </section>
      </main>
    </>
  );
}
