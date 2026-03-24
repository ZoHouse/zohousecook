import { useQueryApi } from "@zo/auth";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import { Drawer, Typography, Card, Empty, Flex, Steps } from "antd";
import { HistoryOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import moment from "moment";
import React from "react";
import { History as HistoryResponse } from "../../config";

const { Title, Text } = Typography;

interface LeadsHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string | null;
}

const LeadsHistorySidebar: React.FC<LeadsHistorySidebarProps> = ({
  isOpen,
  leadId,
  onClose,
}) => {
  const { data } = useQueryApi<HistoryResponse[]>(
    "CAS_LEADS",
    {
      enabled: isOpen && isValidString(leadId),
      refetchOnWindowFocus: false,
      select: (data) => data.data.results,
    },
    `${leadId}/history/`
  );

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={
        <Flex align="center" gap={8}>
          <HistoryOutlined />
          <Title level={4} style={{ margin: 0 }}>
            History
          </Title>
        </Flex>
      }
    >
      {data && data?.length > 0 ? (
        <Steps
          direction="vertical"
          current={data.length - 1}
          items={[...data].reverse().map((history: HistoryResponse) => ({
            title: formatCapitalize(String(history.stage)),
            description: (
              <Card size="small" className="mt-2">
                <Text type="secondary" className="block">
                  {moment(history.created_at).format("lll")}
                </Text>
                <Flex align="center" gap={4} className="my-2">
                  <PersonOutlineOutlined fontSize="small" />
                  <Text type="secondary">
                    By {history.assigned_to || "Zo World"}
                  </Text>
                </Flex>
                <Text>{history.notes}</Text>
              </Card>
            ),
          }))}
        />
      ) : (
        <Empty
          description="No History"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Drawer>
  );
};

export default LeadsHistorySidebar;
