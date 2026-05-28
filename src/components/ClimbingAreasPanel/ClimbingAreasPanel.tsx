import React, { useMemo, useState } from 'react';
import Router from 'next/router';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import { intl, t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { ClimbingArea } from '../../services/climbing-areas/getClimbingAreas';
import Link from 'next/link';
import { ClimbingGuideInfo } from '../FeaturePanel/Climbing/ClimbingGuideInfo';

type ClimbingAreasPanelProps = {
  areas: ClimbingArea[];
};

type SortBy = 'name' | 'country' | 'crags';
type SortDir = 'asc' | 'desc';

const countryCodeToFlag = (code: string): string =>
  code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');

const getCountryName = (countryCode: string): string => {
  try {
    return (
      new Intl.DisplayNames(['en'], { type: 'region' }).of(
        countryCode.toUpperCase(),
      ) ?? countryCode.toUpperCase()
    );
  } catch {
    return countryCode.toUpperCase();
  }
};

export const ClimbingAreasPanel = ({ areas }: ClimbingAreasPanelProps) => {
  const handleClose = () => {
    Router.push(`/`);
  };

  const [filterCountry, setFilterCountry] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const countries = useMemo(() => {
    const codes = [
      ...new Set(areas.map((a) => a.countryCode).filter(Boolean)),
    ] as string[];
    return codes
      .map((code) => ({
        code,
        name: getCountryName(code),
        flag: countryCodeToFlag(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [areas]);

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const processedAreas = useMemo(() => {
    let result = [...areas];

    if (filterCountry) {
      result = result.filter((a) => a.countryCode === filterCountry);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = (a.tags.name || '').localeCompare(b.tags.name || '');
      } else if (sortBy === 'country') {
        cmp = (a.countryCode || '').localeCompare(b.countryCode || '');
      } else if (sortBy === 'crags') {
        cmp = (a.members?.length || 0) - (b.members?.length || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [areas, filterCountry, sortBy, sortDir]);

  return (
    <MobilePageDrawer className="climbing-areas-drawer">
      <PanelContent>
        <PanelScrollbars>
          <ClimbingGuideInfo />
          <PanelSidePadding>
            <ClosePanelButton right onClick={handleClose} />
            <h1>{t('climbingareas.title')}</h1>
            <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
              <InputLabel>{t('climbingareas.filter_country')}</InputLabel>
              <Select
                value={filterCountry}
                label={t('climbingareas.filter_country')}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <MenuItem value="">{t('climbingareas.all_countries')}</MenuItem>
                {countries.map(({ code, name, flag }) => (
                  <MenuItem key={code} value={code}>
                    {flag} {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </PanelSidePadding>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'name'}
                      direction={sortBy === 'name' ? sortDir : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      {t('climbingareas.area')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'country'}
                      direction={sortBy === 'country' ? sortDir : 'asc'}
                      onClick={() => handleSort('country')}
                    >
                      {t('climbingareas.country')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortBy === 'crags'}
                      direction={sortBy === 'crags' ? sortDir : 'asc'}
                      onClick={() => handleSort('crags')}
                    >
                      {t('climbingareas.num_of_crags')}
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedAreas.map((climbingArea, index) => (
                  <TableRow key={`climbing-area-${climbingArea.id}`}>
                    <TableCell>{index + 1}.</TableCell>
                    <TableCell>
                      <Link
                        href={`/relation/${climbingArea.id}`}
                        locale={intl.lang}
                      >
                        {climbingArea.tags.name ||
                          `N/A – relation/${climbingArea.id}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {climbingArea.countryCode && (
                        <span title={getCountryName(climbingArea.countryCode)}>
                          {countryCodeToFlag(climbingArea.countryCode)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {climbingArea.members?.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </PanelScrollbars>
      </PanelContent>
    </MobilePageDrawer>
  );
};
