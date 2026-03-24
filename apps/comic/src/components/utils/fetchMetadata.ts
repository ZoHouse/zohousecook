import { isValidObject } from "@zo/utils/object";
import axios from "axios";
import { GetServerSideProps } from "next";
import { Metadata } from "../../config";

export const fetchMetaData: GetServerSideProps = async (context) => {
  const { resolvedUrl } = context;

  const currentUrl = `${process.env.WEB_BASE_URL}${process.env.WEB_BASE_PATH}${resolvedUrl}`;

  const defaultMetaData = {
    title: "A brave new world!",
    description:
      "A place to vibe in every corner of the world. A local friend, everywhere. Connect from anywhere. Welcome to Zo World!",
    image:
      "https://cdn.zo.xyz/gallery/media/images/c4a6a760-f7c4-4627-bd82-05ac00fb16d6_20240917082703.jpg",
  };

  try {
    const response = await axios.get(
      `${process.env.API_BASE_URL}/api/v1/zoworld/metadata/?url=${currentUrl}`
    );

    if (isValidObject(response.data)) {
      const metaData: Metadata = response.data;
      return { props: { metaData } };
    } else {
      return { props: { metaData: defaultMetaData } };
    }
  } catch (error) {
    return { props: { metaData: defaultMetaData } };
  }
};

export default fetchMetaData;
