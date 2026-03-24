import { NavigationLinksType } from "../components/common/Header";

const navigationLinks: NavigationLinksType = {
  "/": {
    links: [],
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
  "/house": {
    links: [
      {
        label: "Houses",
        id: "houses",
        showOnWebHeader: true,
      },
      {
        label: "Program",
        id: "program",
        showOnWebHeader: true,
      },
      {
        label: "Culture",
        id: "culture",
        showOnWebHeader: true,
      },
      {
        label: "Apply",
        href: "https://zostel.typeform.com/to/LgcBfa0M",
        showOnWebHeader: true,
      },
    ],
  },
};

export default navigationLinks;
