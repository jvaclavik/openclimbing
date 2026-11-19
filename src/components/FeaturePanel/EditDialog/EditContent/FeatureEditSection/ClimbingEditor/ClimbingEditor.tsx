import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import { t } from '../../../../../../services/intl';
import { isClimbingRoute } from '../../../../../../utils';
import { Maki } from '../../../../../utils/icons/Maki';
import {
  useCurrentItem,
  useExpandedSections,
} from '../../../context/EditContext';
import { useMultiEdit } from '../../../context/useMultiEdit';
import { EditSectionCard } from '../../EditSectionCard';
import { ClimbingRockSelect } from '../ClimbingRockSelect';
import { ClimbingStartSelect } from '../ClimbingStartSelect';
import { ClimbingGradesEditor } from './ClimbingGradesEditor';
import { DrawClimbingRoutesBanner } from './DrawClimbingRoutesBanner';
import { MultiValueKeyEditor } from './MultiValueKeyEditor';

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const ClimbingMultiValuesInner = () => {
  const { tags } = useCurrentItem();
  const { isMulti, targets } = useMultiEdit();
  const isRoute =
    isClimbingRoute(tags) ||
    (isMulti && targets.some((item) => isClimbingRoute(item.tags)));

  return (
    <Stack
      sx={{
        gap: 1,
        ml: 2,
        mt: 2,
      }}
    >
      <MultiValueKeyEditor
        label={t('climbing_badges.type_label')}
        keys={[
          'climbing:boulder',
          'climbing:sport',
          'climbing:trad',
          'climbing:multipitch',
          'climbing:toprope',
          'climbing:speed',
          'climbing:ice',
          'climbing:mixed',
          'climbing:deepwater',
          'climbing:aid',
          'climbing:dry',
        ]}
      />
      <MultiValueKeyEditor
        label={t('climbing_badges.inclination_label')}
        keys={[
          'climbing:inclination:vertical',
          'climbing:inclination:slab',
          'climbing:inclination:overhang',
          'climbing:inclination:traverse',
          'climbing:inclination:roof',
        ]}
      />
      <MultiValueKeyEditor
        label={t('climbing_badges.hazard_label')}
        keys={[
          'climbing:hazard:loose_rock',
          'climbing:hazard:rockfall_zone',
          'climbing:hazard:wet',
          'climbing:hazard:vegetation',
          'climbing:hazard:unstable_anchor',
          'climbing:hazard:missing_anchor',
          'climbing:hazard:animal_nest',
          'climbing:hazard:death_fall_zone',
          'climbing:hazard:first_bolt_high',
          'climbing:hazard:long_runout',
          'climbing:hazard:bad_protection',
          'climbing:hazard:dirty_rock',
          'climbing:hazard:slippery_rock',
        ]}
        editableValues={[
          'climbing:hazard:first_bolt_high',
          'climbing:hazard:long_runout',
        ]}
      />
      <MultiValueKeyEditor
        label={t('climbing_badges.other_tags_label')}
        keys={[
          'climbing:family_friendly',
          ...(isRoute ? ['climbing:bolts'] : []),
        ]}
        numberKeys={['climbing:bolts']}
      />
    </Stack>
  );
};

export const ClimbingEditor = () => {
  const { tags } = useCurrentItem();
  const { isMulti, targets } = useMultiEdit();
  const { expanded, toggleExpanded } = useExpandedSections('climbing');
  const showClimbing =
    !!tags.climbing || (isMulti && targets.some((item) => item.tags.climbing));

  if (!showClimbing) {
    return null;
  }

  return (
    <EditSectionCard>
      <Accordion // TODO replace Accordion with custom collapse component, it is not accordion anymore :)
        disableGutters
        elevation={0}
        square
        expanded={expanded}
        onChange={toggleExpanded}
        slotProps={{ transition: { timeout: 0 } }}
        sx={{
          bgcolor: 'transparent',
          '&.MuiAccordion-root:before': {
            opacity: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <IconContainer>
              <Maki ico="climbing" size={18} themed withMarginRight={false} />
            </IconContainer>
            <Typography variant="button">
              {t('editdialog.climbing_editor')}
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              ml: 2,
            }}
          >
            <ClimbingGradesEditor />
            <ClimbingRockSelect />
            <ClimbingStartSelect />
            <ClimbingMultiValuesInner />
          </Box>
        </AccordionDetails>
        <DrawClimbingRoutesBanner />
      </Accordion>
    </EditSectionCard>
  );
};
