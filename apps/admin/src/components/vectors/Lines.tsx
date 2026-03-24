import * as React from "react";
import { Ref, SVGProps, forwardRef, memo } from "react";

const SvgComponent = (
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={714}
    height={702}
    viewBox="0 0 714 702"
    fill="none"
    ref={ref}
    {...props}
  >
    <path
      stroke="#202020"
      d="M106.73 61C67.45 100.706-8.493 202.123 1.982 290.148c13.093 110.032 203.452 61.578 294.1 187.761C368.6 578.855 308.168 668.697 268.888 701"
    />
    <path
      stroke="#202020"
      d="M252.488 61c-32.247 43.363-88.478 147.433-55.424 216.813C238.38 364.538 562.867 364.538 443.956 659M554.993 1c-21.806 33.23-57.769 109.76-27.174 150.038C566.063 201.387 683.814 154.059 713 290"
    />
    <path
      stroke="#202020"
      d="M472.959 13c-38.405 56.493-71.932 164.498-8.42 225.974C531.243 303.537 698 258.141 698 471"
    />
    <path
      stroke="#202020"
      d="M398.898 35c-41.313 50.746-128.374 177.846-29.221 256.082 85.649 67.582 174.322 61.5 225.712 126.025 51.39 64.524-7.053 206.68-73.558 232.893"
    />
  </svg>
);

const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
