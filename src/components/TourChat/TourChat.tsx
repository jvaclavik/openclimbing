import { FormEvent, Ref, useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ChatTour } from '../../server/chat/catalog';
import { useMobileMode } from '../helpers';
import { FeatureContext } from '../utils/FeatureContext';
import { useMapChrome } from '../utils/mapChromeRegistry';
import {
  DATA_NOTICE,
  INTRO,
  LIMITATION,
  STARTERS,
  TOUR_HELP_LABEL,
  TOUR_HELP_Z,
  messageForSend,
  selectedTourLabel,
  tourHelpAnchor,
  visibleChatWarnings,
  type TourHelpSnap,
} from './tourHelp';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  display?: string;
  sources?: ChatTour[];
};

const useTourHelpAnchor = () => {
  const narrow = useMobileMode();
  const { drawerSnap } = useMapChrome();
  return tourHelpAnchor((drawerSnap ?? null) as TourHelpSnap, narrow);
};

const ChatMessage = ({ message }: { message: Message }) => {
  const mine = message.role === 'user';
  return (
    <Box
      sx={{
        alignSelf: mine ? 'flex-end' : 'stretch',
        maxWidth: mine ? '92%' : '100%',
        px: mine ? 1.25 : 0,
        py: mine ? 0.75 : 0,
        borderRadius: mine ? 2 : 0,
        bgcolor: mine ? 'action.selected' : 'transparent',
      }}
    >
      <Typography
        variant="body2"
        sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      >
        {message.display ?? message.content}
      </Typography>
      {!!message.sources?.length && (
        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
          {message.sources.map((tour) => (
            <Box key={tour.href}>
              <Link href={tour.href} target="_blank" rel="noopener noreferrer">
                {tour.name}
              </Link>
              <Typography variant="caption" sx={{ display: 'block' }}>
                {[
                  tour.difficulty ? `Grad ${tour.difficulty}` : null,
                  tour.location,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

const TourHelpHint = ({
  buttonRef,
  onOpen,
}: {
  buttonRef: Ref<HTMLButtonElement>;
  onOpen: () => void;
}) => (
  <Button
    ref={buttonRef}
    type="button"
    size="small"
    aria-expanded={false}
    aria-controls="tour-help-panel"
    onClick={onOpen}
    startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
    sx={{
      pointerEvents: 'auto',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 13,
      lineHeight: 1.2,
      color: 'text.primary',
      bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92),
      border: 1,
      borderColor: 'divider',
      borderRadius: 999,
      px: 1.25,
      py: 0.25,
      minHeight: 32,
      boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
      backdropFilter: 'blur(10px)',
      '&:hover': { bgcolor: 'background.paper' },
    }}
  >
    {TOUR_HELP_LABEL}
  </Button>
);

const Suggestions = ({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (question: string) => void;
}) => (
  <Stack
    component="nav"
    aria-label="Vorschläge"
    direction="row"
    useFlexGap
    sx={{ flexWrap: 'wrap', gap: 0.75 }}
  >
    {STARTERS.map((starter) => (
      <Button
        key={starter}
        type="button"
        size="small"
        disabled={disabled}
        onClick={() => onPick(starter)}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 999,
          px: 1.25,
          border: 1,
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        {starter}
      </Button>
    ))}
  </Stack>
);

const useTourConversation = () => {
  const feature = useContext(FeatureContext)?.feature;
  const place = selectedTourLabel(feature);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    if (!open) return;
    end.current?.scrollIntoView?.({ block: 'nearest' });
  }, [open, messages, pending, error]);

  const send = async (preset?: string) => {
    const question = (preset ?? input).trim();
    if (!question || sending.current) return;
    const content = messageForSend(question, feature);
    sending.current = true;
    if (preset) setInput(question);
    setPending(question);
    setError('');
    try {
      const response = await fetch('/api/kletterglueck/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-10).map(({ role, content: text }) => ({
              role,
              content: text,
            })),
            { role: 'user', content },
          ],
        }),
        signal: AbortSignal.timeout(55000),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Der Chat ist gerade nicht erreichbar.');
      }
      setMessages((previous) => [
        ...previous,
        {
          role: 'user',
          content,
          display: question === content ? undefined : question,
        },
        { role: 'assistant', content: data.text, sources: data.sources },
      ]);
      setWarnings(visibleChatWarnings(data.warnings ?? []));
      setInput('');
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Bitte später erneut versuchen.',
      );
    } finally {
      sending.current = false;
      setPending('');
    }
  };

  const reset = () => {
    setMessages([]);
    setError('');
    setWarnings([]);
    setInput('');
  };

  return {
    open,
    setOpen,
    place,
    messages,
    input,
    setInput,
    pending,
    error,
    warnings,
    end,
    send,
    reset,
  };
};

const Notice = () => {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button
        type="button"
        size="small"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        sx={{
          textTransform: 'none',
          px: 0,
          minWidth: 0,
          color: 'text.secondary',
        }}
      >
        Datenhinweis
      </Button>
      {open && (
        <Typography variant="caption" sx={{ display: 'block' }}>
          {LIMITATION} {DATA_NOTICE}
        </Typography>
      )}
    </Box>
  );
};

type ConversationState = ReturnType<typeof useTourConversation>;

const TourHelpPanel = ({
  panelRef,
  chat,
  maxHeight,
  onMinimize,
}: {
  panelRef: Ref<HTMLDivElement>;
  chat: ConversationState;
  maxHeight: string;
  onMinimize: () => void;
}) => {
  const showSuggestions = chat.messages.length === 0 && !chat.pending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void chat.send();
  };

  return (
    <Box
      ref={panelRef}
      id="tour-help-panel"
      role="region"
      aria-label={TOUR_HELP_LABEL}
      tabIndex={-1}
      style={{ pointerEvents: 'auto', maxHeight, width: '100%' }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflowY: 'auto',
        bgcolor: 'background.paper',
        color: 'text.primary',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 3,
        userSelect: 'text',
        WebkitUserSelect: 'text',
        '&:focus': { outline: 'none' },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 1,
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" component="h2">
          {TOUR_HELP_LABEL}
        </Typography>
        <IconButton size="small" aria-label="Minimieren" onClick={onMinimize}>
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Stack
        spacing={1.25}
        sx={{
          overflowY: 'auto',
          minHeight: 100,
          flex: '1 1 auto',
          px: 1.5,
          py: 1,
        }}
      >
        {showSuggestions && (
          <>
            <Typography variant="body2" color="text.secondary">
              {chat.place ? `Offen: ${chat.place}. ${INTRO}` : INTRO}
            </Typography>
            <Suggestions
              disabled={!!chat.pending}
              onPick={(question) => void chat.send(question)}
            />
          </>
        )}
        {chat.messages.map((message, index) => (
          <ChatMessage key={`${message.role}-${index}`} message={message} />
        ))}
        {chat.pending && (
          <Box role="status" sx={{ alignSelf: 'flex-start' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {chat.pending}
            </Typography>
            <CircularProgress size={14} sx={{ mr: 1, mt: 0.75 }} />
            <Typography variant="caption" component="span">
              Suche im Katalog …
            </Typography>
          </Box>
        )}
        {chat.warnings.map((warning) => (
          <Alert severity="warning" key={warning}>
            {warning}
          </Alert>
        ))}
        {chat.error && <Alert severity="error">{chat.error}</Alert>}
        <div ref={chat.end} />
      </Stack>
      <Box
        component="form"
        onSubmit={submit}
        sx={{ px: 1.5, pb: 1.25, flexShrink: 0 }}
      >
        <Notice />
        <TextField
          placeholder="Ort, Grad oder Name"
          value={chat.input}
          onChange={(event) => chat.setInput(event.target.value)}
          fullWidth
          size="small"
          disabled={!!chat.pending}
          autoComplete="off"
          slotProps={{
            htmlInput: {
              maxLength: 2000,
              'aria-label': 'Deine Frage zu Klettersteigen',
            },
          }}
        />
        <Stack
          direction="row"
          sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', mt: 1 }}
        >
          {chat.messages.length > 0 && (
            <Button
              type="button"
              size="small"
              disabled={!!chat.pending}
              onClick={chat.reset}
            >
              Neuer Chat
            </Button>
          )}
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={!chat.input.trim() || !!chat.pending}
          >
            Senden
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export const TourChat = () => {
  const chat = useTourConversation();
  const anchor = useTourHelpAnchor();
  const panelRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLButtonElement>(null);
  const interacted = useRef(false);

  useEffect(() => {
    if (!interacted.current) return;
    if (chat.open) panelRef.current?.focus();
    else hintRef.current?.focus();
  }, [chat.open]);

  if (process.env.kletterglueckChatEnabled !== 'true') return null;

  const openPanel = () => {
    interacted.current = true;
    chat.setOpen(true);
  };
  const minimize = () => {
    interacted.current = true;
    chat.setOpen(false);
  };

  return (
    <Box
      data-testid="tour-help"
      style={{
        position: 'absolute',
        right: 8,
        bottom: anchor.bottom,
        width: anchor.width,
        zIndex: TOUR_HELP_Z,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      {chat.open ? (
        <TourHelpPanel
          panelRef={panelRef}
          chat={chat}
          maxHeight={anchor.maxHeight}
          onMinimize={minimize}
        />
      ) : (
        <TourHelpHint buttonRef={hintRef} onOpen={openPanel} />
      )}
    </Box>
  );
};
