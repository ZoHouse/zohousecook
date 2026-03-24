import { MediaCarouselItem } from "../components/ui/MediaCarousel";

type SanFranciscoData = {
  communityVibes: {
    data: Array<{
      id: number;
      image: string;
    }>;
  };
  gallery: {
    data: Array<{
      id: number;
      image: string;
      title: string;
      description: string;
    }>;
  };
  carouselImages: MediaCarouselItem[];
};

const data: SanFranciscoData = {
  communityVibes: {
    data: [
      {
        id: 1,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/0df691c1-8dd0-4cb9-a57a-b5eaead7cc59_20240903101502.mp4`,
      },
      {
        id: 2,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/f1e4b823-d5fd-4d80-ad25-5105ffbcbe7a_20240903101554.mp4`,
      },
      {
        id: 3,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/6a3a0c26-eaaa-44bc-bad7-a53818d7f0c2_20241009081927.mp4`,
      },

      {
        id: 4,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/1f27cbae-2830-4f76-962b-0d59014a3c5a_20241009081941.mp4`,
      },
      {
        id: 5,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/9ed6103c-1305-4879-9dcf-442cdcfd2f57_20241009081912.mp4`,
      },
    ],
  },
  gallery: {
    data: [
      {
        id: 1,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/ce900636-010a-4b02-bbb2-f08038e3208b_20241013060841.jpeg`,
        title: "Degen Lounge",
        description: ``,
      },
      {
        id: 2,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/694dfb57-4262-4dc7-b619-8d55bdb907ea_20241013102410.png`,
        title: "Zo House SF",
        description: ``,
      },
      {
        id: 3,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/4e032c92-e780-41bb-97b7-1596dce69907_20241013102338.jpeg`,
        title: "Flo Zone",
        description: ``,
      },
      {
        id: 4,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/9e6c76da-c9dc-46e4-9429-dfc123c69742_20241013102451.png`,
        title: "Schelling Point",
        description: ``,
      },
      {
        id: 5,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/91b02dee-28e6-4e07-a0f5-88028384abe7_20241013102427.jpeg`,
        title: "Multiverse",
        description: ``,
      },
      {
        id: 6,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/20d368e4-9b5f-45aa-9658-60c1ae71c2dd_20241013102351.jpeg`,
        title: "Bored Room",
        description: ``,
      },
      {
        id: 7,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/d2cbfc29-a7a3-4eab-bff8-0cae2c209b88_20241013102504.jpeg`,
        title: "Studio",
        description: ``,
      },
      {
        id: 8,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/c99a28d3-3ce1-4488-a2d3-03160cb50b71_20241013102323.jpeg`,
        title: "Kitchen",
        description: ``,
      },
    ],
  },
  carouselImages: [
    {
      id: "1",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/e61618d2-7bb4-4d19-bda1-f3c8ad6a8897_20241014081320.jpeg`,
      description:
        "The Beat movement, centered in North Beach, rejected mainstream culture in favor of artistic freedom and exploration. Writers like Jack Kerouac, Allen Ginsberg, and Lawrence Ferlinghetti cultivated a culture of poetry, jazz, and free expression, planting the seeds for later countercultural revolutions.",
    },
    {
      id: "2",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/08831961-1416-4cf5-9e8c-011094f12e2d_20241014081525.png`,
      description:
        "Defined the countercultural movement in Haight-Ashbury, celebrating peace, love, and artistic freedom.",
    },
    {
      id: "3",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/560b90c6-3516-443d-b815-2a66c7989587_20241014081718.png`,
      description:
        "I think Burning Man is to the contemporary tech world what the Protestant church was to industrial manufacturers. In the industrial era, you might work in a factory six days a week. On the seventh, you would go to church. The bosses would sit up front, the middle management right behind them, and the workers would fill out the pews. The church itself was a model of the factory, transformed into a spiritual community.",
    },
    {
      id: "4",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/db6d36cc-0c1d-40b5-9f6a-1efe2501dcea_20241014081830.png`,
      description:
        "Dot-Com Boom and Bust showed SF’s tech-driven ambition, embodying the highs and lows of innovation and experimentation.",
    },
    {
      id: "5",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/51a29deb-811e-4646-bfe1-7317a9dcea56_20241014081917.png`,
      description:
        "San Francisco's Mission District became a hub for street art, with murals transforming the urban landscape. The works of artists like Banksy, Barry McGee, and others drew international attention, with art that spoke to social justice, gentrification, and cultural identity.",
    },

    {
      id: "6",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/bbe149e0-a62f-4f53-9330-d879a62d2504_20241014082115.png`,
      description:
        "In 2004, San Francisco became the first city in the United States to issue marriage licenses to same-sex couples, an event that brought significant cultural focus to the city as a leader in LGBTQ+ rights. Then-mayor Gavin Newsom’s decision was a key cultural moment that spurred wider conversations on marriage equality across the nation.",
    },
    {
      id: "7",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/c7da622e-352a-4f09-afa6-5dcbe2ee005e_20241014082247.png`,
      description:
        "Exhibits blending art, technology, and quantum physics, exploring the merging of physical and digital consciousness.",
    },
    {
      id: "8",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/4541e2bc-66ac-471c-b1a6-5771604891fc_20241014082336.png`,
      description:
        "AI is not just being developed but also woven into the very fabric of the city’s culture. Boundaries of human creativity and machine intelligence are being pushed, creating a future that is vibrant, challenging, and full of possibilities. The fusion of ethical debate, cultural adoption, and technological innovation makes San Francisco the vanguard of AI’s evolution—a place where the future is happening right now, in real-time.",
    },
    {
      id: "9",
      url: `${process.env.MEDIA_BASE_URL}/gallery/media/images/2b44cfd9-4c53-49fb-922b-43c27f9a5554_20241014082429.png`,
      description:
        " Building the future of San Francisco—a visionary hub where immersive experiences, community-driven culture, and technological frontiers converge to shape a new paradigm of human evolution and connection.",
    },
  ],
};

export default data;
