import { sendGTMEvent } from "@next/third-parties/google";
import { useMutationApi } from "@zo/auth";
import { Form, FormElementType } from "@zo/moal";
import { useFormData } from "@zo/utils/hooks";
import { isValidPhoneNumber } from "@zo/utils/number";
import { isValidEmail, isValidString } from "@zo/utils/string";
import { utmKeys } from "apps/website/src/config";
import gsap from "gsap";
import { showToast } from "libs/moal/src/utils";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ApplyYourOwnFeedbackModal } from ".";
import { useFadeInOnScroll } from "../../../hooks";
import { Button, CheckboxInput } from "../../ui";
import { areRequiredFieldsPresent, filterObjectByKeys } from "../../utils";

interface GetYourMembershipProps {}

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

const GetYourMembership: React.FC<GetYourMembershipProps> = () => {
  const router = useRouter();

  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const [isTermsCheck, setTermsChecked] = useState<boolean>(true);
  const termsAndConditionBox = useRef<HTMLDivElement>(null);

  const [isFeedBackModalOpen, setIsFeedbackModalOpen] =
    useState<boolean>(false);

  const { formData, getFormValue, handleChange, resetFormData } = useFormData(
    {}
  );

  const { mutate: requestInfo, isLoading } = useMutationApi("RWA_INFO_REQUEST");

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

  const handleSendRequestToZo = () => {
    sendGTMEvent({ event: "submit_form" });
    const utmData = filterObjectByKeys(utmKeys, router.query) || {};
    requestInfo(
      {
        data: {
          ...formData,
          data: { action: "apply_for_membership", ...utmData },
        },
      },
      {
        onSuccess: () => {
          router.push(`thankyou`, undefined, { shallow: true });
          setIsFeedbackModalOpen(true);
        },
        onError: () => {
          showToast("error", "Something went wrong.. Please try again.");
        },
      }
    );
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
  }, [formData, isTermsCheck]);

  const handleFeedbackClose = () => {
    resetFormData();
    setTermsChecked(true);
    setIsFeedbackModalOpen(false);
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
    <>
      <section ref={sectionRef} id="apply" className="relative z-20">
        <h2 className="sub-heading-2 text-center">
          Get your Membership spot now!{" "}
        </h2>
        <div className="w-full md:w-1/3 mx-auto mt-10">
          <Form
            formData={formData}
            formFields={formFields}
            getFormValue={getFormValue}
            handleChange={handleChange}
            className="space-y-4"
            onClick={sendGTMEvent.bind(null,{event:'click_form_field'})}
          />

          <div
            ref={termsAndConditionBox}
            className="flex items-center gap-3 mt-4 px-4 py-3 border border-zui-white/20 rounded-xl relative"
          >
            <CheckboxInput checked={isTermsCheck} onChange={setTermsChecked} />
            <span className="text-sm font-medium">
              I consent to be contacted by Zo World.
            </span>
          </div>

          <Button
            isLoading={isLoading}
            type="primary"
            className="mt-6 w-full md:w-full"
            disabled={isSendButtonDisabled}
            onClick={handleSendRequestToZo}
          >
            Become a Partner
          </Button>
        </div>
        <hr className="w-[80%] md:w-[60%] horizontal-divider my-20" />
      </section>
      <ApplyYourOwnFeedbackModal
        isOpen={isFeedBackModalOpen}
        onClose={handleFeedbackClose}
      />
    </>
  );
};

export default GetYourMembership;
