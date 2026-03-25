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
        background: '#1a1a2e',
        border: '1px solid #2a2a4a',
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 8,
          height: 8,
          backgroundColor: '#cfff50',
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
            background: '#0d0d1a',
            borderRadius: 6,
            color: '#ccc',
            fontFamily: 'monospace',
            fontSize: 11,
          }}
        />
        <span
          onClick={() => setExpanded(true)}
          style={{ fontSize: 9, color: '#444', fontFamily: 'monospace', cursor: 'pointer' }}
        >
          ⌘K
        </span>
      </div>

      <Modal
        open={expanded}
        onCancel={() => setExpanded(false)}
        footer={null}
        width={560}
        styles={{ content: { background: '#141420', padding: 0 } }}
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
