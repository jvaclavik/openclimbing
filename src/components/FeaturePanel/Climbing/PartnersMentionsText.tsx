import React from 'react';
import Link from 'next/link';
import { Typography } from '@mui/material';

const OSM_USER_BASE = 'https://www.openstreetmap.org/user';

const mentionRegex = /(@[^\s@]+)/g;

type PartnersMentionsTextProps = {
  text: string;
  variant?: React.ComponentProps<typeof Typography>['variant'];
  component?: React.ElementType;
};

/**
 * Renders free text; segments `@nickname` link to OSM user profile.
 */
export const PartnersMentionsText = ({
  text,
  variant = 'body2',
  component = 'span',
}: PartnersMentionsTextProps) => {
  if (!text.trim()) {
    return null;
  }

  const parts = text.split(mentionRegex);
  return (
    <Typography variant={variant} component={component} color="text.secondary">
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          const nick = part.slice(1);
          const href = `${OSM_USER_BASE}/${encodeURIComponent(nick)}`;
          return (
            <Link key={i} href={href} target="_blank" rel="noopener noreferrer">
              {part}
            </Link>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </Typography>
  );
};
