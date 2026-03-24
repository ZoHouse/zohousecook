import * as React from "react"
import { SVGProps, Ref, forwardRef, memo } from "react"
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24" viewBox="0 0 24 24"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
     fill={props.fill || "#FFF"}
      d="M4 20h16v2H4zM5 2h2v16H5zM7 2h2v2H7zM9 4h2v2H9zM7 8h6v2H7zM7 12h6v2H7zM15 2h2v2h-2zM17 4h2v2h-2zM13 2h2v16h-2z"
    />
  </svg>
)
const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
