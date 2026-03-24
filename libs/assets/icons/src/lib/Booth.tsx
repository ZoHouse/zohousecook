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
      d="M7 2h10v2H7zM7 20h10v2H7zM5 4h2v16H5zM17 4h2v16h-2zM9 16h2v-2H9zM9 14h6v-2H9zM11 10h2V8h-2zM13 16h2v-2h-2z"
    />
  </svg>
)

const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
