import React from "react";
import { GeneralObject } from "@zo/definitions/general";
import { Avatar, Flex } from "antd";
import { Person } from "@mui/icons-material";
import { isValidString } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";

interface UserMiniProps {
  user: GeneralObject;
  getUserNameHandler?: (user: GeneralObject) => string;
  getUserAvatarHandler?: (user: GeneralObject) => string;
}

const getUserName = (user: GeneralObject) => {
  return (
    user?.nickname ||
    user?.email ||
    user?.name ||
    user?.full_name ||
    user?.email_address ||
    user?.mobile_number ||
    [user?.first_name, user?.middle_name, user?.last_name]
      .filter(isValidString)
      .join(" ") ||
    formatAddress(user?.wallet_address) ||
    user?.custom_nickname ||
    "Zo User"
  );
};

const getUserAvatar = (user: GeneralObject) => {
  return user?.avatar?.image || user?.pfp_image;
};

const UserMini: React.FC<UserMiniProps> = ({
  user,
  getUserNameHandler,
  getUserAvatarHandler,
}) => {
  return (
    <Flex align="center" gap={8}>
      <Avatar
        icon={<Person fontSize="small" />}
        src={
          getUserAvatarHandler
            ? getUserAvatarHandler(user)
            : getUserAvatar(user)
        }
      />
      {getUserNameHandler ? getUserNameHandler(user) : getUserName(user)}
    </Flex>
  );
};

export default UserMini;
