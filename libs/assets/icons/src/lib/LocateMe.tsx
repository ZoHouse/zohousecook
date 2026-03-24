import * as React from "react";
import { SVGProps } from "react";

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
    <g clipPath="url(#a)">
      <path
        fill={props.fill || "#E33056"}
        fillRule="evenodd"
        d="M14 2a2 2 0 1 0-4 0v1.018A9.213 9.213 0 0 0 3.018 10H2a2 2 0 1 0 0 4h1.018A9.213 9.213 0 0 0 10 20.982V22a2 2 0 1 0 4 0v-1.018A9.212 9.212 0 0 0 20.982 14H22a2 2 0 1 0 0-4h-1.018A9.213 9.213 0 0 0 14 3.018V2ZM6.8 12a5.2 5.2 0 1 1 10.4 0 5.2 5.2 0 0 1-10.4 0Zm5.2 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h24v24H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SvgComponent;
