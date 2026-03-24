import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize } from "@zo/utils/string";
import { Button, Drawer, Form, Input, Select, Space, Typography, message } from "antd";
import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { CustomQuestion } from "./AddEvent";

interface CustomQuestionSidebarProps {
  setQuestions?: (data: any) => void;
  questionnaireId?: string;
  question?: CustomQuestion;
  isOpen: boolean;
  onClose: () => void;
}

const { Title } = Typography;

const CustomQuestionSidebar: React.FC<CustomQuestionSidebarProps> = ({
  question,
  isOpen,
  onClose,
  setQuestions,
  questionnaireId,
}) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const format = Form.useWatch("format", form);
  const [options, setOptions] = useState<string[]>([""]);
  const { mutate: createQuestion } = useMutationApi("CAS_QUESTIONNAIRES");

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (questionnaireId) {
        const _options = options.filter((option: string) => option !== "");
        createQuestion(
          {
            data: {
              ...values,
              choices:
                _options.length > 0
                  ? _options.map((option: string) => ({
                      label: formatCapitalize(option),
                      value: option,
                    }))
                  : [],
            },
            route: `${questionnaireId}/questions/`,
          },
          {
            onSuccess(data) {
              message.success("Question Added");
              queryClient.invalidateQueries(["cas", "questionnaires"]);
              handleClose();
            },
            onError(error) {
              message.error(processResponseError(error));
            },
          }
        );
      } else if (setQuestions) {
        const _question: CustomQuestion = {
          id: crypto.randomUUID(),
          text: values.text,
          format: values.format,
        };
        if (values.format === "select" || values.format === "multiselect") {
          _question["choices"] = options.filter((opt) => opt !== "");
        }
        setQuestions((prev: CustomQuestion[]) => [...prev, _question]);
        handleClose();
      }
    });
  };

  const handleClose = () => {
    form.resetFields();
    setOptions([""]);
    onClose();
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Drawer
      title={question ? "Update Question" : "Add New Question"}
      open={isOpen}
      onClose={handleClose}
      extra={
        <Button type="primary" onClick={handleSave}>
          {question ? "Update" : "Add"} Question
        </Button>
      }
    >
      <Form form={form} layout="vertical" initialValues={question || {}}>
        <Form.Item
          name="text"
          label="Question"
          rules={[{ required: true, message: "Please enter the question" }]}
        >
          <Input placeholder="Enter your question" />
        </Form.Item>

        <Form.Item
          name="format"
          label="Type"
          rules={[{ required: true, message: "Please select a type" }]}
        >
          <Select>
            <Select.Option value="text">Text</Select.Option>
            <Select.Option value="number">Number</Select.Option>
            <Select.Option value="multiselect">Multiple Select</Select.Option>
            <Select.Option value="select">Single Select</Select.Option>
          </Select>
        </Form.Item>

        {format === "select" || format === "multiselect" ? (
          <div>
            <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
              Add Options
            </Title>
            {options.map((option, index) => (
              <Space key={index} style={{ display: "flex", marginBottom: 8 }}>
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  type="text"
                  icon={<DeleteIcon />}
                  onClick={() => removeOption(index)}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              onClick={addOption}
              icon={<AddIcon />}
              style={{ width: "100%", marginTop: 8 }}
            >
              Add Option
            </Button>
          </div>
        ) : null}
      </Form>
    </Drawer>
  );
};

export default CustomQuestionSidebar;
