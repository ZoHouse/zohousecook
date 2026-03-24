import { useEffect, useState } from "react";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";

interface UseUpdateSocketResponseProps {
  socket: WebSocket | null;
  queryEndpoint: QueryEndpoints;
  data: GeneralObject[];
  setter: (data: GeneralObject[]) => void;
  identifier: string;
  enabled: boolean;
  handleSocketClose: () => void;
  isConnected: boolean;
}

const useUpdateSocketResponse = ({
  socket,
  identifier,
  queryEndpoint,
  data,
  setter,
  enabled = true,
  handleSocketClose,
  isConnected,
}: UseUpdateSocketResponseProps) => {
  const [refetchingId, setRefetchingId] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useQueryApi<GeneralObject>(
    queryEndpoint,
    {
      enabled: isValidString(refetchingId),
      select: (data) => data.data,
      onSuccess(response) {
        if (!action || !response) {
          console.log("No action or response", action, response);
          return;
        }

        const index = data.findIndex(
          (item: GeneralObject) => item.id === response?.id
        );
        if (action === "update") {
          const newData = data.map((item, i) =>
            i === index ? { ...response } : item
          );
          setter(newData as GeneralObject[]);
        }
        if (action === "create" || index === -1) {
          const newData = [response, ...data];
          setter(newData as GeneralObject[]);
        }
      },
    },
    `${refetchingId}/`,
    ""
  );

  useEffect(() => {
    if (!socket || !enabled || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      const responseData = JSON.parse(event.data);
      
      setAction(responseData.action);

      if (["update", "create"].includes(responseData.action)) {
        const payload = responseData.payload;
        setRefetchingId(payload[`${identifier}_id`]);
      }
    };

    const handleOpen = () => {
      console.log("Socket connection opened");
    };

    const handleClose = () => {
      console.log("Socket connection closed");
    };

    const handleError = (error: Event) => {
      console.error("Socket error:", error);
    };

    socket.onmessage = handleMessage;
    socket.onopen = handleOpen;
    socket.onclose = handleClose;
    socket.onerror = handleError;

    return () => {
      socket.onmessage = null;
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      handleSocketClose();
    };
  }, [socket, identifier, enabled, isConnected]);
  return null;
};

export default useUpdateSocketResponse;
