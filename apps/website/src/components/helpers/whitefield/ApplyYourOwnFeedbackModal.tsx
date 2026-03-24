import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useMutationApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Button, Form, FormElementType } from "@zo/moal";
import { fontClassName } from "@zo/utils/font";
import { useFormData } from "@zo/utils/hooks";
import { isValidPhoneNumber } from "@zo/utils/number";
import { isValidEmail, isValidString } from "@zo/utils/string";
import { utmKeys } from "apps/website/src/config";
import { showToast } from "libs/moal/src/utils";
import { useRouter } from "next/router";
import React, { useMemo, useState } from "react";
import { Modal } from "../../ui";
import { areRequiredFieldsPresent, cn, filterObjectByKeys } from "../../utils";

interface ApplyYourOwnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApplyYourOwnModal: React.FC<ApplyYourOwnModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      className={cn(
        "h-full w-full md:w-[336px] md:h-[416px] pt-0 rounded-2xl",
        fontClassName
      )}
      isOpen={isOpen}
      onOpenChange={onClose}
      title=""
    >
      <div className="flex flex-col gap-6 items-center justify-center px-10">
        <img
          className="w-20"
          src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/66679e90-116f-4e0c-8216-3bdcb580e96d_20240822081525.gif`}
          alt=""
        />
        <h5 className="text-2xl font-semibold text-center tracking-[1%] leading-9">
          Zo Zo Zo! Request sent.
        </h5>
        <p className="text-center text-zui-silver">
          Vibe manager will call you within 24 hours.
        </p>
      </div>
    </Modal>
  );
};

export default ApplyYourOwnModal;
