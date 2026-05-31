import React from 'react';
import styled from '@emotion/styled';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  List,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FeatureRow } from '../../FeatureRow';
import { t, Translation } from '../../../../../../services/intl';
import { AddMemberForm } from '../AddMemberForm';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { CragIcon } from '../../../../Climbing/CragIcon';
import {
  useHandleItemClick,
  useHandleOpenAllMembers,
} from '../../useHandleItemClick';
import { ConvertNodeToRelation, isConvertible } from '../ConvertNodeToRelation';
import {
  useCurrentItem,
  useExpandedSections,
} from '../../../context/EditContext';
import { OpenAllButton } from '../helpers';
import { Member } from '../../../context/types';
import { useDragItems } from '../../../../../utils/useDragItems';
import { DragHandler } from '../../../../../utils/DragHandler';
import { moveElementToIndex } from '../../../../Climbing/utils/array';

const MemberRow = styled.div`
  display: flex;
  align-items: stretch;
  width: 100%;
`;

const MemberRowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const SectionName = () => {
  const theme = useTheme();
  const { tags } = useCurrentItem();

  if (tags.climbing === 'area') {
    return (
      <Stack direction="row" gap={1}>
        <CragIcon
          fill={theme.palette.text.primary}
          stroke={theme.palette.text.primary}
          height={24}
          width={24}
        />
        <Typography variant="button">
          {t('editdialog.climbing_crags')}{' '}
          <Typography variant="caption" color="secondary">
            ({t('editdialog.members')})
          </Typography>
        </Typography>
      </Stack>
    );
  }

  if (tags.climbing === 'crag') {
    return (
      <Stack direction="row" gap={1}>
        <ShowChartIcon />
        <Typography variant="button">
          {t('editdialog.climbing_routes')}{' '}
          <Typography variant="caption" color="secondary">
            ({t('editdialog.members')})
          </Typography>
        </Typography>
      </Stack>
    );
  }
  return <Typography variant="button">{t('editdialog.members')}</Typography>;
};

const CustomAccordion = ({
  children,
  membersLength,
}: {
  children: React.ReactNode;
  membersLength: number | undefined;
}) => {
  const { expanded, toggleExpanded } = useExpandedSections('members');
  return (
    <>
      <Divider />
      <Accordion // TODO replace Accordion with custom collapse component, it is not accordion anymore :)
        disableGutters
        elevation={0}
        square
        expanded={expanded}
        slotProps={{ transition: { timeout: 0 } }}
        sx={{
          '&.MuiAccordion-root:before': {
            opacity: 1,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          onClick={toggleExpanded}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <SectionName />
            {membersLength ? (
              <Chip size="small" label={membersLength} variant="outlined" />
            ) : null}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
      </Accordion>
    </>
  );
};

type DraggableMemberItemProps = {
  member: Member;
  index: number;
  canReorder: boolean;
  dragHandlers: {
    handleDragStart: (
      e: React.DragEvent<HTMLDivElement>,
      dragged: { id: number; content: Member },
    ) => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
    handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  };
};

const DraggableMemberItem = ({
  member,
  index,
  canReorder,
  dragHandlers,
}: DraggableMemberItemProps) => {
  const handleClick = useHandleItemClick();
  const row = (
    <FeatureRow
      shortId={member.shortId}
      originalLabel={member.originalLabel}
      role={member.role}
      onClick={(e: React.MouseEvent) => handleClick(e, member.shortId)}
    />
  );

  if (!canReorder) {
    return row;
  }

  return (
    <MemberRow onDragOver={(e) => dragHandlers.handleDragOver(e, index)}>
      <DragHandler
        onDragStart={(e) =>
          dragHandlers.handleDragStart(e, { id: index, content: member })
        }
        onDragOver={(e) => dragHandlers.handleDragOver(e, index)}
        onDragEnd={dragHandlers.handleDragEnd}
      />
      <MemberRowMain>{row}</MemberRowMain>
    </MemberRow>
  );
};

export const MembersEditor = () => {
  const { shortId, members, tags, setMembers } = useCurrentItem();
  const convertible = isConvertible(shortId, tags);
  const handleOpenAll = useHandleOpenAllMembers();

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    HighlightedDropzone,
    ItemContainer,
    draggedItem,
  } = useDragItems<Member>({
    initialItems: members ?? [],
    moveItems: (oldIndex, newIndex) => {
      setMembers((prev) => moveElementToIndex(prev ?? [], oldIndex, newIndex));
    },
    direction: 'horizontal',
  });

  if (!members && !convertible) {
    return null;
  }

  const canReorder = (members?.length ?? 0) > 1;

  return (
    <CustomAccordion membersLength={members?.length}>
      {!!members && (
        <List disablePadding>
          {members.map((member, index) => (
            <ItemContainer key={member.shortId}>
              {canReorder && draggedItem != null && draggedItem.id > index && (
                <HighlightedDropzone index={index} />
              )}
              <DraggableMemberItem
                member={member}
                index={index}
                canReorder={canReorder}
                dragHandlers={{
                  handleDragStart,
                  handleDragOver,
                  handleDragEnd,
                }}
              />
              {canReorder && draggedItem != null && draggedItem.id <= index && (
                <HighlightedDropzone index={index} activeAt={index + 1} />
              )}
            </ItemContainer>
          ))}
        </List>
      )}

      <Stack direction="row" alignItems="center" spacing={2} mt={1} ml={1}>
        {convertible ? <ConvertNodeToRelation /> : <AddMemberForm />}

        <Box sx={{ flex: '1' }} />

        {handleOpenAll && <OpenAllButton onClick={handleOpenAll} />}
      </Stack>
      {!!members?.length && tags.climbing && (
        <Typography variant="body2" color="textSecondary" ml={1}>
          <Translation id="editdialog.members_climbing_info" />
          {/* If we convert a natural=peak to crag relation, the peak stays as a member - this notice must be visible especially for this scenario. */}
        </Typography>
      )}
    </CustomAccordion>
  );
};
