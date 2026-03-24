import { Drawer } from "antd";
import { Form } from "../Form";
import { FormElement, FormElementType } from "../Form/FormElement/FormElement";
import { useForm } from "antd/es/form/Form";

interface UpdateProfileSidebarProps {
  open: boolean;
  onClose: () => void;
}

const UpdateProfileSidebar = ({ open, onClose }: UpdateProfileSidebarProps) => {
  const [form] = useForm();

  const formFields: FormElement[] = [
    {
      name: "first_name",
      label: "First Name",
      type: "text",
      required: true,
    },
    {
      name: "middle_name",
      label: "Middle Name",
      type: "text",
      required: false,
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      required: true,
    },
  ];

  return (
    <Drawer title="Update Profile" open={open} onClose={onClose}>
      <Form formData={form} formFields={formFields} />
    </Drawer>
  );
};

export default UpdateProfileSidebar;
