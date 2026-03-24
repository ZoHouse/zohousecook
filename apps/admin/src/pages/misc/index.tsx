import { Page, PageButtonsGrid, PageHeader } from "@zo/moal";
import { NextPage } from "next";
import { navigationLinks } from "../../config";

const Miscellaneous: NextPage = () => {
  const breadcrumbs = [{ href: "/misc", label: "Miscellaneous" }];

  const links =
    navigationLinks
      .find((set: any) => set.id === "miscellaneous")
      ?.list.map((item: any) => ({
        id: item.id,
        name: item.name,
        link: item.link,
      })) || [];

  return (
    <Page breadCrumbs={breadcrumbs}>
      <PageHeader title="Miscellaneous" />
      <PageButtonsGrid links={links} className="py-10" />
    </Page>
  );
};

export default Miscellaneous;
