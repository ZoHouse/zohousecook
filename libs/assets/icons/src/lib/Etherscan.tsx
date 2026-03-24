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
      d="M6.164 11.687a.849.849 0 0 1 .853-.849l1.415.005a.85.85 0 0 1 .85.85v5.348c.16-.047.364-.097.587-.15a.708.708 0 0 0 .547-.69V9.569a.85.85 0 0 1 .85-.851h1.417a.85.85 0 0 1 .85.85v6.158s.355-.144.7-.29a.71.71 0 0 0 .434-.653v-7.34a.85.85 0 0 1 .85-.85h1.418a.85.85 0 0 1 .85.85v6.044c1.229-.89 2.474-1.961 3.462-3.249a1.427 1.427 0 0 0 .217-1.332A10.009 10.009 0 1 0 3.33 17.176a1.266 1.266 0 0 0 1.208.626c.268-.024.601-.057.998-.104a.708.708 0 0 0 .628-.703v-5.308ZM6.133 20.265A10.013 10.013 0 0 0 22.01 11.48c-3.658 5.457-10.413 8.008-15.876 8.785"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
