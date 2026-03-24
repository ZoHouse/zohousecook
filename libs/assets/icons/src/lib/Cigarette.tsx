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
      d="M2 10h16v2H2zM2 14h16v2H2zM2 12h2v2H2zM16 12h2v2h-2zM12 12h2v2h-2zM18 8h2v2h-2zM20 6h2v2h-2zM14 6h2v2h-2zM18 4h2v2h-2zM12 4h2v2h-2zM20 2h2v2h-2zM14 2h2v2h-2z"
    />
  </svg>
)

const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
