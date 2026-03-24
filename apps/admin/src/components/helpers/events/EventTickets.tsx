import {
  Add,
  Delete,
  LocationOn,
  MonetizationOn,
  Person,
} from "@mui/icons-material";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { useVisibilityState } from "@zo/utils/hooks";
import { removeUndefinedKeys } from "@zo/utils/object";
import { Button, Flex, Space, Tag, Typography } from "antd";
import { Sku, ZoHouse } from "apps/admin/src/config";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import TicketSidebar from "../../sidebars/TicketSidebar";
import { App } from "antd";

interface EventTicketsProps {
  data: Sku[] | undefined;
  operatorId: string;
  inventoryId: string;
  saveButtonRef: React.MutableRefObject<(() => void) | undefined>;
}

interface CustomTicket {
  id: number | string;
  name: string;
  price: number;
  units: number;
  location: string;
  hasInfiniteUnits: boolean;
}

const EventTickets: React.FC<EventTicketsProps> = ({
  data,
  operatorId,
  inventoryId,
  saveButtonRef,
}) => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [isTicketSidebarVisible, showTicketSidebar, hideTicketSidebar] =
    useVisibilityState();

  const [selectedTicket, setSelectedTicket] = useState<Sku | null>(null);
  const [customTickets, setCustomTickets] = useState<CustomTicket[]>([]);

  const { mutateAsync: createTicket } = useMutationApi("CAS_SKU");

  const { data: operator } = useQueryApi<ZoHouse>(
    "CAS_OPERATORS",
    {
      enabled: operatorId != undefined,
      select: (data) => data.data,
    },
    `${operatorId}/`
  );

  const handleTicketClick = (ticket: Sku) => {
    setSelectedTicket(ticket);
    showTicketSidebar();
  };

  const handleDeleteCustomTicket = (ticket: CustomTicket) => {
    setCustomTickets(
      customTickets.filter((element) => element.name !== ticket.name)
    );
  };

  const handleAddCustomTicket = (ticket: CustomTicket) => {
    setCustomTickets((prev) => [...prev, ticket]);
  };

  const handleCreateCustomTickets = () => {
    if (customTickets.length > 0) {
      const eligibility =
        data && data?.length > 0 ? data[0].eligibility_criteria : null;
      customTickets.forEach((ticket: CustomTicket) => {
        const data: GeneralObject = {
          name: ticket.name,
          specifications: {},
          data: {},
          price: +ticket.price || 0,
          slabs: [],
          sellable: true,
          inventory: inventoryId,
          units: +ticket.units || 0,
          has_infinite_units: ticket.hasInfiniteUnits,
        };

        if (eligibility) {
          data["eligibility_criteria"] = eligibility;
        }

        const filteredData = removeUndefinedKeys(data);

        createTicket(
          {
            data: filteredData,
          },
          {
            onSuccess(data) {
              message.success(`${data.data.name} tickets created.`);
              queryClient.invalidateQueries(["cas", "sku"]);
              setCustomTickets([]);
              setSelectedTicket(null);
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      });
    }
  };

  const handleHideTicketSidebar = () => {
    setSelectedTicket(null);
    hideTicketSidebar();
  };

  const handleCreateTicket = () => {
    setSelectedTicket(null);
    showTicketSidebar();
  };

  useEffect(() => {
    if (saveButtonRef.current) {
      saveButtonRef.current = handleCreateCustomTickets;
    }
  }, [customTickets]);

  return (
    <>
      <div className="flex flex-col h-full">
        <Typography.Title
          level={4}
          type="secondary"
          style={{ textTransform: "uppercase" }}
        >
          Tickets
        </Typography.Title>
        <div className="flex-1 w-full md:w-1/2">
          {data && data?.length > 0 && (
            <Flex vertical gap="small">
              {data?.map((ticket: Sku) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="bg-zui-light p-4 rounded-md cursor-pointer hover:bg-opacity-80"
                >
                  <Flex justify="space-between" align="center">
                    <Typography.Text strong>{ticket.name}</Typography.Text>
                  </Flex>
                  <Typography.Text type="secondary" className="text-sm">
                    <Space>
                      <Person fontSize="small" />
                      <span>
                        {ticket.has_infinite_units ? "∞" : ticket.units} Tickets
                      </span>
                      {ticket.name !== "Free" && (
                        <>
                          <MonetizationOn fontSize="small" />
                          <span>
                            ₹
                            {(
                              ticket.price *
                              Math.pow(
                                10,
                                operator?.currency
                                  ? -operator.currency.decimals
                                  : 0
                              )
                            ).toLocaleString()}
                            /Person
                          </span>
                        </>
                      )}
                      {ticket.space !== null && (
                        <>
                          <LocationOn fontSize="small" />
                          <span>{ticket.space.name}</span>
                        </>
                      )}
                    </Space>
                  </Typography.Text>
                </div>
              ))}
            </Flex>
          )}

          {customTickets.length > 0 && (
            <Flex vertical gap="small" className="mt-4">
              {customTickets.map((ticket) => (
                <div
                  className="bg-zui-light border border-zui-silver p-4 rounded-md"
                  key={ticket.id}
                >
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap="small">
                      <Typography.Text strong>{ticket.name}</Typography.Text>
                      <Tag color="warning">Unsaved</Tag>
                    </Flex>
                    <Button
                      type="text"
                      icon={<Delete fontSize="small" />}
                      onClick={() => handleDeleteCustomTicket(ticket)}
                    />
                  </Flex>
                  <Typography.Text type="secondary" className="text-sm">
                    <Space>
                      <Person fontSize="small" />
                      <span>
                        {ticket.hasInfiniteUnits ? "∞" : ticket.units} Tickets
                      </span>
                      <MonetizationOn fontSize="small" />
                      <span>
                        ₹
                        {+ticket.price *
                          Math.pow(
                            10,
                            operator?.currency ? -operator.currency.decimals : 0
                          )}
                        /Person
                      </span>
                    </Space>
                  </Typography.Text>
                </div>
              ))}
            </Flex>
          )}

          <div className="w-full mt-4">
            <Button
              type="dashed"
              icon={<Add />}
              block
              onClick={handleCreateTicket}
            >
              Add Ticket
            </Button>
          </div>
        </div>
      </div>
      <TicketSidebar
        isOpen={isTicketSidebarVisible}
        data={selectedTicket}
        onClose={handleHideTicketSidebar}
        ticketId={selectedTicket?.id || undefined}
        currency={operator?.currency}
        addTicket={handleAddCustomTicket}
      />
    </>
  );
};

export default EventTickets;
