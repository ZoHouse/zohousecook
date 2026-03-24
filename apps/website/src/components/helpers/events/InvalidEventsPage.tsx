import Icon from "@zo/assets/icons";
import Link from "next/link";
import React from "react";
import { MetaTags, Page } from "../../common";

interface InvalidEventsPageProps {}

const data = {
  name: "Event not found",
  description:
    "The event might have vanished, expired, or gone on a mysterious break!",
};

const InvalidEventsPage: React.FC<InvalidEventsPageProps> = () => {
  return (
    <Page>
      <MetaTags title={"Expired or Inactive Event"} />
      <h1 className="zui-heading-1">{data?.name}</h1>
      <p className="zui-text-1 text-zui-silver w-3/4">{data.description}</p>

      <Link
        className="zui-text-1 text-zui-neon flex gap-4 items-center mt-10"
        href={"/"}
      >
        <Icon name="ArrowLeft" size={24} fill="#CFFF50" /> Go back to Zo realm
      </Link>
    </Page>
  );
};

export default InvalidEventsPage;
