import { useMutationApi, useQueryApi } from "@zo/auth";
import { User } from "@zo/definitions/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Statistic, UserMini, useInfiniteTable } from "@zo/moal";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { ZudColumnType, ZudTable } from "@zo/zud";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeleteCell } from "../components/helpers/chat-access";
import { Page, PageContent, PageHeader } from "../components/ui";
import { useAssociation } from "../hooks";

interface ChatAccessProps {}

const breadCrumbs = [
  {
    text: "Chat Access",
    to: "/chat-access",
  },
];

const ChatAccess: React.FC<ChatAccessProps> = () => {
  const { selectedOperator } = useAssociation();
  const [data, setData] = useState<GeneralObject[]>([]);

  const threadId = useMemo(
    () =>
      isValidObject(selectedOperator) &&
      isValidString(selectedOperator?.data?.thread_id)
        ? selectedOperator?.data?.thread_id
        : null,
    [selectedOperator]
  );

  const { mutate: deleteRecipients } = useMutationApi(
    "CAS_COMMS_THREADS",
    {},
    "",
    "DELETE"
  );

  const { data: threadInfo } = useQueryApi<GeneralObject>(
    "CAS_COMMS_THREADS",
    {
      enabled: isValidString(threadId),
      select: (data) => data?.data,
    },
    `${threadId}/`
  );

  const { reset, count } = useInfiniteTable({
    setter: setData,
    enabled: isValidString(threadId),
    queryEndpoint: "CAS_COMMS_THREADS",
    additionalRoute: `${threadId}/recipients/`,
    name: "recipients",
  });

  const handleDelete = (id: string) => {
    if (isValidString(threadId)) {
      deleteRecipients(
        {
          data: {},
          route: `${threadId}/recipients/${id}/`,
        },
        {
          onSuccess: () => {
            toast.success("Recipient Deleted Successfully.");
            setData((prev) => prev.filter((r) => r.id !== id));
          },
          onError: () => {
            toast.error("Failed To Delete Recipient.");
          },
        }
      );
    } else {
      toast.warning("An Error Occured.");
    }
  };

  useEffect(() => {
    if (isValidObject(selectedOperator)) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOperator]);

  const columns: ZudColumnType[] = [
    {
      title: "User",
      dataIndex: "account",
      key: "account",
      render: (cell) => <UserMini data={cell?.profile as User} />,
    },
    {
      title: "Added on",
      dataIndex: "created_at",
      key: "created_at",
      render(cell) {
        return <span>{moment(cell).format("LLL")}</span>;
      },
    },
    {
      title: "Action",
      dataIndex: "delete",
      key: "delete",
      render: (_, data) => (
        <DeleteCell onDelete={handleDelete.bind(null, data?.id)} />
      ),
    },
  ];

  return (
    <Page breadCrumbs={breadCrumbs}>
      <PageHeader
        title={isValidObject(threadInfo) ? threadInfo?.title : "Chat Access"}
      />
      <PageContent>
        <div className="flex flex-col space-y-6">
          <Statistic label="Total Recipients" value={count} />
          <ZudTable data={data} columns={columns} />
        </div>
      </PageContent>
    </Page>
  );
};

export default ChatAccess;
