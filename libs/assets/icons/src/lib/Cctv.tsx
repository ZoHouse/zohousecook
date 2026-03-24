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
      d="M7 4h12v2H7zM7 10h12v2H7zM5 6h2v4H5zM7 12h2v2H7zM5 14h2v2H5zM3 12h2v8H3zM19 6h2v4h-2zM15 6h2v4h-2z"
    />
  </svg>
)

const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
