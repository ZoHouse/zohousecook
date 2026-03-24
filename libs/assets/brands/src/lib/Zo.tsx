import * as React from "react";

function SvgComponent(
  props: React.SVGProps<SVGSVGElement>,
  svgRef?: React.Ref<SVGSVGElement>
) {
  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 491.46 292.63"
      ref={svgRef}
      {...props}
    >
      <defs>
        <linearGradient id="zo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            style={{ stopColor: "hsla(15, 88%, 54%, 1)", stopOpacity: 1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "hsla(276, 77%, 51%, 1)", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <path
        d="m0 0 93.02 292.63h51.55L52.33 0H0Zm439.9 0-97.67 292.63h52.33L491.46 0h-51.55ZM166.47 154.26h75.59l-82.18 103.49v34.88h164.34v-50h-80.14l82.86-103.49v-34.88H166.47v50Z"
        fill={props.fill || "#DB4E40"}
      />
    </svg>
  );
}

const ForwardRef = React.forwardRef(SvgComponent);
export default ForwardRef;
