type GymIconProps = {
  fill: string;
  stroke: string;
  height?: number;
  width?: number;
};

export const GymIcon = ({ fill, stroke, height, width }: GymIconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 39 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.91837 8.49825H2H1V9.49825V12.5017V13.5017H2H3.91837V16.9965V17.9965H4.91837H6.83674V20V21H7.83674H10.7551H11.7551V20V13.5017H27.2449V20V21H28.2449H31.1633H32.1633V20V17.9965H34.0816H35.0816V16.9965V13.5017H37H38V12.5017V9.49825V8.49825H37H35.0816V5.0035V4.0035H34.0816H32.1633V2V1H31.1633H28.2449H27.2449V2V8.49825H11.7551V2V1L10.7551 1H7.83674H6.83674V2V4.0035H4.91837H3.91837V5.0035V8.49825Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
    />
  </svg>
);
