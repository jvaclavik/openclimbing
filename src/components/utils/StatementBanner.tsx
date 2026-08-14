import styled from '@emotion/styled';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Stack, Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';

const Root = styled('div', {
  shouldForwardProp: (prop) => prop !== '$clickable',
})<{ $clickable?: boolean }>`
  position: relative;
  overflow: hidden;
  display: block;
  text-decoration: none !important;
  color: #fff;
  padding: 22px 20px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.palette.primary.main} 0%,
    ${({ theme }) => theme.palette.background.searchBox} 100%
  );
  ${({ $clickable }) =>
    $clickable &&
    `
    cursor: pointer;
    transition: filter 0.2s ease;
  `}

  ${({ $clickable }) =>
    $clickable &&
    `
    &:hover,
    &:focus-within {
      filter: brightness(1.07);
      text-decoration: none !important;
    }
  `}
`;

const Orb = styled.div<{ $size: number; $right: number; $top: number }>`
  position: absolute;
  right: ${({ $right }) => $right}px;
  top: ${({ $top }) => $top}px;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
`;

type StatementBannerProps = {
  title: string;
  description: string;
  cta?: string;
  href?: string;
  locale?: string;
};

export const StatementBanner = ({
  title,
  description,
  cta,
  href,
  locale,
}: StatementBannerProps) => {
  const inner = (
    <>
      <Orb $size={140} $right={-36} $top={-40} />
      <Orb $size={72} $right={48} $top={-16} />
      <FavoriteIcon sx={{ fontSize: 22, mb: 1, opacity: 0.95 }} />
      <Typography
        variant="h4"
        component="p"
        fontWeight={800}
        lineHeight={1.2}
        sx={{ position: 'relative' }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        mt={0.75}
        lineHeight={1.5}
        sx={{ position: 'relative', opacity: 0.92 }}
      >
        {description}
      </Typography>
      {cta && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          mt={1.5}
          sx={{ position: 'relative', fontWeight: 700 }}
        >
          <Typography variant="body2" fontWeight={800}>
            {cta}
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </Stack>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        locale={locale}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <Root $clickable>{inner}</Root>
      </Link>
    );
  }

  return <Root>{inner}</Root>;
};
