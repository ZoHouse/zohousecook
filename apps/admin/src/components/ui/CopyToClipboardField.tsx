import { CheckOutlined, ContentCopy } from "@mui/icons-material";
import { useResponseFlash } from "@zo/utils/hooks";
import { copyTextToClipboard, isValidString } from "@zo/utils/string";
import { Button, Flex, Typography, message } from "antd";
import React from "react";

interface CopyToClipboardFieldProps {
  text: string;
  showLabel?: boolean;
  label?: string;
}

const CopyToClipboardField: React.FC<CopyToClipboardFieldProps> = ({
  text,
  label,
  showLabel = true,
}) => {
  const [copied, setCopied] = useResponseFlash(2000);

  const copy: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    copyTextToClipboard(text);
    setCopied("copied");
    message.success("Copied to clipboard");
  };

  return (
    <Flex align="center" justify="center" gap="16px">
      {showLabel && <Typography.Text ellipsis>{label || text}</Typography.Text>}
      <Button
        type="text"
        icon={
          isValidString(copied) ? (
            <CheckOutlined fontSize="small" />
          ) : (
            <ContentCopy fontSize="small" />
          )
        }
        onClick={copy}
        style={{ padding: "4px" }}
      />
    </Flex>
  );
};

export default CopyToClipboardField;
