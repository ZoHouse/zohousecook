import {
  CloudUploadOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Button, Card, Space, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import React from "react";

interface CSVUploadProps {
  onUpload: (file: UploadFile) => boolean;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onUpload }) => {
  const downloadTemplate = () => {
    const template =
      "mobile_country_code,mobile_number,credits,$zo\n91,9876543210,100,50\n91,9876543211,200,100";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vibe_curator_rewards_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card
      title={
        <Space>
          <CloudUploadOutlined />
          Bulk Upload
        </Space>
      }
      size="small"
    >
      <Upload.Dragger
        accept=".csv"
        beforeUpload={onUpload}
        showUploadList={false}
        style={{ marginBottom: 12 }}
      >
        <p className="ant-upload-drag-icon">
          <FileTextOutlined style={{ fontSize: 32, color: "#1890ff" }} />
        </p>
        <p className="ant-upload-text">Click or drag CSV file to upload</p>
        <p className="ant-upload-hint" style={{ fontSize: 11 }}>
          Format: country_code, mobile_number, credits, $zo
        </p>
      </Upload.Dragger>
      <Button
        type="link"
        icon={<DownloadOutlined />}
        onClick={downloadTemplate}
        size="small"
        block
      >
        Download Template
      </Button>
    </Card>
  );
};

export default CSVUpload;
