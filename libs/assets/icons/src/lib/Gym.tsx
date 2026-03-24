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
      d="M9 11h6v2H9zM7 8h2v8H7zM15 8h2v8h-2zM17 10h2v4h-2zM5 10h2v4H5z"
    />
  </svg>
)

const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
