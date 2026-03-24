import { CommunityCard } from "../components/helpers/membership/Communities";
import { Event } from "../components/helpers/membership/Events";
import { Node } from "../components/helpers/membership/Nodes";
import { Partner } from "../components/helpers/membership/Partners";
import { StartYourZoNodeStep } from "../components/helpers/membership/StartYourZoNode";

interface MembershipPageData {
  communities: CommunityCard[];
  nodes: Node[];
  partners: Partner[];
  events: Event[];
  steps: StartYourZoNodeStep[];
}

const membershipPageData: MembershipPageData = {
  communities: [
    {
      title: "Demo DAY",
      subtitle: "For Founders",
      link: "https://lu.ma/zofoundersdemoday",
      description: "Showcase your startup to  founder’s network & investors ",
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/images/93ee7702-db65-438c-95a4-b9c961c15480_20241204073459.jpeg?w=520`,
    },
    {
      title: "DEGEN LOUNGE",
      subtitle: "For Traders",
      description: "Unhinged group for degening in crypto trenches",
      link: "",
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/images/da3a2a26-27ec-40c5-983d-321a1656efa7_20241204073500.jpeg?w=520`,
    },
    {
      title: "Zo Collective",
      subtitle: "For Investors",
      description: "Invest in promising projects along with other angels",
      link: "",
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/images/7b2f5d27-5f79-450b-bc1f-08f40942c2a8_20241204073500.png?w=520`,
    },
    {
      title: "Zo Studio",
      subtitle: "For Artists",
      description: "Collaborative platform and tools for Creators",
      link: "https://t.me/+sEk6Ai_H41Q1ZWU1",
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/f83af528-5c89-4e49-8417-a6dd8db953ad_20241204073958.mp4`,
    },
    {
      title: "Founders chat",
      subtitle: "For Members",
      description: "Group chat where members collaborate",
      link: "https://discord.gg/zoworld",
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/images/c52c2590-bc8b-4495-afbb-30912dd592ce_20241204073500.png?w=520`,
    },
  ],
  nodes: [
    {
      id: 1,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/d40dfbb7-e14b-444f-84c2-893845b0eabd_20241211105015.mp4`,
      text: "Access to Zo Houses in SF, BLR & more nodes",
    },
    {
      id: 2,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/15ebfac8-19b5-4776-be41-251854c30322_20241211105058.mp4`,
      text: "Exclusive invites to events and parties",
    },
    {
      id: 3,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/f0e163f0-ccf0-4682-9e8a-613ca5e78133_20241206055731.mp4`,
      text: "Perks at Zostels & Zo Trips",
    },
  ],
  partners: [
    {
      id: 1,
      pfp: `${process.env.MEDIA_BASE_URL}/gallery/media/images/47263614-5780-47c9-90f1-002227b402cb_20241206124139.png?w=320`,
      name: "Veda Vyas",
      review:
        "Nuclear scientist turned Life Coach. Trained clinical hypnotherapist and regression therapist. Expert in Applied Spirituality. ",
      clipmask: "clip-mask-wavy",
      title: "Mindset",
    },
    {
      id: 2,
      pfp: `${process.env.MEDIA_BASE_URL}/gallery/media/images/559d488a-9435-48a9-821a-a0688dce26c4_20241206124203.png?w=320`,
      name: "wholisticfit",
      review:
        "Calesthenics based fitness. Helping busy humans optimise & self-actualise anywhere/anytime.",
      clipmask: "clip-mask-wavy",
      title: "Fitness",
    },
    {
      id: 3,
      pfp: `${process.env.MEDIA_BASE_URL}/gallery/media/images/133321e8-8171-4d6c-be79-58ec5fa6be52_20241206124216.png?w=320`,
      name: "Vivek",
      review:
        " Expert in digital protocols for Nutrition and Movement. Biohacking. Official partner for Bryan’s Blueprint.",
      clipmask: "clip-mask-wavy",
      title: "Longevity",
    },
  ],
  events: [
    {
      id: 1,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/979b549e-8020-453b-89d3-8b3448e4bf7c_20241211105218.mp4`,
      text: "Artist Residencies",
    },
    {
      id: 2,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/95daf79a-483c-4f8a-a080-2d41db4517b9_20241211105242.mp4`,
      text: "Founders Connect",
    },
    {
      id: 3,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/d8fac0d8-6c08-4ad0-91c2-d70b1c201f1a_20241211105303.mp4`,
      text: "Sundowners",
    },
    {
      id: 4,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/9286b29b-afc2-4c20-b5c9-5561a4f30916_20241211105150.mp4`,
      text: "Els Evenings",
    },
    {
      id: 4,
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/d8fac0d8-6c08-4ad0-91c2-d70b1c201f1a_20241211105303.mp4`,
      text: "Poker Nights",
    },
  ],
  steps: [
    {
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/dfc572e7-96fa-434c-aabb-8a0596224462_20241204121240.mp4`,
      title: "Pick a Node Type",
    },
    {
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/images/3afd4f63-3599-4cb3-98fc-86086da2373a_20241204121445.png?w=520`,
      title: "Scan & add your Node",
    },
    {
      media: `${process.env.MEDIA_BASE_URL}/gallery/media/images/1b6586e2-194a-46fd-a751-388446df1b84_20241204121527.png?w=520`,
      title: "Host events & mine $Zo",
    },
  ],
};

export default membershipPageData;
