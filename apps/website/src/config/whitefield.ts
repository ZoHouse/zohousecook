// config.ts

type WhitefieldData = {
  features: {
    data: Array<{ emoji: string; description: string }>;
  };
  gallery: {
    data: Array<{
      id: number;
      image: string;
      title: string;
      description: string;
    }>;
  };
  faqs: {
    data: {
      [key: string]: Array<{ id: number; title: string; description: string }>;
    };
  };
};

export const data: WhitefieldData = {
  features: {
    data: [
      { emoji: "🎟️", description: "Exclusive 24x7 access to Global Zo Houses" },
      {
        emoji: "🌎",
        description: "San Francisco, Dubai,  Bengaluru + 50 cities soon",
      },
      {
        emoji: "😎",
        description: "Get on a VIP guestlist to Worldwide IRL Events",
      },
    ],
  },
  gallery: {
    data: [
      {
        id: 1,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/a8c31ba2-fc5c-419d-bc2c-74a35200a7cb_20240829081927.png`,
        title: "Liquidity Pool",
        description: `An immersive hotspot for the realest of OGs.`,
      },
      {
        id: 2,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/1ea65e51-2165-4ccb-95c3-44fac126a21e_20240829081451.png`,
        title: "Zo Studio",
        description: `A studio that brings your creative vision to life.`,
      },
      {
        id: 3,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/62126875-dd46-455f-9e2a-f51aaa64cc52_20240829081652.png`,
        title: "Flow Zone",
        description: `A powerfully equipped, flow-state collaborative working space.`,
      },
      {
        id: 4,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/449b9e26-d8c4-4601-a06c-b2eaddb215a0_20240829081309.png`,
        title: "Schelling Point",
        description: `IRL vibes that unite artists, culture champs, and world-builders.`,
      },
      {
        id: 5,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/4d8da3ab-47ab-4358-beaf-c0a14548ac25_20240829081038.png`,
        title: "Degen Lounge",
        description: `Where legends connect & chill to exchange true alpha.`,
      },
      {
        id: 6,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/1db60ea8-34dc-4117-b02d-da7869e53236_20240829081808.png`,
        title: "Bored Room",
        description: `An all-in environment for gamers at heart, with its own Poker Tourney!`,
      },
      {
        id: 7,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/4d0ba5fb-fdd2-4109-b4b0-7b2bffcf66cb_20240829082232.png`,
        title: "Battle Field",
        description: `Play & train hard, with AI analytics & unbelievable infra.`,
      },
      {
        id: 8,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/8aff4ff7-449a-4543-90c2-424179a7e8d3_20240829082026.png`,
        title: "Bio Hack",
        description: `Fire up, Ice down, detox & pamper yourself with steam & cryo baths.`,
      },
      {
        id: 9,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/cc87ef6f-8260-4e6a-b964-80ff9c16efdc_20240829082118.png`,
        title: "Dorms",
        description: `The sweet spot of luxury, expression & collective action.`,
      },
      {
        id: 10,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/4f99a840-7d50-4207-9e57-2558441e851c_20240829081601.png`,
        title: "Zo Cafe",
        description: `Food that speaks to your soul & gets conversations going.`,
      },
      {
        id: 11,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/d8d3b247-afa9-4645-a8b4-3a5935018996_20240829082317.png`,
        title: "Penguin Play ",
        description: `Let your kids loose in a safe play area specially made for them`,
      },
      {
        id: 12,
        image: `${process.env.MEDIA_BASE_URL}/gallery/media/images/8fab1ec7-2a5d-4cfe-be63-15135f4b2eea_20240829083101.png`,
        title: "Proof of Work",
        description: `Get your reps in at the Gym`,
      },
    ],
  },
  faqs: {
    data: {
      basic: [
        {
          id: 1,
          title: "How do I get selected for the membership?",
          description:
            "Application Process: Submit a detailed application highlighting your background, interests, and reasons for wanting to join Zo House Whitefield aka WTFxZo. Emphasize your alignment with the club's vision and mission as a tech optimist.<br/><br/>Interview Process: Be prepared for an interview (or a series of interviews) with the selection committee. During these interviews, demonstrate your passion for technology, your vision for the future, and how you plan to contribute to the Zo community.",
        },
        {
          id: 2,
          title:
            "What can I do to increase my chances of getting selected for the membership?",
          description:
            "To increase your chances of being selected for membership, actively participate in Zo House events, contribute ideas, and engage with the community. Showing commitment and alignment with Zo World’s vision is crucial.<br/><br/>Referrals and Recommendations: Obtain referrals or recommendations from current Founder Members or influential individuals in the community. A strong endorsement can greatly boost your application.",
        },
        {
          id: 3,
          title: "Can I pay a premium and reserve my spot for the memberships?",
          description:
            "Currently, there is no provision for paying a premium to reserve membership spots. All memberships are subject to the standard selection process.",
        },
        {
          id: 4,
          title: "What all do I get if I buy membership for WTFxZo?",
          description:
            " You will get access to a community that's passionate about new technologies like blockchain, AI, longevity, & biotech, and connect with like-minded people and feel a sense of belonging. <br /><br />You will also get access to great amenities like Swimming Pool(Liquidity Pool), Co- working Space(Syner - Z), Games Room, Sports Arena(Zo Turf), and a 24 / 7 Café.",
        },
        {
          id: 5,
          title: "What will be the annual maintenance fee?",
          description:
            "There will be an annual club maintenance fee of INR 25,000",
        },
        {
          id: 6,
          title:
            "Who is responsible for daily operations, and is there a fallback in case of mismanagement?",
          description:
            "Daily operations are managed by a professional management team appointed by the LLP. There are fallback plans in place to ensure continuity in case of mismanagement.",
        },
      ],
      membership: [
        {
          id: 1,
          title:
            "Do WTFxZo membership amenities extend to my family and friends?",
          description:
            "Amenities are exclusively for the members and can’t be extended for the family or friends",
        },
        {
          id: 2,
          title: "Does WTFxZo has a couple membership?",
          description:
            "Yes, price for the couple membership is INR 17 Lakhs. With 2/500 lot allocation.",
        },
        {
          id: 3,
          title:
            "As an member/owner, are there any benefits I can get such as staying for free or any form of discounted stay while visiting WTFxZo?",
          description:
            "Yes, you are entitled to have 11% discount on the stay and free & priority access to all other amenities of the club.",
        },
        {
          id: 4,
          title: "What is the payback period",
          description:
            "The payback period can vary based on the performance of the Zo House and market conditions. Generally, we estimate a payback period of 10-12 years, based on projected revenue from House operations and property appreciation.",
        },
        {
          id: 5,
          title:
            "Are there any special prices for Zo World Founder NFT Holder to get WTFxZo membership?",
          description:
            "WTFxZo memberships are priced at INR 8 Lakhs for Founder members.",
        },
        {
          id: 6,
          title:
            "I already am a Zo World Founder NFT Holder, what is different in WTFxZo membership?",
          description:
            "Zo World Founder NFT membership will always remain top tier membership. However, the membership to WTFxZo is a legally binding document via an LLP, that gives you legitimate access (under the Indian Penal Code) to the LLPs real assets and business profits. Further, the business gains from the Zo House operations and value extraction from the real estate asset on transfer of membership are standout features that are offered for the first time by any club, globally.",
        },
        {
          id: 7,
          title:
            "What accesses and privileges do WTFxZo members get if they have this membership and not the Zo World Founder NFT?",
          description:
            "WTFxZo members get access to all the real estate products of Zo (Zo Houses, Zo Hotels and so on). However privileges like early checkin and checkout, stay discounts on other Zo real estate products (apart from WTFxZo) are reserved for Zo World Founder NFT holders.",
        },
      ],
      // ownership: [
      //   {
      //     id: 1,
      //     title: "How does profit sharing work exactly",
      //     description:
      //       "It’s as simple as it sounds, no hidden ifs. You get your share of profit from the net annual profits of the Zo House. To make this risk free for you, if it’s a loss for a given financial year, you won’t have to bear a loss.",
      //   },
      //   {
      //     id: 2,
      //     title: "What will be the periodicity of profit sharing?",
      //     description: "Profits will be distributed annually.",
      //   },
      //   {
      //     id: 3,
      //     title: "What is the projected profit share you’ll give me each year?",
      //     description: "You can expect up to 8% yield on your invested amount which will eventually increase as WTFxZo grows.",
      //   },
      //   {
      //     id: 4,
      //     title: "What is the structure of investments? Do we get equity or land papers?",
      //     description:
      //       "Investments in Zo House Whitefield are structured as equity shares in a Limited Liability Partnership (LLP) in India. Investors receive equity certificates, not land papers. This means you own a share of the LLP that holds the property, not a direct portion of the land.",
      //   },
      //   {
      //     id: 5,
      //     title: "How much land will be issued under my name? Can I select the parcel of land?",
      //     description:
      //       "No individual investor will have land issued under their name. The land and property are collectively owned by the LLP. Investors hold equity in the LLP, which in turn owns the property.",
      //   },
      //   {
      //     id: 6,
      //     title: "What is the present valuation at which investments are made?",
      //     description:
      //       "The present valuation for investments is based on a comprehensive appraisal of the Zo House and projected future earnings. As of now, the valuation of the LLP is set at INR 80 CR.",
      //   },
      //   {
      //     id: 7,
      //     title: "What is the current market value of the property?",
      //     description:
      //       "The current market value of the Zo House Whitefield property is approximately INR 50 CR. This valuation includes both the land and the developed clubhouse facilities.",
      //   },
      //   {
      //     id: 8,
      //     title: "Do owners get access to balance sheets of other Zo Houses?",
      //     description:
      //       "Members of Zo House Whitefield will have access to the financial statements of the Whitefield property only. Access to balance sheets of other Zo Houses will be restricted.",
      //   },
      //   {
      //     id: 9,
      //     title: "What is the size of land parcel I'll be buying?",
      //     description:
      //       "As an investor, you are buying a fractional ownership in the LLP. The size of the land parcel is not individually divided among partners; the whole property is collectively owned by the LLP.",
      //   },
      //   {
      //     id: 10,
      //     title: "Can I put in the investment together with a friend? Will both of get shared ownership?",
      //     description:
      //       "Each investment and membership must be made individually. Joint investments with friends or other parties are not permitted. This policy ensures clear ownership and simplifies administrative processes.",
      //   },
      //   {
      //     id: 11,
      //     title: "How much amount will Zo World reinvest in the property going ahead?",
      //     description:
      //       "Zo World will reinvest a significant portion of the profits into property maintenance, upgrades, and community activities. Specific percentages will be outlined in the financial plan.",
      //   },
      //   {
      //     id: 12,
      //     title: "How are the profits being calculated? Is the initial raise taken into consideration?",
      //     description:
      //       "Profits are calculated based on the net income generated by the Zo House, taking into account initial investments, operational expenses, and any capital appreciation. The initial raise is considered in the overall financial planning.",
      //   },
      //   {
      //     id: 13,
      //     title: "Is it legal for LLP to have 500 investors?",
      //     description:
      //       "It is legal for an LLP to have multiple investors, including up to 500 or more, provided it complies with local regulations and maintains proper governance structures.",
      //   },
      //   {
      //     id: 14,
      //     title: "Where do we sell the memberships if I want an exit? Can I sell directly to my friend?",
      //     description:
      //       "If you wish to exit, you can sell your membership through an approved process, either directly to another interested party or through an internal platform managed by Zo World. Direct sales to a friend are possible, subject to LLP approval.",
      //   },
      // ],
      miscellaneous: [
        {
          id: 1,
          title: "How is the resale value being calculated?",
          description:
            "The resale value is determined based on the current market conditions, property valuation, and the financial performance of Zo House Whitefield.",
        },
        {
          id: 2,
          title: "What are the payment terms?",
          description:
            "Membership and investment in Zo House Whitefield require a full, upfront payment. Installment payments are not accepted.",
        },
        {
          id: 3,
          title:
            "Will there be a treasury through which all funds are received and deployed in Zo House?",
          description:
            "All funds received and deployed for Zo House operations are managed through a central treasury. This ensures transparent and efficient use of funds.",
        },
        {
          id: 4,
          title:
            "If there a working capital corpus initially in a treasury for kickstarting operations?",
          description:
            "There is an initial working capital corpus to kickstart operations and cover early-stage expenses. This corpus is part of the overall financial planning.",
        },
        {
          id: 5,
          title:
            "I want to have a look at the draft contract for the fractional ownership and membership?",
          description:
            "A draft contract for fractional ownership and membership can be provided upon request, after selection. This document outlines all rights, responsibilities, and terms of the investment.",
        },
        {
          id: 6,
          title:
            "Can we see your two year expansion plans for Zo Houses globally?",
          description:
            "Our two-year expansion plans include developing additional Zo Houses globally, with a focus on key tech hubs. Detailed plans and timelines will be shared with investors.<br /><br /> Our network of Zo Houses has grown to properties in San Francisco, New York, Dubai, and many more across the globe soon. Detailed plans and timelines will be shared with investors.",
        },
        {
          id: 7,
          title:
            "Will future valuation will only be based on how well the Zo House do, land value? or both?",
          description:
            "Future valuations will consider both the operational performance of the Zo House and the underlying land value. Both factors contribute to the overall property valuation.",
        },
      ],
    },
  },
};

export default data;
