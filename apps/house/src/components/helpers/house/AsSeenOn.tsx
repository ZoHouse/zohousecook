const CDN = "https://cdn.zo.xyz";

const brands = [
  {
    img: `${CDN}/gallery/media/images/7c10aa99-edf0-4b7c-97d2-e4989949953d_20240815112144.png?w=520`,
    href: "https://markets.chroniclejournal.com/chroniclejournal/article/prlog-2024-6-4-zo-world-launches-crypto-sanctuary-the-premier-hub-for-crypto-enthusiasts-in-san-francisco",
    alt: "Chronicle Journal",
  },
  {
    img: `${CDN}/gallery/media/images/cdc7ad24-9330-4202-a28e-a7665e1bbc62_20240815112223.png?w=520`,
    href: "https://hospitality.economictimes.indiatimes.com/news/hotels/we-have-charted-out-52-global-cities-for-zo-house-clubhouses-in-next-3-years-dharamveer-singh-chouhan/111155481",
    alt: "ET Hospitality World",
  },
  {
    img: `${CDN}/gallery/media/images/8864d8fa-ff08-45d7-8e4c-42fc03c687e9_20240815112248.png?w=520`,
    href: "https://timesofindia.indiatimes.com/business/india-business/budget-2024-industry-leaders-share-their-insights-on-the-future-of-the-travel-sector-based-on-fund-allocation-infrastructure-development-and-other-major-initiatives/articleshow/111963340.cms",
    alt: "The Times of India",
  },
  {
    img: `${CDN}/gallery/media/images/70316ac0-765f-4165-b097-829444ffdc65_20240815112332.png?w=520`,
    href: "https://www.businesstoday.in/technology/story/zo-house-zostel-founders-new-clubhouse-concept-combines-membership-with-ownership-433036-2024-06-12",
    alt: "Business Today",
  },
  {
    img: `${CDN}/gallery/media/images/b81f7d55-1db4-492f-a065-bb95a697574d_20240815112431.png?w=520`,
    href: "https://www.digitaljournal.com/pr/news/pr-zen/zo-world-launches-crypto-sanctuary-1484269227.html",
    alt: "Digital Journal",
  },
  {
    img: `${CDN}/gallery/media/images/e409efd7-8a59-4540-963a-92273606e039_20240815112507.png?w=520`,
    href: "https://www.bizjournals.com/sanfrancisco/news/2024/06/05/zo-house-san-francisco-nft-club-crypto-sfoxzo-24-7.html",
    alt: "San Francisco Business Times",
  },
  {
    img: `${CDN}/gallery/media/images/fc14a942-1a98-4136-a315-46195159b44e_20240815112548.png`,
    href: "https://www.deccanchronicle.com/business/in-other-news/zo-world-ceo-dharamveer-singh-chouhan-on-unique-approach-to-hospitality-1308794",
    alt: "Deccan Chronicle",
  },
  {
    img: `${CDN}/gallery/media/images/db582eed-cba6-40e9-80b2-41fa9ef74083_20240815112614.png?w=520`,
    href: "https://www.deccanchronicle.com/business/in-other-news/zo-world-ceo-dharamveer-singh-chouhan-on-unique-approach-to-hospitality-1308794",
    alt: "Entrepreneur",
  },
];

export function AsSeenOn() {
  return (
    <section className="pt-4 pb-20 md:pt-8 md:pb-32 px-8 md:px-28 bg-black">
      <h2 className="text-xl md:text-2xl font-bold text-center tracking-tight text-white/80 mb-12 md:mb-16">
        As seen on
      </h2>
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-10 md:gap-14">
        {brands.map((brand) => (
          <a
            key={brand.alt}
            href={brand.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
          >
            <img
              src={brand.img}
              alt={brand.alt}
              className="h-8 md:h-12 w-auto object-contain grayscale opacity-60 hover:opacity-100 transition-opacity duration-300"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
