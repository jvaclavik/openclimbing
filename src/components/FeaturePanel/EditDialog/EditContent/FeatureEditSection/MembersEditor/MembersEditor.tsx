import React, { useEffect } from 'react';
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
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { FeatureRow } from '../../FeatureRow';
import { t } from '../../../../../../services/intl';
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
  useEditContext,
  useExpandedSections,
} from '../../../context/EditContext';
import { OpenAllButton } from '../helpers';
import { Member } from '../../../context/types';
import { useDragItems } from '../../../../../utils/useDragItems';
import { DragHandler } from '../../../../../utils/DragHandler';
import { moveElementToIndex } from '../../../../Climbing/utils/array';
import { useMobileMode } from '../../../../../helpers';
import { EditTabDropZone } from '../EditTabDropZone';
import { useLinkEditItem } from '../useLinkEditItem';

const MemberRow = styled.div`
  display: flex;
  align-items: stretch;
  width: 100%;
`;

const MemberRowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const NO_MEMBERS: Member[] = [];

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
          {t('editdialog.climbing_crags')}
        </Typography>
      </Stack>
    );
  }

  if (tags.climbing === 'crag') {
    return (
      <Stack direction="row" gap={1}>
        <ShowChartIcon />
        <Typography variant="button">
          {t('editdialog.climbing_routes')}
        </Typography>
      </Stack>
    );
  }
  return <Typography variant="button">{t('editdialog.members')}</Typography>;
};

const MembersInfoTooltip = () => {
  const isMobile = useMobileMode();
  const { tags } = useCurrentItem();
  if (isMobile || !tags.climbing) return null;

  return (
    <Tooltip title={t('editdialog.members_climbing_info')} arrow>
      <Box
        component="span"
        onClick={(e) => e.stopPropagation()}
        sx={{ display: 'inline-flex', cursor: 'help', color: 'text.secondary' }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </Box>
    </Tooltip>
  );
};

const CustomAccordion = ({
  children,
  membersLength,
}: {
  children: React.ReactNode;
  membersLength: number | undefined;
}) => {
  const { tags } = useCurrentItem();
  const { current } = useEditContext();
  const { expanded, toggleExpanded, expand } = useExpandedSections('members');

  useEffect(() => {
    if (tags.climbing === 'crag') return;
    expand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

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
          bgcolor: 'transparent',
          '&.MuiAccordion-root:before': {
            opacity: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          onClick={toggleExpanded}
          sx={{
            '& .MuiAccordionSummary-expandIconWrapper': { ml: 1 },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" width="100%">
            <SectionName />
            {membersLength ? (
              <Chip size="small" label={membersLength} variant="outlined" />
            ) : null}
            <Box sx={{ flex: 1 }} />
            <MembersInfoTooltip />
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
  onRemove: () => void;
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
  onRemove,
  dragHandlers,
}: DraggableMemberItemProps) => {
  const handleClick = useHandleItemClick();
  const row = (
    <FeatureRow
      shortId={member.shortId}
      originalLabel={member.originalLabel}
      previewTags={member.originalTags}
      role={member.role}
      onClick={(e: React.MouseEvent) => handleClick(e, member.shortId)}
      onRemove={onRemove}
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
  const { addAsMember } = useLinkEditItem();
  const { expand } = useExpandedSections('members');

  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    HighlightedDropzone,
    ItemContainer,
    draggedItem,
  } = useDragItems<Member>({
    initialItems: members ?? NO_MEMBERS,
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
    <EditTabDropZone
      onDropShortId={async (droppedShortId) => {
        const added = await addAsMember(droppedShortId);
        if (added) expand();
      }}
    >
      <CustomAccordion membersLength={members?.length}>
        {!!members && (
          <List disablePadding>
            {members.map((member, index) => (
              <ItemContainer key={member.shortId}>
                {canReorder &&
                  draggedItem != null &&
                  draggedItem.id > index && (
                    <HighlightedDropzone index={index} />
                  )}
                <DraggableMemberItem
                  member={member}
                  index={index}
                  canReorder={canReorder}
                  onRemove={() =>
                    setMembers((prev) =>
                      (prev ?? []).filter((m) => m.shortId !== member.shortId),
                    )
                  }
                  dragHandlers={{
                    handleDragStart,
                    handleDragOver,
                    handleDragEnd,
                  }}
                />
                {canReorder &&
                  draggedItem != null &&
                  draggedItem.id <= index && (
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
      </CustomAccordion>
    </EditTabDropZone>
  );
};
