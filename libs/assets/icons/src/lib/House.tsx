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
      d="M2 9h2v12H2zM20 9h2v12h-2zM6 7v2H4V7zM10 17v2H8v-2zM12 15v2h-2v-2zM16 11v2h-2v-2zM14 13v2h-2v-2zM8 5v2H6V5zM10 3v2H8V3zM16 19v2h-6v-2zM14 9v2H8V9zM16 3v2h-2V3zM18 5v2h-2V5zM20 7v2h-2V7z"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
