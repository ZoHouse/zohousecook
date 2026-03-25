// apps/pms/src/hooks/iot/useIoTChat.ts
import { useState, useCallback } from 'react';
import { supabase } from '../../configs/supabase';
import type { ChatMessage } from '../../types/iot';

interface UseIoTChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

export function useIoTChat(operatorCode: string | undefined): UseIoTChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!operatorCode || !content.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('iot-chat', {
        body: {
          message: content.trim(),
          operator_code: operatorCode,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (fnError) throw fnError;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.reply || 'No response from House AI.',
        timestamp: Date.now(),
        function_calls: data?.function_calls,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI temporarily unavailable');
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'AI temporarily unavailable, try again in a moment.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [operatorCode, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
