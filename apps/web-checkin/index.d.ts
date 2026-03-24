/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "*.svg" {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

type CheckinStep =
  | "login"
  | "welcome"
  | "booking_id"
  | "booking_confirmation"
  | "personal_info"
  | "id_selection"
  | "id_upload"
  | "last_steps"
  | "checkin_success"
  | "username";

type CheckinID = {
  id: string;
  name: string;
  pages: {
    id: string;
    name: string;
    sample_image: string;
  }[];
};
