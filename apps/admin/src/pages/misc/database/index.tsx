import StorageIcon from "@mui/icons-material/Storage";
import { Page, PageHeader } from "@zo/moal";
import { Button, Card, Flex, Typography } from "antd";
import { NextPage } from "next";
import { useRouter } from "next/router";

const { Title } = Typography;

const Database: NextPage = () => {
  const router = useRouter();

  return (
    <Page
      breadCrumbs={[
        { href: "/misc", label: "Miscellaneous" },
        { href: "/misc/database", label: "Database" },
      ]}
    >
      <PageHeader title="DataBase" />

      <Flex vertical gap={24} className="p-6">
        <Card className="shadow-sm">
          <Title level={4} className="mb-6 text-gray-700">
            <StorageIcon className="mr-2 mb-1" />
            CAS Database Management
          </Title>

          <Flex>
            <Button
              size="large"
              type="default"
              onClick={router.push.bind(
                null,
                "/misc/database/datafield",
                undefined,
                { shallow: true }
              )}
            >
              View Data Field
            </Button>
          </Flex>
        </Card>
      </Flex>
    </Page>
  );
};

export default Database;
