import { SaveOutlined } from "@ant-design/icons";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import {
  App,
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Row,
  Space,
  Switch,
  Typography,
} from "antd";
import React from "react";
import { useQueryClient } from "react-query";

interface AddCostHeadProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

const AddCostHead: React.FC<AddCostHeadProps> = ({
  isOpen,
  onClose,
  refetch,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { mutate: createCostHead } = useMutationApi(
    "CAS_COST_HEADS",
    {},
    "",
    "POST"
  );

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleCreateCostHead = (values: any) => {
    createCostHead(
      {
        data: {
          ...values,
          individual: values.individual ? 1 : 0,
        },
      },
      {
        onSuccess(data) {
          queryClient.invalidateQueries({
            queryKey: ["cas", "cost-heads"],
          });
          message.success("Cost Head created successfully");
          handleClose();
          refetch();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <Typography.Title level={4} className="!mb-0">
            Add New Cost Head
          </Typography.Title>
          <Space>
            <Button
              type="primary"
              onClick={() => form.submit()}
              icon={<SaveOutlined />}
            >
              Create Cost Head
            </Button>
          </Space>
        </div>
      }
      placement="right"
      onClose={handleClose}
      open={isOpen}
      width={720}
      className="add-trip-drawer"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateCostHead}
        className="space-y-6"
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} lg={16}>
            <Form.Item
              name="name"
              label={<span className="font-medium">Cost Head Name</span>}
              rules={[{ required: true, message: "Please input the name!" }]}
              tooltip="Enter the name of the cost head"
            >
              <Input size="large" placeholder="Enter cost head name" />
            </Form.Item>
          </Col>
          <Col xs={24} lg={16}>
            <Form.Item
              name="individual"
              label={<span className="font-medium">Individual Cost</span>}
              valuePropName="checked"
              tooltip="Is this an individual cost head?"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default AddCostHead;
