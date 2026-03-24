import { toast } from "sonner";

type ToastType = "success" | "error" | "loading" | "warning" | "info";

const defaultMessage: { [key in ToastType]: string } = {
  "success": "Success",
  "error": "An error occurred",
  "loading": "Loading...",
  "warning": "Warning",
  "info": "Information"
};

const showToast = (type: ToastType = "success", message?: string | string[]) => {
  if (message) {
    if (Array.isArray(message)) {
      message.forEach((msg) => toast[type](msg));
    } else {
      toast[type](message);
    }
  } else {
    toast[type](defaultMessage[type])
  }
}


export { showToast };

