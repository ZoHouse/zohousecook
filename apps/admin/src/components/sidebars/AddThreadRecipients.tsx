import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { Button, Drawer, Spin, message } from "antd";
import { useForm } from "antd/es/form/Form";
import { Form, FormElement } from "../Form";

interface RecipientsProps {
  isOpen: boolean;
  threadId: string | null;
  onClose: () => void;
  onSuccess: (user: GeneralObject) => void;
}

const Recipients: React.FC<RecipientsProps> = ({
  threadId,
  onClose,
  isOpen,
  onSuccess,
}) => {
  const [form] = useForm();

  const { mutate, isLoading } = useMutationApi("CAS_COMMS_THREADS");

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      mutate(
        {
          data: { account: values.account },
          route: `${threadId}/recipients/`,
        },
        {
          onSuccess: (data) => {
            message.success("Recipient added successfully");
            onSuccess(data.data);
            handleClose();
          },
          onError(error) {
            message.error(processResponseError(error));
          },
        }
      );
    });
  };

  const formFields: FormElement[] = [
    {
      name: "account",
      label: "User",
      type: "searchselect",
      searchQueryApi: "CAS_COMMS_ACCOUNTS",
      required: true,
      optionValueAndLabelSelector: (data: any) => ({
        label: data?.profile?.nickname || data?.profile?.name || "",
        value: data?.id,
      }),
      responseFields: ["id", "profile"],
    },
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      title="Add a new Recipient"
      extra={
        <Button type="primary" onClick={handleSubmit}>
          Add
        </Button>
      }
    >
      <Spin spinning={isLoading}>
        <Form formData={form} formFields={formFields} />
      </Spin>
    </Drawer>
  );
};

export default Recipients;
