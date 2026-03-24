import * as React from "react";
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
      d="M19.04 18.873h-2.962v-4.595c0-1.096-.02-2.506-1.542-2.506-1.543 0-1.78 1.193-1.78 2.426v4.675H9.794v-9.45h2.845v1.292h.04a3.104 3.104 0 0 1 1.19-1.148 3.143 3.143 0 0 1 1.617-.379c3.003 0 3.557 1.956 3.557 4.501l-.001 5.184ZM6.45 8.132c-.34 0-.673-.1-.956-.287a1.706 1.706 0 0 1-.633-.764 1.687 1.687 0 0 1 .372-1.856 1.725 1.725 0 0 1 1.874-.37c.314.13.583.348.772.628a1.69 1.69 0 0 1-.213 2.15 1.72 1.72 0 0 1-1.216.499Zm1.481 10.74H4.965V9.424H7.93v9.45Zm12.587-16.87H3.476a1.467 1.467 0 0 0-1.036.41A1.438 1.438 0 0 0 2 3.43v16.944c.005.383.163.75.44 1.017.276.268.649.416 1.036.412h17.042c.388.005.762-.143 1.04-.41.278-.269.437-.635.442-1.019V3.427a1.441 1.441 0 0 0-.442-1.017 1.47 1.47 0 0 0-1.04-.41"
    />
  </svg>
);
const ForwardRef = forwardRef(SvgComponent);
const Memo = memo(ForwardRef);
export default Memo;
