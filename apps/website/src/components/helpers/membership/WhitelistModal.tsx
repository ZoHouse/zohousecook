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

interface WhitelistModalProps {
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

const WhitelistModal: React.FC<WhitelistModalProps> = ({ isOpen, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      className={cn(
        "h-full w-full md:w-[64vw] md:h-[64vh] pt-0 rounded-2xl bg-zui-dark",
        fontClassName
      )}
      isOpen={isOpen}
      onOpenChange={handleClose}
      title=""
    >
      <iframe className="w-full h-full" src="https://tally.so/r/mVYoJJ" />
    </Modal>
  );
};

export default WhitelistModal;
