import {
  CakeOutlined,
  CategoryOutlined,
  ChevronRight,
  EmailOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  WorkOutlined,
} from "@mui/icons-material";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useVisibilityState } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import {
  combineRouteAndQueryParams,
  formatCapitalize,
  isValidString,
} from "@zo/utils/string";
import { Button, Card, Divider, Drawer, Flex, Typography } from "antd";
import moment from "moment";
import { useRouter } from "next/router";
import React, { useMemo } from "react";
import {
  CasLeadResponse,
  History as HistoryResponse,
  Meeting,
} from "../../config";
import { StageIndicator } from "../ui";
import LeadsHistorySidebar from "./LeadsHistorySidebar";
import MeetingsSidebar from "./MeetingsSidebar";

const { Title, Text } = Typography;

interface LeadsProps {
  selectedLead: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function getUpcomingEvent(events: Meeting[]): Meeting | null {
  const currentDateTime = new Date().toISOString();

  const upcomingEvents = events
    .filter((event) => event.scheduled_start > currentDateTime)
    .sort(
      (a, b) =>
        new Date(a.scheduled_start).getTime() -
        new Date(b.scheduled_start).getTime()
    );

  return upcomingEvents.length > 0 ? upcomingEvents[0] : null;
}

const Leads: React.FC<LeadsProps> = ({ isOpen, onClose, selectedLead }) => {
  const router = useRouter();

  const [isHistorySidebarOpen, showHistorySidebar, hideHistorySidebar] =
    useVisibilityState();

  const [isMeetingInfoVisible, showMeetinginfo, hideMeetingInfo] =
    useVisibilityState();

  const { data } = useQueryApi<CasLeadResponse>(
    "CAS_LEADS",
    {
      enabled: isOpen && isValidString(selectedLead),
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    `${selectedLead}/`
  );

  const { data: historyData } = useQueryApi<HistoryResponse[]>(
    "CAS_LEADS",
    {
      enabled: isOpen && isValidString(selectedLead),
      refetchOnWindowFocus: false,
      select: (data) => data.data.results,
    },
    `${selectedLead}/history/`
  );

  const { data: meetingData } = useQueryApi<Meeting[]>(
    "CAS_LEADS",
    {
      enabled: isOpen && isValidString(selectedLead),
      refetchOnWindowFocus: false,
      select: (data) => data.data.results,
    },
    "meetings/",
    `lead=${selectedLead}`
  );

  const { data: seed } = useQueryApi<GeneralObject>("CAS_SEED", {
    select: (data) => data.data,
    refetchOnWindowFocus: false,
    enabled: isOpen,
  });

  const stages = useMemo(() => {
    if (isValidObject(seed)) {
      return seed?.lead?.stage?.map((stage: string, index: number) => ({
        label: stage,
        value: index,
      }));
    } else {
      return [];
    }
  }, [seed]);

  const todo: Meeting | null = useMemo(
    () => (meetingData ? getUpcomingEvent(meetingData) : null),
    [meetingData]
  );

  const renderBasicInfo = () => (
    <Flex vertical gap={24} flex={1}>
      <InfoCard
        label="Personal Info"
        noButton={true}
        items={[
          {
            title: (
              <Flex align="center" gap={8}>
                <PhoneOutlined fontSize="small" />
                <Text
                  copyable
                >{`+${data?.mobile_country_code} ${data?.mobile_number}`}</Text>
              </Flex>
            ),
          },
          {
            title: (
              <Flex align="center" gap={8}>
                <EmailOutlined fontSize="small" />
                <Text>
                  <a href={`mailto:${data?.email_address}`}>
                    {data?.email_address}
                  </a>
                </Text>
              </Flex>
            ),
          },
          ...(data?.data.person?.birthday?.[0]
            ? [
                {
                  title: (
                    <Flex align="center" gap={8}>
                      <CakeOutlined fontSize="small" />
                      <Text>{`Age: ${data?.data.person?.birthday?.[0]}`}</Text>
                    </Flex>
                  ),
                },
              ]
            : []),
          ...(data?.data.person?.job_title?.[0]
            ? [
                {
                  title: (
                    <Flex align="center" gap={8}>
                      <WorkOutlined fontSize="small" />
                      <Text>{`Occupation: ${data?.data.person?.job_title?.[0]}`}</Text>
                    </Flex>
                  ),
                },
              ]
            : []),
        ]}
      />

      <InfoCard
        label="Property Info"
        noButton={true}
        items={[
          {
            title: (
              <Flex align="center" gap={8}>
                <LocationOnOutlined fontSize="small" />
                <Text>{`Destination: ${
                  data?.data?.deal?.title || data?.data.lead?.title || "Unknown"
                }`}</Text>
              </Flex>
            ),
          },
          {
            title: (
              <Flex align="center" gap={8}>
                <CategoryOutlined fontSize="small" />
                <Text>{`Type: ${data?.category}`}</Text>
              </Flex>
            ),
          },
        ]}
      />
    </Flex>
  );

  return (
    <>
      <Drawer
        open={isOpen}
        onClose={() => {
          onClose();
          router.replace(
            combineRouteAndQueryParams(router.pathname, router.query),
            undefined,
            { shallow: true }
          );
        }}
        size="large"
        title={
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            {isValidObject(data?.data.person)
              ? `${formatCapitalize(
                  data?.data?.person?.first_name || ""
                )} ${formatCapitalize(data?.data.person?.last_name || "")}`
              : data?.email_address
              ? data.email_address
              : "Zo User"}
          </Title>
        }
      >
        <Flex vertical gap={16}>
          <StageIndicator stages={stages} currentStage={data?.stage || ""} />
          <Text type="secondary">
            {`Submitted on ${moment(data?.created_at).format("lll")}
           • Lead managed by ${data?.assigned_to || "Zo World"}`}
          </Text>
        </Flex>

        <Divider />

        <Flex gap={40} align="start" justify="center">
          {renderBasicInfo()}

          <Flex vertical flex={1} className="w-full">
            <InfoCard
              onClick={showMeetinginfo}
              isHidden={!isValidObject(todo)}
              label="TO DO"
              items={[
                {
                  title: todo?.data?.scheduled_event?.name || "Meeting",
                  subtitle: `${
                    todo?.medium ? `${todo.medium} • ` : ""
                  } ${moment(todo?.scheduled_start).format("lll")}`,
                },
              ]}
            />
          </Flex>

          <Flex vertical flex={1} className="w-full">
            <InfoCard
              isHidden={!historyData?.length}
              label="History"
              onClick={showHistorySidebar}
              items={[
                {
                  title: historyData?.[0]?.stage
                    ? formatCapitalize(historyData?.[0]?.stage)
                    : "New",
                  subtitle: `${moment(historyData?.[0]?.updated_at).format(
                    "lll"
                  )}`,
                },
              ]}
            />
            <InfoCard
              isHidden={!historyData?.length}
              label="Wati Template"
              noButton={true}
              items={[
                {
                  title: `Template: ${
                    data?.data.wati_ref_message?.template_name || "No Template"
                  }`,
                  subtitle: `on ${moment(
                    data?.data.wati_ref_message?.contact?.lastUpdated
                  ).format("lll")}`,
                },
              ]}
            />

            <InfoCard
              isHidden={!isValidObject(data?.data?.deal?.last_activity)}
              label="Last Activity"
              items={[
                {
                  title: data?.data.deal?.last_activity?.subject || "Activity",
                  subtitle: `${data?.data.deal?.last_activity?.type} • ${moment(
                    data?.data.deal?.last_activity_date
                  ).format("lll")}`,
                },
              ]}
            />
          </Flex>
        </Flex>
      </Drawer>

      {todo && (
        <MeetingsSidebar
          isOpen={isMeetingInfoVisible}
          onClose={hideMeetingInfo}
          meeting={todo}
        />
      )}

      <LeadsHistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={hideHistorySidebar}
        leadId={selectedLead}
      />
    </>
  );
};

export default Leads;

interface InfoCardProps {
  label: string;
  onClick?: () => void;
  items?: Array<{ title: string | JSX.Element; subtitle?: string }>;
  isHidden?: boolean;
  noButton?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  items = [],
  label,
  onClick,
  isHidden,
  noButton,
}) => {
  if (isHidden) return null;

  return (
    <Card
      bordered={false}
      className="bg-transparent leads-info-card"
      styles={{ body: { margin: 0 } }}
    >
      {noButton ? (
        <Title
          level={5}
          style={{ color: "#9E9E9E", textTransform: "uppercase", margin: 0 }}
        >
          {label}
        </Title>
      ) : (
        <Button
          type="text"
          onClick={onClick}
          className="flex justify-between items-center w-full p-0"
          disabled={noButton}
        >
          <Title
            level={5}
            style={{ color: "#9E9E9E", textTransform: "uppercase", margin: 0 }}
          >
            {label}
          </Title>
          <ChevronRight style={{ color: "#fff" }} />
        </Button>
      )}

      <Flex vertical gap={16} className="mt-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`}>
            {typeof item.title === "string" ? (
              <Text style={{ color: "#fff" }} ellipsis>
                {item.title}
              </Text>
            ) : (
              item.title
            )}
            {item.subtitle && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: "14px" }} ellipsis>
                  {item.subtitle}
                </Text>
              </>
            )}
          </div>
        ))}
      </Flex>
    </Card>
  );
};
