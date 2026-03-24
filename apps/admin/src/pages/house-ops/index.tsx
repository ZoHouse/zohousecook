import { Page, PageButtonsGrid, PageHeader } from "@zo/moal";
import { NextPage } from "next";
import { navigationLinks } from "../../config";

const HouseOps: NextPage = () => {
  const breadcrumbs = [{ href: "/house-ops", label: "House Ops" }];

  const links =
    navigationLinks
      .find((set: any) => set.id === "house-operations")
      ?.list.map((item: any) => ({
        id: item.id,
        name: item.name,
        link: item.link,
      })) || [];

  return (
    <Page breadCrumbs={breadcrumbs}>
      <PageHeader title="House Operations" />
      <PageButtonsGrid links={links} className="py-10" />
    </Page>
  );
};

export default HouseOps;
