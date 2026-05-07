import { NavigationLinksType } from "../components/common/Header";

const navigationLinks: NavigationLinksType = {
  "/": {
    links: [
      {
        label: "Passport",
        href: "/passport",
        showOnWebHeader: false,
      },
    ],
  },
  "/whitefield": {
    links: [
      {
        label: "Spaces",
        id: "gallery",
        showOnWebHeader: true,
      },
      {
        label: "Directions",
        id: "location",
        showOnWebHeader: false,
      },
      {
        label: "Benefits",
        id: "features",
        showOnWebHeader: true,
      },
      {
        label: "About Zo",
        id: "about",
        showOnWebHeader: false,
      },
      {
        label: "FAQs",
        id: "faqs",
        showOnWebHeader: true,
      },
    ],
  },
};

export default navigationLinks;
