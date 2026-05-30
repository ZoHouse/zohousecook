import { BlurFade } from "./helpers/house/BlurFade";

// Event hosting section on /live. Surfaces the kinds of things people run at
// Zo House and points them at the public event enquiry Typeform. Sits after
// House programming, right before the bottom CTA, so the natural read is
// "here are the rituals -> want to run your own? pitch it".

const EVENT_TYPES = [
  "Hackathons",
  "Meetups",
  "Founder dinners",
  "Demo days",
  "Launches",
  "Workshops",
];

const ENQUIRY_FORM_URL = "https://zostel.typeform.com/to/LgcBfa0M";

export function HostAtZoHouse() {
  return (
    <section className="relative px-5 md:px-10 lg:px-20 pb-14 md:pb-20">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="max-w-6xl mx-auto pt-12 md:pt-16">
        <BlurFade inView delay={0.05} direction="up">
          <div className="text-center max-w-2xl mx-auto mb-7 md:mb-10">
            <p className="text-[9px] md:text-[10px] tracking-[3px] uppercase text-white/40 font-mono">
              Host at Zo House
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight leading-[1.1]">
              Run your thing{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                here
              </span>
            </h2>
            <p className="mt-3 text-[11px] md:text-xs text-neutral-400 font-light leading-relaxed">
              Bring your hackathon, meetup, founder dinner, or launch to a
              room already full of builders. We handle the space. You bring
              the night.
            </p>
          </div>
        </BlurFade>

        <BlurFade inView delay={0.15} direction="up">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {EVENT_TYPES.map((type) => (
              <div
                key={type}
                className="border border-white/10 p-4 md:p-5 text-center bg-gradient-to-b from-neutral-950/30 to-black hover:border-[#c5a572]/30 transition-colors"
              >
                <p className="font-[family-name:var(--font-headline)] italic text-base md:text-lg shiny-gold">
                  {type}
                </p>
              </div>
            ))}
          </div>
        </BlurFade>

        <BlurFade inView delay={0.25} direction="up">
          <div className="mt-8 md:mt-10 text-center">
            <a
              href={ENQUIRY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-black font-bold text-[10px] tracking-[3px] uppercase rounded-full px-6 py-3 hover:bg-[#c5a572] hover:scale-[1.02] active:scale-95 transition-all duration-300"
            >
              Pitch your event
            </a>
            <p className="mt-3 text-[10px] text-white/30 font-mono">
              Event enquiry form. We reply within a few days.
            </p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
