import { Buffer } from "buffer";
import { useEffect, useState, useCallback } from "react";
import { getZoServerHeaders } from "../utils";

interface UseWebSocketConnectProps {
  route: string;
  connectOnMount?: boolean;
}

const useWebSocketConnect = ({
  route,
  connectOnMount = true,
}: UseWebSocketConnectProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const getAuthToken = () => {
    const headers = getZoServerHeaders();

    const token = headers.Authorization?.toString().split(" ")[1];
    const clientKey = headers["client-key"]?.toString();
    const clientDeviceId = headers["client-device-id"]?.toString();
    const clientDeviceSecret = headers["client-device-secret"]?.toString();

    const payload = {
      client_key: clientKey,
      client_device_id: clientDeviceId,
      client_device_secret: clientDeviceSecret,
      token: token,
    };

    const jsonString = JSON.stringify(payload);
    const base64String = Buffer.from(jsonString).toString("base64");

    return base64String;
  };

  const connect = useCallback(() => {
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      const baseURL = process.env.API_SOCKET_URL;
      const auth = getAuthToken();
      const newSocket = new WebSocket(`${baseURL}/ws/${route}?auth=${auth}`);

      newSocket.onopen = () => {
        setIsConnected(true);
      };

      newSocket.onclose = () => {
        setIsConnected(false);
      };

      setSocket(newSocket);
    }
  }, [socket, route]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  useEffect(() => {
    if (connectOnMount) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, connectOnMount]);

  return { socket, isConnected, connect, disconnect };
};

export default useWebSocketConnect;
