import { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography } from 'antd';
import type { ChatMessage } from '../../types/iot';

const { Text } = Typography;

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ChatPanel({ messages, isLoading, onSend, onClear, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, background: '#52c41a', borderRadius: '50%' }} />
          <Text strong style={{ fontSize: 13 }}>
            House AI
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="text" onClick={onClear}>
            Clear
          </Button>
          <Button size="small" type="text" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
              Ask about cameras, lights, locks, or anything about the house.
            </Text>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 12 }}>
            <Text style={{
              color: msg.role === 'user' ? 'rgba(255,255,255,0.45)' : '#52c41a',
              fontSize: 10,
              display: 'block',
              marginBottom: 4,
            }}>
              {msg.role === 'user' ? 'You' : 'House AI'}
            </Text>
            <div style={{
              background: msg.role === 'user' ? 'rgba(255,255,255,0.06)' : 'rgba(82,196,26,0.06)',
              border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 12,
              lineHeight: 1.6,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: '#52c41a', fontSize: 10, display: 'block', marginBottom: 4 }}>
              House AI
            </Text>
            <div style={{
              background: 'rgba(82,196,26,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
            }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="ask the house anything..."
          variant="borderless"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            fontSize: 12,
          }}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          loading={isLoading}
          type="primary"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
