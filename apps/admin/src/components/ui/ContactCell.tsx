import Icon from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";

interface ContactCellProps {
  phone_number?: string;
  whatsApp_number?: string;
  email?: string;
  containerClassname?: string;
}

const ContactCell: React.FC<ContactCellProps> = ({
  containerClassname,
  email,
  phone_number,
  whatsApp_number,
}) => {
  return (
    <div className={cn("flex items-center gap-[9px]", containerClassname)}>
      {phone_number && (
        <a
          target="_blank"
          href={`tel:${whatsApp_number}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="Phone" size={18} fill="#fff" />
        </a>
      )}
      {email && (
        <a target="_blank" href={`mailto:${email}`}>
          <Icon name="Email" size={18} fill="#fff" />
        </a>
      )}
      {whatsApp_number && (
        <a
          target="_blank"
          href={`https://wa.me/${whatsApp_number}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="WhatsApp" size={18} fill="#fff" />
        </a>
      )}
    </div>
  );
};

export default ContactCell;
