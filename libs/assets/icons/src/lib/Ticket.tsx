import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      fill={props.fill || "#5a5a5a"}
      d="m1.179 9.188 1.956-.416.832 3.913-1.956.416zM2.426 15.057l1.956-.416.832 3.913-1.956.416zM3.967 12.685l1.956-.416.416 1.956-1.956.416zM7.048 7.941l1.956-.416.416 1.956-1.956.416zM7.88 11.854l1.956-.416.416 1.956-1.956.416zM8.711 15.766l1.956-.416.416 1.957-1.956.415zM2.719 6.816l15.65-3.326.416 1.956-15.65 3.326z"
    />
    <path
      fill={props.fill || "#5a5a5a"}
      d="m5.214 18.554 15.65-3.327.416 1.957L5.63 20.51zM18.786 5.446l1.956-.416 2.08 9.782-1.957.415z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
