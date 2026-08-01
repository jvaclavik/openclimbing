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

const Placeholder = styled.img<{ $blur: number; $loaded: boolean }>`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(${({ $blur }) => $blur}px);
  transform: scale(1.15); /* blur would leave translucent edges otherwise */
  opacity: ${({ $loaded }) => ($loaded ? 0 : 1)};
  transition: opacity ${TRANSITION};
  pointer-events: none;
`;

const FullImage = styled.img<{ $loaded: boolean }>`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${({ $loaded }) => ($loaded ? 1 : 0)};
  transition: opacity ${TRANSITION};
`;

type Props = {
  src: string;
  /** tiny version of `src` – shown blurred until the full image arrives */
  placeholderSrc?: string;
  alt: string;
  blur?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  title?: string;
};

export const ProgressiveImage = ({
  src,
  placeholderSrc,
  alt,
  blur = 12,
  className,
  loading = 'lazy',
  title,
}: Props) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (imageRef.current?.complete) {
      setLoaded(true); // cached images may be done before onLoad is attached
    }
  }, [src]);

  return (
    <ProgressiveImageWrapper className={className} title={title}>
      {placeholderSrc && (
        <Placeholder
          src={placeholderSrc}
          alt=""
          aria-hidden
          $blur={blur}
          $loaded={loaded}
        />
      )}
      <FullImage
        ref={imageRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        $loaded={loaded}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
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
