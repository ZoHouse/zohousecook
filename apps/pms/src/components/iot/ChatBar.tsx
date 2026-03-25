// apps/pms/src/components/iot/ChatBar.tsx
import { useState } from 'react';
import { Input, Modal } from 'antd';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage } from '../../types/iot';

interface ChatBarProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
  onClear: () => void;
}

export function ChatBar({ messages, isLoading, onSend, onClear }: ChatBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    setExpanded(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8,
          height: 8,
          backgroundColor: '#52c41a',
          borderRadius: '50%',
          flexShrink: 0,
        }} />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ask the house anything..."
          variant="borderless"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <span
          onClick={() => setExpanded(true)}
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}
        >
          ⌘K
        </span>
      </div>

      <Modal
        open={expanded}
        onCancel={() => setExpanded(false)}
        footer={null}
        width={560}
        styles={{ content: { background: '#1f1f1f', padding: 0 } }}
        closable={false}
      >
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={onSend}
          onClear={onClear}
          onClose={() => setExpanded(false)}
        />
      </Modal>
    </>
  );
}
