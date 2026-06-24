import React from 'react';

type CameraTopDownMarkerProps = {
  width?: number;
  height?: number;
  index?: number;
  azimuth?: number | null;
  /** horizontal field of view in degrees (from EXIF focal length) */
  fov?: number | null;
  active?: boolean;
  onClick?: () => void;
};

const ACCENT = '#ea5540';

const CENTER = 24;
const FUNNEL_RADIUS = 30;
// the active photo's funnel reaches further, hinting at a longer focal length
const ACTIVE_FUNNEL_RADIUS = 52;
// fallback opening angle when the focal length is missing from EXIF
const DEFAULT_FOV = 55;

// point on the funnel arc for a compass bearing (deg, clockwise from north)
const arcPoint = (bearingDeg: number, radius: number) => {
  const rad = (bearingDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
};

export const CameraMarker = ({
  width,
  height,
  azimuth = 0,
  fov,
  index,
  active = false,
  onClick,
}: CameraTopDownMarkerProps) => {
  const hasDirection = azimuth !== null && azimuth !== undefined;
  const ringColor = active ? ACCENT : '#444';
  const beamColor = active ? ACCENT : '#3a6ea5';

  // funnel is a circular sector centred on the azimuth, opened by the FOV;
  // a narrower wedge = longer lens / tighter shot, wider = wide-angle.
  const halfFov = (fov && fov > 0 ? fov : DEFAULT_FOV) / 2;
  const funnelRadius = active ? ACTIVE_FUNNEL_RADIUS : FUNNEL_RADIUS;
  const left = arcPoint(azimuth - halfFov, funnelRadius);
  const right = arcPoint(azimuth + halfFov, funnelRadius);
  const funnelPath = `M ${CENTER} ${CENTER} L ${left.x.toFixed(2)} ${left.y.toFixed(
    2,
  )} A ${funnelRadius} ${funnelRadius} 0 0 1 ${right.x.toFixed(2)} ${right.y.toFixed(
    2,
  )} Z`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 48 48"
      role="img"
      height={height}
      width={width}
      style={{
        overflow: 'visible',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
        transition: 'transform 0.15s ease',
        transform: active ? 'scale(1.25)' : 'scale(1)',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {hasDirection && (
        <path
          d={funnelPath}
          fill={beamColor}
          fillOpacity={active ? 0.45 : 0.28}
          stroke={beamColor}
          strokeOpacity={active ? 0.9 : 0.55}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}

      {/* white circle badge */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={12}
        fill="#fff"
        stroke={ringColor}
        strokeWidth={active ? 2.5 : 2}
      />

      <text
        x={CENTER}
        y={CENTER}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight="bold"
        fontSize={15}
        fill={active ? ACCENT : '#222'}
      >
        {index}
      </text>
    </svg>
  );
};
