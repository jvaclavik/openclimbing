type CragIconProps = {
  fill: string;
  stroke: string;
  height?: number;
  width?: number;
};

export const CragIcon = ({
  fill,
  stroke,
  height = 24,
  width = 24,
}: CragIconProps) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <mask id="path-1-inside-1_1773_247" fill="white">
      <path d="M12.1463 2L21.2927 22.0323H3L12.1463 2Z" />
    </mask>
    <path d="M12.1463 2L21.2927 22.0323H3L12.1463 2Z" fill={fill} />
  </svg>
);
