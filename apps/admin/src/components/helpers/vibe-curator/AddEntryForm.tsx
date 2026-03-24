import { PlusOutlined } from "@ant-design/icons";
import { Button, Card, Space } from "antd";
import { FormInstance } from "antd/es/form";
import React from "react";
import { Form, FormElement } from "../../Form";

interface AddEntryFormProps {
  form: FormInstance;
  onAddEntry: () => void;
}

const formFields: FormElement[] = [
  {
    name: "mobile_number",
    type: "phone",
    label: "Mobile Number",
    required: true,
    placeholder: "Enter Mobile Number",
  },
  {
    name: "credits",
    type: "number",
    label: "Credits",
    required: true,
    placeholder: "Enter Credits",
  },
  {
    name: "$zo",
    type: "number",
    label: "$Zo",
    required: true,
    placeholder: "Enter $Zo",
  },
];

const AddEntryForm: React.FC<AddEntryFormProps> = ({ form, onAddEntry }) => {
  return (
    <Card
      title={
        <Space>
          <PlusOutlined />
          Add Entry
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Form formData={form} formFields={formFields} />
      <Button
        type="primary"
        onClick={onAddEntry}
        block
        icon={<PlusOutlined />}
      >
        Add to List
      </Button>
    </Card>
  );
};

export default AddEntryForm;
