import React from 'react';
import styled from '@emotion/styled';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { Checkbox, Chip, CircularProgress, Typography } from '@mui/material';
import { PoiCategoriesStatus } from '../../Map/PoiCategories/poiCategoriesStore';
import {
  getPoiCategory,
  getPoiCategoryMinZoom,
  poiCategoryGroups,
  quickPoiCategories,
} from '../../Map/PoiCategories/poiCategories';
import { t } from '../../../services/intl';
import { TranslationId } from '../../../services/types';
import { Maki } from '../../utils/icons/Maki';
import { IconPart } from '../utils';
import {
  Option,
  PoiCategoryOption,
  PoiClearOption,
  PoiGroupOption,
  PoiStatusOption,
} from '../types';

export const getPoiGroupName = (groupKey: string) =>
  t(`poi_categories.group.${groupKey}` as TranslationId);

export const getPoiCategoryName = (categoryKey: string) =>
  t(`poi_categories.category.${categoryKey}` as TranslationId);

type BuildOptionsParams = {
  activeKeys: string[];
  expandedGroups: string[];
  zoom: number | undefined;
  status: PoiCategoriesStatus;
};

const categoryOption = (
  categoryKey: string,
  { activeKeys, zoom }: BuildOptionsParams,
  indented: boolean,
): PoiCategoryOption => {
  const active = activeKeys.includes(categoryKey);
  const minZoom = getPoiCategoryMinZoom(getPoiCategory(categoryKey));
  return {
    type: 'poiCategory',
    poiCategory: {
      categoryKey,
      active,
      indented,
      needsZoom: active && zoom != null && zoom < minZoom,
    },
  };
};

/**
 * Content of the search dropdown when the input is empty – a two level browser
 * of POI categories to be shown on the map.
 */
export const buildPoiCategoryOptions = (
  params: BuildOptionsParams,
): Option[] => {
  const { activeKeys, expandedGroups, status } = params;
  const options: Option[] = [];

  const activeCategories = activeKeys.filter(getPoiCategory);
  if (activeCategories.length) {
    options.push({
      type: 'separator',
      separator: { section: 'poiActive', label: t('poi_categories.active') },
    });
    activeCategories.forEach((key) =>
      options.push(categoryOption(key, params, false)),
    );
    const { loading, zoomTooLow, count, error } = status;
    options.push({
      type: 'poiStatus',
      poiStatus: { loading, zoomTooLow, count, error },
    });
    options.push({
      type: 'poiClear',
      poiClear: { activeCount: activeCategories.length },
    });
  }

  const quick = quickPoiCategories.filter(
    ({ key }) => !activeCategories.includes(key),
  );
  if (quick.length) {
    options.push({
      type: 'separator',
      separator: { section: 'poiQuick', label: t('poi_categories.most_used') },
    });
    quick.forEach(({ key }) =>
      options.push(categoryOption(key, params, false)),
    );
  }

  options.push({
    type: 'separator',
    separator: { section: 'poiGroups', label: t('poi_categories.all') },
  });
  poiCategoryGroups.forEach((group) => {
    const expanded = expandedGroups.includes(group.key);
    options.push({
      type: 'poiGroup',
      poiGroup: {
        groupKey: group.key,
        expanded,
        activeCount: group.categories.filter(({ key }) =>
          activeKeys.includes(key),
        ).length,
      },
    });
    if (expanded) {
      group.categories.forEach(({ key }) =>
        options.push(categoryOption(key, params, true)),
      );
    }
  });

  return options;
};

const Row = styled.div<{ $indented?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding-left: ${({ $indented }) => ($indented ? '24px' : '0')};
`;

const NarrowIconPart = styled(IconPart)`
  width: 26px;
  padding-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledCheckbox = styled(Checkbox)`
  padding: 3px;
  margin-right: 2px;
`;

const Texts = styled.div`
  flex: 1;
  min-width: 0;
`;

const Label = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PoiGroupRow = ({ option }: { option: PoiGroupOption }) => {
  const { groupKey, expanded, activeCount } = option.poiGroup;
  const group = poiCategoryGroups.find(({ key }) => key === groupKey);

  return (
    <Row>
      <NarrowIconPart>
        <Maki ico={group.icon} size={16} themed withMarginRight={false} />
      </NarrowIconPart>
      <Texts>
        <Label>{getPoiGroupName(groupKey)}</Label>
      </Texts>
      {activeCount > 0 && (
        <Chip
          size="small"
          label={activeCount}
          sx={{ mr: 1, bgcolor: group.color, color: '#fff' }}
        />
      )}
      {expanded ? (
        <ExpandLessIcon fontSize="small" color="action" />
      ) : (
        <ExpandMoreIcon fontSize="small" color="action" />
      )}
    </Row>
  );
};

export const PoiCategoryRow = ({ option }: { option: PoiCategoryOption }) => {
  const { categoryKey, active, indented, needsZoom } = option.poiCategory;
  const category = getPoiCategory(categoryKey);

  return (
    <Row $indented={indented}>
      <StyledCheckbox
        size="small"
        checked={active}
        tabIndex={-1}
        disableRipple
      />
      <NarrowIconPart>
        <Maki ico={category.icon} size={16} themed withMarginRight={false} />
      </NarrowIconPart>
      <Texts>
        <Label>{getPoiCategoryName(categoryKey)}</Label>
        {needsZoom && (
          <Typography variant="body2" color="warning.main">
            {t('poi_categories.needs_zoom', {
              zoom: getPoiCategoryMinZoom(category),
            })}
          </Typography>
        )}
      </Texts>
    </Row>
  );
};

export const PoiStatusRow = ({ option }: { option: PoiStatusOption }) => {
  const { loading, zoomTooLow, count, error } = option.poiStatus;

  const getText = () => {
    if (error) return t('poi_categories.load_error');
    if (zoomTooLow) return t('poi_categories.zoom_in');
    if (loading) return t('loading');
    return t('poi_categories.shown_count', { count });
  };

  return (
    <Row>
      <NarrowIconPart>
        {loading && <CircularProgress size={13} />}
      </NarrowIconPart>
      <Texts>
        <Typography
          variant="body2"
          color={error ? 'error' : 'textSecondary'}
          noWrap
        >
          {getText()}
        </Typography>
      </Texts>
    </Row>
  );
};

export const PoiClearRow = ({ option }: { option: PoiClearOption }) => (
  <Row>
    <NarrowIconPart>
      <DeleteSweepIcon fontSize="small" color="action" />
    </NarrowIconPart>
    <Texts>
      <Typography variant="body2" color="textSecondary">
        {t('poi_categories.clear_all', { count: option.poiClear.activeCount })}
      </Typography>
    </Texts>
  </Row>
);
