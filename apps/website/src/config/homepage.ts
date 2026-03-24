import { BrandsType } from "../components/helpers/home/Brands";
import { NewsCard } from "../components/helpers/home/NewsCard";
import { ZoHotelCardProps } from "../components/helpers/home/ZoHotelCard";
import { ZoHouseCardProps } from "../components/helpers/home/ZoHouseCard";

type HomePageData = {
  newsSection: {
    data: NewsCard[];
  };
  zoHotel: {
    data: ZoHotelCardProps[];
  };
  zoStudio: {
    data: ZoHouseCardProps[];
  };
  brands: {
    data: BrandsType[];
  };
};

const data: HomePageData = {
  newsSection: {
    data: [
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/9e5d8a7a-375c-4aca-9c73-412b9d8a4587_20241022122613.png?w=320`,
        title: "Trip in San Francisco",
        subtitle: "Find the best party in SF",
        route: "/san-francisco",
      },
    ],
  },
  zoHotel: {
    data: [
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/cfaed441-be10-47a3-a7ab-0e51079b6776_20240903100520.mp4`,
        title: "Zo Hotel New York",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/0df691c1-8dd0-4cb9-a57a-b5eaead7cc59_20240903101502.mp4`,
        title: "Zo Hotel SF",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/videos/f1e4b823-d5fd-4d80-ad25-5105ffbcbe7a_20240903101554.mp4`,
        title: "Zo Hotel Perth",
      },
    ],
  },
  zoStudio: {
    data: [],
  },
  brands: {
    data: [
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/7c10aa99-edf0-4b7c-97d2-e4989949953d_20240815112144.png?w=520`,
        src: "https://markets.chroniclejournal.com/chroniclejournal/article/prlog-2024-6-4-zo-world-launches-crypto-sanctuary-the-premier-hub-for-crypto-enthusiasts-in-san-francisco",
        alt: "Chronicle Journal Logo (1) 1.png",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/cdc7ad24-9330-4202-a28e-a7665e1bbc62_20240815112223.png?w=520`,
        src: "https://hospitality.economictimes.indiatimes.com/news/hotels/we-have-charted-out-52-global-cities-for-zo-house-clubhouses-in-next-3-years-dharamveer-singh-chouhan/111155481",
        alt: "hospitality.png",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/8864d8fa-ff08-45d7-8e4c-42fc03c687e9_20240815112248.png?w=520`,
        src: "https://timesofindia.indiatimes.com/business/india-business/budget-2024-industry-leaders-share-their-insights-on-the-future-of-the-travel-sector-based-on-fund-allocation-infrastructure-development-and-other-major-initiatives/articleshow/111963340.cms",
        alt: "time of india.png",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/70316ac0-765f-4165-b097-829444ffdc65_20240815112332.png?w=520`,
        src: "https://www.businesstoday.in/technology/story/zo-house-zostel-founders-new-clubhouse-concept-combines-membership-with-ownership-433036-2024-06-12",
        alt: "bussiness today.png",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/b81f7d55-1db4-492f-a065-bb95a697574d_20240815112431.png?w=520`,
        src: "https://www.digitaljournal.com/pr/news/pr-zen/zo-world-launches-crypto-sanctuary-1484269227.html",
        alt: "digital journal.png",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/e409efd7-8a59-4540-963a-92273606e039_20240815112507.png?w=520`,
        src: "https://www.bizjournals.com/sanfrancisco/news/2024/06/05/zo-house-san-francisco-nft-club-crypto-sfoxzo-24-7.html",
        alt: "bussines times",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/fc14a942-1a98-4136-a315-46195159b44e_20240815112548.png`,
        src: "https://www.deccanchronicle.com/business/in-other-news/zo-world-ceo-dharamveer-singh-chouhan-on-unique-approach-to-hospitality-1308794",
        alt: "cronicals",
      },
      {
        mediaLink: `${process.env.MEDIA_BASE_URL}/gallery/media/images/db582eed-cba6-40e9-80b2-41fa9ef74083_20240815112614.png?w=520`,
        src: "https://www.deccanchronicle.com/business/in-other-news/zo-world-ceo-dharamveer-singh-chouhan-on-unique-approach-to-hospitality-1308794",
        alt: "entrepreneur.pngs",
      },
    ],
  },
};

export default data;
