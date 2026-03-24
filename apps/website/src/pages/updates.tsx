import React from "react";
import {
  JoinCrusade,
  UpdatesHeroSection,
  UpdatesSection,
} from "../components/ui";
import { UpdatesSectionProps } from "../components/ui/UpdatesSection";

const sampleImage =
  "https://images.pexels.com/photos/20003297/pexels-photo-20003297/free-photo-of-a-snowy-road-with-trees-and-snow-on-the-ground.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
const sampleImage2 =
  "https://images.pexels.com/photos/19573569/pexels-photo-19573569/free-photo-of-a-restaurant-with-a-mural-on-the-side-of-it.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const data: UpdatesSectionProps[] = [
  {
    season: 1,
    title: "Where Dreams Take FLight",
    description1:
      "At El Salvadors sun-kissed shores, dreamers discovered a luminescen pulsing with modern secrets—whispering tales of dynasties andpromises etched in time. This ethereal talisman inspired a newcommunity vision, envisioning shared ownership to guide theircollective destiny.",
    description2:
      "Fueled by the siren song of Web3, the ship was born. As Bitcoin madehistory as legal tender in the physical world, Zo El Salvadorcollection came to life.",
    cards: [
      {
        description: "The Zo World El Salvador Collection",
        link: sampleImage,
        image: sampleImage,
      },
    ],
  },
  {
    season: 2,
    title: "The Maiden Voyage and the Gathering of Souls",
    description1:
      "The ship unfurls, calling a diverse crew—tech-savvy buccaneers, pixel artists, and skilled builders. Each soul, a unique treasure, weaves their talents into the vibrant strength of this dream-fueled community vessel.",
    cards: [
      {
        description: "Zo World Artefacts",
        link: sampleImage,
        image: sampleImage,
      },
    ],
    floatingCards: [sampleImage, sampleImage2],
  },
  {
    season: 3,
    title: "Message from above",
    description1:
      "The ship unfurls, calling a diverse crew—tech-savvy buccaneers, pixel artists, and skilled builders. Each soul, a unique treasure, weaves their talents into the vibrant strength of this dream-fueled community vessel.",
    cards: [
      {
        description: "Zo World Artefacts",
        link: "vfv",
        image: sampleImage,
      },
    ],
    floatingCards: [sampleImage, sampleImage2],
  },
  {
    season: 4,
    title: "Where Ideas Meet Action",
    description1:
      "Every ship needs a sturdy deck for storms and new courses. A bustling hub arose—a space where knowledge, ideas, and utilities converged. Voices mingled, strategies formed, and the digital and physical realms wove into an innovation symphony. Voyagers reached far, forming meaningful connections across the metaverse.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 5,
    title: "Synergies in the Sea",
    description1:
      "The Ship encountered digital ambassadors seeking aligned voyagers. They understood the power of shared stories, uniting a fleet. The vessel became a forge, brewing alliances—not just code and pixels, but a beacon of unity where communities sailed side-by-side. The Voyagers realized they weren't just building a ship; they were crafting a constellation, a testament to the unyielding spirit of shared dreams.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 6,
    title: "House: A Haven for the Tribe",
    description1:
      "As the community expanded, so did ideas. The hub no longer sufficed for the higher purpose. Weary voyagers sought a sanctuary—a place to replenish spirits and celebrate sea-forged bonds. The House emerged, a lifestyle clubhouse bathed in camaraderie's warmth. Laughter echoed through sunlit courtyards, glasses clinked in joyous toasts to shared dreams and adventures.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "xl",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 7,
    title: "Workshop: Where Art Fuels Innovation",
    description1:
      "The ship wasn't just a vessel for business; it was a canvas for creativity. The workshop welcomed artists who danced with pixels and wove stories in code, their works infused with the spirit of Web3, igniting a cultural revolution that rippled across the digital landscape and helped the crew explore the unimaginable routes of the ocean.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 8,
    title: "Beyond the Digital Realm: Celebrating Connections",
    description1:
      "The ship ventured beyond the digital canvas, landing at legendary gatherings where virtual and physical worlds collided. Music pulsed, costumes shimmered, and innovation blossomed under vibrant skies. Festivals became declarations of values, uniting the community in their shared pursuit of a decentralized future.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 9,
    title: "A Force of Nature",
    description1:
      "In the House's golden embrace, they stripped bare their victories and stumbles, doubts dancing with laughter, tears with comradeship. From this introspection's forge, a new course bloomed, etched not on parchment, but in the united heartbeat of the crew.",
    description2:
      "Strangers no more, they emerged, eyes ablaze, a supernova ready to paint the uncharted seas with the fire of their dreams. The Ship, reborn and united, set sail again, a force of nature chasing the horizon.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 10,
    title: "Whispers in the Shifting Dunes",
    description1:
      "The Talisman stone's power still resonates with the founders, sparking a burning awareness. Their adventure deserved a sturdier medium than written scripture or mere rumor. They chronicled their journey onto the swirling sands, weaving every thread of shared spirit—triumphs, stumbles, laughter, and tears—into this magical, ever-shifting canvas.",
    description2:
      "They realized the talisman wasn't just wizardry. It's a beacon, a mandate to become eternal storytellers. Their legacy, journey, and the countless inspired voyages would echo through the sands of time in the history of these wild seas.",
    cards: [
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
      {
        size: "md",
        description: "Zo World Artefacts",
        link: "",
        image: sampleImage,
      },
    ],
  },
  {
    season: 11,
    title: "Whispers in the Shifting Dunes",
    description1:
      "The Ship resisted physical bounds, drawn toward a boundless digital horizon. Setting a new course, it embarks on a journey to a portal opening a digital frontier—a haven for the community, guiding new souls to its welcoming decks.",
  },
];

interface UpdatesProps {}

const Updates: React.FC<UpdatesProps> = () => {
  return (
    <div className="flex relative">
      <section className="flex-1 w-[85%] px-[108px] gap-5 overflow-y-auto">
        <UpdatesHeroSection />
        {data.map((section, index) => {
          return (
            <UpdatesSection
              key={index}
              floatingCards={section.floatingCards}
              season={section.season}
              title={section.title}
              cards={section.cards}
              description1={section.description1}
              description2={section.description2}
            />
          );
        })}
        <JoinCrusade />
      </section>
      <section className="max-w-28 w-[15%] h-screen flex justify-center items-center bg-zui-dark fixed right-0 top-0 text-sm">
        <ul className="text-zui-silver space-y-4">
          {Array(11)
            .fill(undefined)
            .map((_, index) => (
              <li key={index}>
                <a href="#">{index + 1}</a>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
};

export default Updates;
