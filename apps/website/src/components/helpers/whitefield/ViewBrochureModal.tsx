import { sendGTMEvent } from "@next/third-parties/google";
import { useMutationApi } from "@zo/auth";
import { Form, FormElementType } from "@zo/moal";
import { fontClassName } from "@zo/utils/font";
import { useFormData, useWindowSize } from "@zo/utils/hooks";
import { isValidPhoneNumber } from "@zo/utils/number";
import { isValidEmail, isValidString } from "@zo/utils/string";
import { utmKeys } from "apps/website/src/config";
import gsap from "gsap";
import { showToast } from "libs/moal/src/utils";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, CheckboxInput, Modal } from "../../ui";
import {
  areRequiredFieldsPresent,
  cn,
  filterObjectByKeys,
  rubikClassName,
} from "../../utils";

interface ViewBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNewSparkle = (): HTMLElement => {
  const sparkle = document.createElement("i");
  sparkle.classList.add("confetti");
  return sparkle;
};

const animateSparkle = (el: HTMLElement) => {
  const delay = Math.random() * 0.1;

  gsap
    .timeline({
      delay,
      onComplete: () => el.remove(),
    })
    .set(el, { opacity: 1 })
    .to(el, {
      x: gsap.utils.random(-150, 150),
      y: gsap.utils.random(-50, -150),
      scale: gsap.utils.random(0.8, 1.5),
      rotate: gsap.utils.random(-90, 90),
      duration: gsap.utils.random(0.4, 0.6),
      ease: "power1.out",
    })
    .to(el, {
      y: 150,
      opacity: 0,
      duration: gsap.utils.random(1, 1.5),
      ease: "power1.in",
    });
};

const ViewBrochureModal: React.FC<ViewBrochureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { isMobile } = useWindowSize();

  const [isTermsCheck, setTermsChecked] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  const termsAndConditionBox = useRef<HTMLDivElement>(null);

  const { formData, getFormValue, handleChange, resetFormData } = useFormData(
    {}
  );

  const { mutate: requestInfo } = useMutationApi("RWA_INFO_REQUEST");

  const formFields: FormElementType[] = useMemo(
    () => [
      {
        label: "Full Name",
        name: "name",
        type: "text",
        required: true,
      },
      {
        label: "Email",
        name: "email",
        type: "email",
        required: true,
      },
      {
        label: "Mobile",
        type: "phone",
        name: "mobile",
        required: true,
      },
    ],
    []
  );

  const handleClose = () => {
    resetFormData();
    onClose();
  };

  const downloadBrochure = async () => {
    const url =
      "https://static.cdn.zo.xyz/media/WTFxZo+Membership+Brochure.pdf";
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);

      if (isMobile) {
        link.download = "Zo_House_Whitefield.pdf";
      } else {
        link.target = "_blank";
      }

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      showToast("success", "Download Started.");

      sendGTMEvent({ event: "download_brochure" });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      showToast("error", "Failed to download the file:");
    }
  };

  const isSendButtonDisabled = useMemo(() => {
    if (!areRequiredFieldsPresent(formFields, formData)) {
      return true;
    }
    if (!isValidString(formData.name)) {
      return true;
    }
    if (!isValidEmail(formData.email)) {
      return true;
    }
    if (!isValidPhoneNumber(formData.mobile)) {
      return true;
    }
    if (!isTermsCheck) {
      return true;
    }

    return false;
  }, [formData, formFields, isTermsCheck]);

  const handleViewBrochure = () => {
    setIsLoading(true);

    sendGTMEvent({ event: "submit_form" });
    const utmData = filterObjectByKeys(utmKeys, router.query) || {};
    requestInfo(
      {
        data: {
          ...formData,
          terms: isTermsCheck,
          data: { action: "view_playbook", ...utmData },
        },
      },
      {
        onSuccess: () => {
          router.push(`thankyou`, undefined, { shallow: true });
          downloadBrochure();
        },
        onError: () => {
          setIsLoading(false);
          showToast("error", "Something went wrong.. Please try again.");
        },
      }
    );
  };

  const triggerConfetti = (clientX: number, clientY: number) => {
    if (!termsAndConditionBox.current) {
      return;
    }

    const sparkleCount = 15;

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = getNewSparkle();
      sparkle.dataset.rand = (Math.floor(Math.random() * 16) + 1).toString();
      termsAndConditionBox.current.appendChild(sparkle);
      animateSparkle(sparkle);
    }
  };

  useEffect(() => {
    if (isTermsCheck && termsAndConditionBox.current) {
      const { x, y } = termsAndConditionBox.current.getBoundingClientRect();
      console.log(x, y, "triggered");

      triggerConfetti(x, y);
    }
  }, [isTermsCheck]);

  return (
    <Modal
      className={cn(
        "h-full w-full md:w-[392px] md:h-[548px] pt-0 rounded-2xl bg-zui-dark",
        fontClassName
      )}
      isOpen={isOpen}
      onOpenChange={handleClose}
      title=""
    >
      {
        <div className="py-20 md:py-6">
          <h2
            className={cn(
              "text-2xl font-semibold leading-9 tracking-[1%] text-center",
              rubikClassName
            )}
          >
            View Zo House Whitefield Brochure
          </h2>
          <Form
            formData={formData}
            formFields={formFields}
            getFormValue={getFormValue}
            handleChange={handleChange}
            className="space-y-4 mt-6"
            onClick={sendGTMEvent.bind(null, { event: "click_form_field" })}
          />

          <div
            ref={termsAndConditionBox}
            className="flex items-center gap-3 mt-4 px-4 py-3 border border-zui-white/20 rounded-xl"
          >
            <CheckboxInput checked={isTermsCheck} onChange={setTermsChecked} />
            <span className="text-sm leading-5 font-medium">
              I consent to be contacted by Zo World.
            </span>
          </div>

          <Button
            isLoading={isLoading}
            type="primary"
            className="mt-6 md:w-full h-fit font-semibold"
            disabled={isSendButtonDisabled}
            onClick={handleViewBrochure}
          >
            {isMobile ? "Download Brochure" : "Open Brochure"}
          </Button>
        </div>
      }
    </Modal>
  );
};

export default ViewBrochureModal;
