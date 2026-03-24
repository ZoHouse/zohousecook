import AccessDenied from "../helpers/app/AccessDenied";
import Page from "./Page";
import PageContent from "./PageContent";

const NoAccess = () => {
  return (
    <Page>
      <PageContent>
        <AccessDenied />
      </PageContent>
    </Page>
  );
};

export default NoAccess;
