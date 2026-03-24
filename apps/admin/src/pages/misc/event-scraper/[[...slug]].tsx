import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";

dayjs.extend(calendar);

const Index = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/event-scrapper", label: "Event Scraper" },
  ];

  const columns: ZudColumnType[] = [
    {
      key: "url",
      title: "URL",
      dataIndex: "url",
      render: (cell) => (
        <a
          onClick={(e) => e.stopPropagation()}
          href={cell}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-zui-neon"
        >
          {cell}
        </a>
      ),
    },
    {
      key: "operator",
      title: "Operator",
      dataIndex: "operator",
      render: (row) => row.name,
    },

    {
      key: "start_at",
      title: "Start At",
      dataIndex: "start_at",
      render: (cell) =>
        cell ? (
          <Tooltip title={dayjs(cell).format("LLLL")}>
            {dayjs(cell).calendar()}
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      key: "end_at",
      title: "End At",
      dataIndex: "end_at",
      render: (cell) =>
        cell ? (
          <Tooltip title={dayjs(cell).format("LLLL")}>
            {dayjs(cell).calendar()}
          </Tooltip>
        ) : (
          "-"
        ),
    },
  ];

  const formFields: FormFieldType[] = [
    {
      name: "url",
      label: "URL",
      type: "text",
      required: true,
    },
    {
      name: "operator",
      label: "Operator",
      type: "searchselect",
      searchQueryApi: "CAS_OPERATORS",
      responseFields: ["id", "name"],
      required: true,
    },
    {
      name: "start_at",
      label: "Start At",
      type: "date",
    },
    {
      name: "end_at",
      label: "End At",
      type: "date",
    },
  ];

  return (
    <Zud
      title="Event Scraper"
      breadCrumbs={breadcrumbs}
      columns={columns}
      formFields={formFields}
      name="event-scrapers"
      mutationEndpoint="CAS_EVENT_SCRAPERS"
      queryEndpoint="CAS_EVENT_SCRAPERS"
    />
  );
};

export default Index;
