import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, Flex, Form, Input, Typography, message } from "antd";
import React, { useState } from "react";
import { useQueryClient } from "react-query";

interface PoaHolderProps {
  poaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PoaHolder: React.FC<PoaHolderProps> = ({ poaId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [addresses, setAddresses] = useState<{ key: number; value: string }[]>([
    { key: 0, value: "" },
  ]);

  const { mutate, isLoading } = useMutationApi("CAS_POAS");

  const handleAddField = () => {
    setAddresses([...addresses, { key: addresses.length, value: "" }]);
  };

  const handleRemoveField = (key: number) => {
    setAddresses(addresses.filter((item) => item.key !== key));
  };

  const handleChange = (key: number, value: string) => {
    setAddresses(
      addresses.map((item) =>
        item.key === key ? { ...item, value: value } : item
      )
    );
  };

  const handleSave = () => {
    if (poaId) {
      const data = addresses
        .map((item) => item.value.trim())
        .filter((value) => value.length > 0);

      if (!data.length) {
        message.warning("Please enter at least one valid address");
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
            message.success("Holder Added Successfully");
            queryClient.invalidateQueries(["cas", "poa"]);
            setAddresses([{ key: 0, value: "" }]);
            form.resetFields();
            onClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    } else {
      message.warning("An Error Occurred");
    }
  };

  return (
    <Drawer
      title="Add Holder"
      placement="right"
      onClose={onClose}
      open={isOpen}
      extra={
        <Button
          type="primary"
          onClick={handleSave}
          disabled={poaId == null || isLoading}
          loading={isLoading}
        >
          Add
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Typography.Text
          type="secondary"
          strong
          className="text-zui-silver uppercase text-base"
        >
          Wallet Addresses
        </Typography.Text>
        <Flex vertical gap={8} className="mt-6">
          {addresses.map((field, index) => (
            <Flex align="center" gap={8} key={field.key}>
              <Form.Item
                className="w-full mb-0"
                validateTrigger={["onChange", "onBlur"]}
                rules={[
                  { required: true, message: "Please input wallet address" },
                ]}
              >
                <Input
                  placeholder="Enter wallet address"
                  className="w-full"
                  size="large"
                  value={field.value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
              </Form.Item>
              {addresses.length > 1 && (
                <Button
                  type="text"
                  className="flex items-center"
                  icon={<DeleteOutlineOutlinedIcon fontSize="small" />}
                  onClick={() => handleRemoveField(field.key)}
                />
              )}
            </Flex>
          ))}
        </Flex>

        <Form.Item>
          <Button
            type="dashed"
            onClick={handleAddField}
            icon={<AddOutlinedIcon />}
            className="w-full mt-4"
            size="large"
          >
            Add Wallet Address
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PoaHolder;
