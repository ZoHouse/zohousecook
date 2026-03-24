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
      d="M2 4h2v16H2zM12 4h2v16h-2zM20 10h2v10h-2zM12 2v2H4V2zM22 20v2H2v-2zM20 8v2h-6V8zM10 6v2H6V6zM10 10v2H6v-2zM10 14v2H6v-2zM18 12v2h-2v-2zM18 16v2h-2v-2z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
