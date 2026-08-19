import { Link, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { getApiId, getUrlOsmId } from '../../services/helpers';
import { OSM_WEBSITE } from '../../services/osm/consts';

const TYPE_LABEL: Record<string, TranslationId> = {
  node: 'osmtype.node',
  way: 'osmtype.way',
  relation: 'osmtype.relation',
};

const TYPE_DESCRIPTION: Record<string, TranslationId> = {
  node: 'osmtype.node.description',
  way: 'osmtype.way.description',
  relation: 'osmtype.relation.description',
};

const OsmTypeTooltip = ({ shortId }: { shortId: string }) => {
  const osmId = getApiId(shortId);
  const urlOsmId = getUrlOsmId(osmId);
  const isNew = osmId.id < 0;

  return (
    <Stack gap={0.5} sx={{ maxWidth: 260 }}>
      <span>
        OSM {t(TYPE_LABEL[osmId.type])}
        <br />
        {t(TYPE_DESCRIPTION[osmId.type])}
      </span>
      {isNew ? (
        <span>Local ID: {urlOsmId}</span>
      ) : (
        <Link
          href={`${OSM_WEBSITE}/${urlOsmId}`}
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
          underline="always"
          onClick={(event) => event.stopPropagation()}
        >
          {urlOsmId}
        </Link>
      )}
    </Stack>
  );
};

type Props = {
  shortId: string;
};

export const OsmTypeLabel = ({ shortId }: Props) => {
  const { type } = getApiId(shortId);
  const labelId = TYPE_LABEL[type];
  if (!labelId) return null;

  return (
    <Tooltip title={<OsmTypeTooltip shortId={shortId} />} arrow>
      <Typography
        variant="caption"
        color="text.secondary"
        component="span"
        sx={{ whiteSpace: 'nowrap' }}
      >
        {t(labelId)}
      </Typography>
    </Tooltip>
  );
};
