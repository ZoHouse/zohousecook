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
      d="M11 18h2v2h-2zM11 12h2v2h-2zM9 8h6v2H9zM7 4h10v2H7zM9 14h2v2H9zM7 10h2v2H7zM5 6h2v2H5zM3 8h2v2H3zM19 8h2v2h-2zM17 6h2v2h-2zM15 10h2v2h-2zM17 12h2v2h-2zM5 12h2v2H5zM13 14h2v2h-2z"
    />
  </svg>
)

const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
