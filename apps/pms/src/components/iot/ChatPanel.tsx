// apps/pms/src/components/iot/ChatPanel.tsx
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
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, background: '#cfff50', borderRadius: '50%' }} />
          <Text style={{ color: '#cfff50', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 }}>
            House AI
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="text" onClick={onClear} style={{ color: '#666', fontSize: 10 }}>
            Clear
          </Button>
          <Button size="small" type="text" onClick={onClose} style={{ color: '#666', fontSize: 10 }}>
            Close
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text style={{ color: '#444', fontFamily: 'monospace', fontSize: 11 }}>
              Ask about cameras, lights, locks, or anything about the house.
            </Text>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: 12 }}>
            <Text style={{
              color: msg.role === 'user' ? '#888' : '#cfff50',
              fontFamily: 'monospace',
              fontSize: 9,
              display: 'block',
              marginBottom: 4,
            }}>
              {msg.role === 'user' ? 'You' : 'House AI'}
            </Text>
            <div style={{
              background: msg.role === 'user' ? '#2a2a4a' : '#1a2a1a',
              border: msg.role === 'assistant' ? '1px solid #333' : 'none',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              color: '#ccc',
              fontFamily: 'monospace',
              lineHeight: 1.5,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: '#cfff50', fontFamily: 'monospace', fontSize: 9, display: 'block', marginBottom: 4 }}>
              House AI
            </Text>
            <div style={{
              background: '#1a2a1a',
              border: '1px solid #333',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              color: '#888',
              fontFamily: 'monospace',
            }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #333', display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="ask the house anything..."
          variant="borderless"
          style={{
            flex: 1,
            background: '#0d0d1a',
            borderRadius: 6,
            color: '#ccc',
            fontFamily: 'monospace',
            fontSize: 11,
          }}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          loading={isLoading}
          style={{
            background: '#cfff50',
            color: '#000',
            border: 'none',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: 11,
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
