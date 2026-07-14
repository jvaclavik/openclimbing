import React, { useMemo, useState } from 'react';
import Router, { useRouter } from 'next/router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { intl, t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { ClimbingArea } from '../../services/climbing-areas/getClimbingAreas';
import { TranslationId } from '../../services/types';
import Link from 'next/link';
import { ClimbingGuideInfo } from '../FeaturePanel/Climbing/ClimbingGuideInfo';
import { getCountryFlag, getCountryName } from '../../services/getCountryFlag';
import { PhotoCoverageRing } from '../FeaturePanel/Climbing/PhotoCoverageRing';

type ClimbingAreasPanelProps = {
  areas: ClimbingArea[];
};

type SortBy = 'photos' | 'sectors' | 'alphabetical';

const SORT_OPTIONS: { value: SortBy; labelId: TranslationId }[] = [
  { value: 'photos', labelId: 'climbingareas.sort_photos' },
  { value: 'sectors', labelId: 'climbingareas.sort_sectors' },
  { value: 'alphabetical', labelId: 'climbingareas.sort_alphabetical' },
];

type CountryGroup = {
  countryCode: string | null;
  name: string;
  areas: ClimbingArea[];
  cragCount: number;
  routesWithPhoto: number;
};

// Compares two {name, cragCount, routesWithPhoto} items by the chosen key.
// `photos` (default): drawn routes desc, then sectors desc; `sectors`: sectors
// desc, then drawn routes desc; both fall back to the name; `alphabetical`: name.
const compareBy =
  (sortBy: SortBy) =>
  (
    a: { name: string | null; cragCount: number; routesWithPhoto: number },
    b: { name: string | null; cragCount: number; routesWithPhoto: number },
  ) => {
    const byName = (a.name ?? '').localeCompare(b.name ?? '');
    if (sortBy === 'alphabetical') {
      return byName;
    }
    if (sortBy === 'sectors') {
      return (
        b.cragCount - a.cragCount ||
        b.routesWithPhoto - a.routesWithPhoto ||
        byName
      );
    }
    return (
      b.routesWithPhoto - a.routesWithPhoto ||
      b.cragCount - a.cragCount ||
      byName
    );
  };

// Groups areas by country and sorts both the areas inside each country and the
// countries themselves by the selected key (country uses summed values).
const groupByCountry = (
  areas: ClimbingArea[],
  sortBy: SortBy,
): CountryGroup[] => {
  const byCode = new Map<string, ClimbingArea[]>();
  for (const area of areas) {
    const key = area.countryCode ?? '';
    const list = byCode.get(key) ?? [];
    list.push(area);
    byCode.set(key, list);
  }

  const comparator = compareBy(sortBy);
  const groups = Array.from(byCode.entries()).map(([key, list]) => ({
    countryCode: key || null,
    name:
      getCountryName(key || null, intl.lang) ||
      t('climbingareas.unknown_country'),
    areas: [...list].sort(comparator),
    cragCount: list.reduce((sum, area) => sum + area.cragCount, 0),
    routesWithPhoto: list.reduce((sum, area) => sum + area.routesWithPhoto, 0),
  }));

  return groups.sort(comparator);
};

const CountryAccordion = ({
  group,
  defaultExpanded,
  backTarget,
}: {
  group: CountryGroup;
  defaultExpanded: boolean;
  backTarget: string;
}) => {
  const { countryCode, name: countryName, areas, cragCount } = group;

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      slotProps={{ transition: { timeout: 120 } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={1} minWidth={0}>
            <span style={{ fontSize: '1.3em' }}>
              {getCountryFlag(countryCode) || '🏳️'}
            </span>
            <Typography noWrap fontWeight={600}>
              {countryName}
            </Typography>
          </Box>
          <Box textAlign="right" flexShrink={0}>
            <Typography variant="body2" fontWeight={600}>
              {t('climbingareas.areas_count', { count: areas.length })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('climbingareas.crags_count', { count: cragCount })}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Table size="small">
          <TableBody>
            {areas.map((area, index) => (
              <TableRow key={`${area.osmType}-${area.osmId}`}>
                <TableCell width={1}>{index + 1}.</TableCell>
                <TableCell>
                  <Link
                    href={`/${area.osmType}/${area.osmId}?back=${backTarget}`}
                    locale={intl.lang}
                  >
                    {area.name || `N/A – ${area.osmType}/${area.osmId}`}
                  </Link>
                </TableCell>
                <TableCell align="right">
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-end"
                    gap={0.75}
                  >
                    {area.routeCount > 0 && (
                      <PhotoCoverageRing
                        total={area.routeCount}
                        withPhoto={area.routesWithPhoto}
                      />
                    )}
                    <span>{area.cragCount}</span>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
};

export const ClimbingAreasPanel = ({ areas }: ClimbingAreasPanelProps) => {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortBy>('photos');
  const handleClose = () => {
    Router.push(`/`);
  };

  const groups = useMemo(() => groupByCountry(areas, sortBy), [areas, sortBy]);
  const backTarget = encodeURIComponent(router.asPath);

  return (
    <MobilePageDrawer className="climbing-areas-drawer">
      <PanelContent>
        <PanelScrollbars>
          <ClimbingGuideInfo />
          <PanelSidePadding>
            <ClosePanelButton right onClick={handleClose} />
            <h1>{t('climbingareas.title')}</h1>
            <TextField
              select
              size="small"
              fullWidth
              label={t('climbingareas.sort_label')}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              sx={{ mb: 2 }}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.labelId)}
                </MenuItem>
              ))}
            </TextField>
          </PanelSidePadding>

          {groups.map((group, index) => (
            <CountryAccordion
              key={group.countryCode ?? 'unknown'}
              group={group}
              defaultExpanded={index === 0}
              backTarget={backTarget}
            />
          ))}
        </PanelScrollbars>
      </PanelContent>
    </MobilePageDrawer>
  );
};
