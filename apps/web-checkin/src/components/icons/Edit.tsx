import * as React from "react"
import { SVGProps, Ref, forwardRef, memo } from "react"
const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16px"
    height="16px"
    viewBox="0 0 16 16"
    fill="none"
    ref={ref}
    {...props}
  >
    <g clipPath="url(#a)">
      <path
        fill="#111"
        fillRule="evenodd"
        d="M8.486 1.61a4 4 0 1 1 5.657 5.656l-5.458 5.458-.095.096c-.472.473-.89.891-1.417 1.173-.527.282-1.107.398-1.762.528l-.132.026-1.17.234-.068.014c-.382.076-.801.16-1.155.178-.402.02-1.044-.023-1.564-.543S.76 13.268.78 12.867c.018-.354.102-.773.179-1.156l.013-.068.234-1.17.027-.132c.13-.655.245-1.235.527-1.762.282-.527.7-.944 1.174-1.416l.095-.096L8.486 1.61Zm3.771 1.885a1.333 1.333 0 0 0-1.885 0l1.885 1.886c.521-.521.521-1.365 0-1.886Zm-1.885 3.771L8.486 5.381 4.914 8.953c-.622.622-.732.75-.804.884-.071.135-.118.298-.29 1.16l-.234 1.17 1.17-.235c.862-.172 1.025-.218 1.159-.29.134-.072.263-.182.885-.803l3.572-3.573Z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h16v16H0z" />
      </clipPath>
    </defs>
  </svg>
)
const ForwardRef = forwardRef(SvgComponent)
const Memo = memo(ForwardRef)
export default Memo
