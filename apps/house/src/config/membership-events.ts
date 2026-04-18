import type { Event } from "../components/helpers/network/Events";

const MEDIA = process.env.MEDIA_BASE_URL;

const events: Event[] = [
  {
    id: 1,
    media: `${MEDIA}/gallery/media/videos/979b549e-8020-453b-89d3-8b3448e4bf7c_20241211105218.mp4`,
    text: "Artist Residencies",
  },
  {
    id: 2,
    media: `${MEDIA}/gallery/media/videos/95daf79a-483c-4f8a-a080-2d41db4517b9_20241211105242.mp4`,
    text: "Founders Connect",
  },
  {
    id: 3,
    media: `${MEDIA}/gallery/media/videos/d8fac0d8-6c08-4ad0-91c2-d70b1c201f1a_20241211105303.mp4`,
    text: "Sundowners",
  },
  {
    id: 4,
    media: `${MEDIA}/gallery/media/videos/9286b29b-afc2-4c20-b5c9-5561a4f30916_20241211105150.mp4`,
    text: "Els Evenings",
  },
  {
    id: 5,
    media: `${MEDIA}/gallery/media/videos/d8fac0d8-6c08-4ad0-91c2-d70b1c201f1a_20241211105303.mp4`,
    text: "Poker Nights",
  },
];

export default events;
