import { User } from "@zo/definitions/auth";
import { shortenString } from "@zo/utils/string";
import React, { memo } from "react";
import Avatar from "./Avatar";

interface UserMiniProps {
  data: User;
}

const UserMini: React.FC<UserMiniProps> = ({ data }) => {
  const name =
    data?.nickname ||
    data?.name ||
    data?.first_name ||
    data?.email_address ||
    data?.mobile_number ||
    shortenString(data?.wallet_address, 10) ||
    "Zo User";

  return (
    <div className="flex items-center space-x-3">
      <Avatar
        src={data?.pfp_image || data?.data?.avatar || data?.pfp}
        alt={name}
        isFounder={data?.data?.membership === "founder"}
      />
      <span>{name}</span>
    </div>
  );
};

export default memo(UserMini);
