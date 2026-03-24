import {
  CloudUploadOutlined,
  InsertDriveFileOutlined,
} from "@mui/icons-material";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import {
  Button,
  Drawer,
  Flex,
  Space,
  Spin,
  Typography,
  Upload,
  message,
} from "antd";
import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";

const { Text, Link } = Typography;

interface BulletinBulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string | null;
}

const BulletinBulkUpload: React.FC<BulletinBulkUploadProps> = ({
  boardId,
  onClose,
  isOpen,
}) => {
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<GeneralObject[]>([]);

  const { mutate, isLoading } = useMutationApi("CAS_BULLETINS");

  const handleClose = () => {
    setFile(null);
    setData([]);
    onClose();
  };

  const handleSave = () => {
    if (!file) {
      message.error("Please upload a CSV file first");
      return;
    }
    mutate(
      {
        data: data,
      },
      {
        onSuccess() {
          message.success("Bulletins Created Successfully");
          queryClient.invalidateQueries({ queryKey: ["cas", "bulletins"] });
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const parseCsv = (
    file: File,
    boardID: string
  ): Promise<{ board: string; data: { tweet_url: string } }[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: { data: GeneralObject[] }) => {
          const formattedData = results.data.map((row: GeneralObject) => ({
            board: boardID,
            data: { tweet_url: row.tweet },
          }));
          resolve(formattedData);
        },
        error: (error: any) => reject(error),
      });
    });
  };

  useEffect(() => {
    if (file && boardId) {
      parseCsv(file, boardId)
        .then((data) => {
          setData(data);
        })
        .catch((error) => {
          message.error("Error parsing CSV file");
          console.error("Error parsing CSV:", error);
        });
    }
  }, [file]);

  return (
    <Drawer
      title="Bulk Upload"
      placement="right"
      onClose={handleClose}
      open={isOpen}
      extra={
        <Space>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!file}
            loading={isLoading}
          >
            Upload
          </Button>
        </Space>
      }
    >
      <Spin spinning={isLoading}>
        <Space direction="vertical" size="large" className="w-full">
          <Upload.Dragger
            accept=".csv"
            beforeUpload={(file) => {
              if (file.type !== "text/csv") {
                message.error("Please upload a CSV file only!");
                return false;
              }
              setFile(file);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            showUploadList={{ showRemoveIcon: true }}
          >
            <Flex className="h-48" vertical align="center" justify="center">
              <CloudUploadOutlined fontSize="large" />
              <Text className="mt-4" strong>
                Click or drag CSV file to upload
              </Text>
              <Text type="secondary">Support for single CSV file only</Text>
            </Flex>
          </Upload.Dragger>

          <Space direction="vertical" size="small">
            <Space align="center">
              <InsertDriveFileOutlined />
              <Link
                href="https://static.cdn.zo.xyz/templates/bulletin-tweets-sample.csv"
                download="sample.csv"
              >
                Download Sample CSV
              </Link>
            </Space>

            {file && (
              <Text type="secondary">
                Number of Tweets: {data?.length || 0}
              </Text>
            )}
          </Space>
        </Space>
      </Spin>
    </Drawer>
  );
};

export default BulletinBulkUpload;
