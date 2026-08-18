import styled from '@emotion/styled';
import React, { useEffect, useRef, useState } from 'react';
import {
  CommonsAllowedWidth,
  getCommonsImageUrl,
} from '../../services/images/getCommonsImageUrl';

const TRANSITION = '0.5s ease';

export const ProgressiveImageWrapper = styled.span`
  position: relative;
  display: block;
  overflow: hidden;
  line-height: 0;
`;

type ObjectFit = 'cover' | 'contain';

const Placeholder = styled.img<{
  $blur: number;
  $loaded: boolean;
  $objectFit: ObjectFit;
}>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: ${({ $objectFit }) => $objectFit};
  filter: blur(${({ $blur }) => $blur}px);
  /* blur would leave translucent edges otherwise – but only cover may overflow */
  ${({ $blur, $objectFit }) =>
    $blur > 0 && $objectFit === 'cover' && `transform: scale(1.15);`}
  opacity: ${({ $loaded }) => ($loaded ? 0 : 1)};
  transition: opacity ${TRANSITION};
  pointer-events: none;
`;

const FullImage = styled.img<{ $loaded: boolean; $objectFit: ObjectFit }>`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: ${({ $objectFit }) => $objectFit};
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity ${TRANSITION};
`;

const readRatio = (img: HTMLImageElement | null) =>
  img?.naturalWidth && img.naturalHeight
    ? img.naturalWidth / img.naturalHeight
    : null;

type Props = {
  src: string;
  /** tiny version of `src` – shown blurred until the full image arrives */
  placeholderSrc?: string;
  alt: string;
  blur?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  width?: number;
  height?: number;
  title?: string;
  objectFit?: ObjectFit;
  /** natural width / height, reported as soon as either of the two images loads */
  onRatio?: (ratio: number) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
};

export const ProgressiveImage = ({
  src,
  placeholderSrc,
  alt,
  blur = 12,
  className,
  loading = 'lazy',
  fetchPriority,
  width,
  height,
  title,
  objectFit = 'cover',
  onRatio,
  onError,
}: Props) => {
  const placeholderRef = useRef<HTMLImageElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);

    // cached images may be complete before onLoad is attached
    const cachedRatio =
      readRatio(imageRef.current) ?? readRatio(placeholderRef.current);
    if (cachedRatio) {
      onRatio?.(cachedRatio);
    }
    if (imageRef.current?.complete) {
      setLoaded(true);
    }
  }, [src, placeholderSrc, onRatio]);

  const reportRatio = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const ratio = readRatio(e.currentTarget);
    if (ratio) {
      onRatio?.(ratio);
    }
  };

  return (
    <ProgressiveImageWrapper className={className} title={title}>
      {placeholderSrc && (
        <Placeholder
          ref={placeholderRef}
          src={placeholderSrc}
          alt=""
          aria-hidden
          width={width}
          height={height}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          $blur={blur}
          $loaded={loaded}
          $objectFit={objectFit}
          onLoad={reportRatio}
        />
      )}
      <FullImage
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        $loaded={loaded}
        $objectFit={objectFit}
        onLoad={(e) => {
          reportRatio(e);
          setLoaded(true);
        }}
        onError={(e) => {
          setLoaded(true);
          onError?.(e);
        }}
      />
    </ProgressiveImageWrapper>
  );
};

type CommonsProps = Omit<Props, 'src' | 'placeholderSrc'> & {
  /** full Commons name including the `File:` prefix */
  photo: string;
  width: CommonsAllowedWidth;
  placeholderWidth?: Extract<CommonsAllowedWidth, 20 | 40 | 60>;
};

export const CommonsProgressiveImage = ({
  photo,
  width,
  placeholderWidth = 40,
  ...rest
}: CommonsProps) => (
  <ProgressiveImage
    src={getCommonsImageUrl(photo, width)}
    placeholderSrc={getCommonsImageUrl(photo, placeholderWidth)}
    {...rest}
  />
);
