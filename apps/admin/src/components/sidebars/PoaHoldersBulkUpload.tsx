import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { Button, Drawer, Flex, Spin, Typography, Upload, message } from "antd";
import Papa from "papaparse";
import React, { useState } from "react";
import { useQueryClient } from "react-query";

interface PoaHoldersBulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  poaId: string | null;
}

const PoaHoldersBulkUpload: React.FC<PoaHoldersBulkUploadProps> = ({
  poaId,
  onClose,
  isOpen,
}) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<string[]>([]);
  const { mutate, isLoading } = useMutationApi("CAS_POAS");

  const handleClose = () => {
    setFile(null);
    setData([]);
    onClose();
  };

  const handleSave = () => {
    if (!data.length) {
      message.warning("Please upload a valid CSV file first");
      return;
    }

    mutate(
      {
        data: {
          wallet_addresses: data,
        },
        route: `${poaId}/holders/`,
      },
      {
        onSuccess() {
          message.success("Holders Added Successfully");
          queryClient.invalidateQueries({ queryKey: ["cas", "poa"] });
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      message.error("Please upload a CSV file");
      return false;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: GeneralObject[] }) => {
        const addresses = results.data
          .map((row: GeneralObject) => row.wallet_address?.trim())
          .filter(Boolean);

        if (!addresses.length) {
          message.error("No valid wallet addresses found in CSV");
          return;
        }

        setFile(file);
        setData(addresses);
        message.success(`Found ${addresses.length} wallet addresses`);
      },
      error: (error: any) => {
        message.error("Error parsing CSV file");
        console.error("Error parsing CSV:", error);
      },
    });

    return false;
  };

  return (
    <Drawer
      title="Bulk Upload Holders"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!data.length || isLoading || !poaId}
          loading={isLoading}
        >
          Upload
        </Button>
      }
    >
      <Spin spinning={isLoading}>
        <Flex vertical gap={24}>
          <Upload.Dragger
            accept=".csv"
            beforeUpload={handleFileUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Flex
              className="h-[180px]"
              vertical
              align="center"
              justify="center"
              gap={8}
            >
              <FileUploadOutlinedIcon fontSize="large" />
              <Typography.Title level={5}>
                Click or drag CSV file to upload
              </Typography.Title>
              <Typography.Text type="secondary">
                Only CSV files are supported
              </Typography.Text>
            </Flex>
          </Upload.Dragger>

          <Flex vertical gap={8}>
            <Typography.Link
              href="https://static.cdn.zo.xyz/templates/poa-holders-sample.csv"
              download="sample.csv"
            >
              Download Sample CSV
            </Typography.Link>

            {file && (
              <Flex vertical gap={8} align="start">
                <Typography.Text type="secondary">
                  Selected file:
                </Typography.Text>
                <Typography.Text strong>{file.name}</Typography.Text>
                <Typography.Text type="success">
                  ({data.length} addresses found)
                </Typography.Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Spin>
    </Drawer>
  );
};

export default PoaHoldersBulkUpload;
