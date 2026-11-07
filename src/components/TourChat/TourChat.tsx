import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import type { ChatTour } from '../../server/chat/catalog';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatTour[];
};

const ChatMessage = ({ message }: { message: Message }) => (
  <Box
    sx={{
      p: 1.5,
      borderRadius: 2,
      bgcolor:
        message.role === 'user' ? 'action.selected' : 'background.default',
    }}
  >
    <Typography variant="subtitle2">
      {message.role === 'user' ? 'Du' : 'Tourenchat'}
    </Typography>
    <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {message.content}
    </Typography>
    {!!message.sources?.length && (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption">
          Durchsuchte Touren · Karten-Details und Quellen prüfen:
        </Typography>
        {message.sources.map((tour) => (
          <Box key={tour.href} sx={{ mt: 0.5 }}>
            <Link href={tour.href} target="_blank" rel="noopener noreferrer">
              {tour.name}
            </Link>
            <Typography variant="caption" sx={{ display: 'block' }}>
              {[
                tour.difficulty || 'Schwierigkeit unbekannt',
                tour.location,
                tour.source,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

export const TourChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'nearest' });
  }, [messages, pending, error]);

  const send = async () => {
    const question = input.trim();
    if (!question || pending) return;
    setPending(question);
    setError('');
    try {
      const response = await fetch('/api/kletterglueck/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages
              .slice(-10)
              .map(({ role, content }) => ({ role, content })),
            { role: 'user', content: question },
          ],
        }),
        signal: AbortSignal.timeout(55000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Der Chat ist gerade nicht erreichbar.');
      setMessages((previous) => [
        ...previous,
        { role: 'user', content: question },
        { role: 'assistant', content: data.text, sources: data.sources },
      ]);
      setWarnings(data.warnings);
      setInput('');
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Bitte später erneut versuchen.',
      );
    } finally {
      setPending('');
    }
  };

  if (process.env.kletterglueckChatEnabled !== 'true') return null;
  return (
    <>
      <Button
        variant="contained"
        startIcon={<ChatBubbleOutlineIcon />}
        onClick={() => setOpen(true)}
        sx={{
          position: 'absolute',
          right: 12,
          bottom: 112,
          zIndex: 10,
          borderRadius: 6,
        }}
      >
        Tourenchat
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="tour-chat-title"
      >
        <DialogTitle id="tour-chat-title">
          Kletterglück · Tourenchat
        </DialogTitle>
        <DialogContent dividers sx={{ height: 'min(55vh, 460px)' }}>
          <Stack spacing={2}>
            <Typography variant="body2">
              Welche Klettersteige suchst du? Nenne mir eine Region, deine
              Erfahrung und die gewünschte Schwierigkeit.
            </Typography>
            <Alert severity="info">
              KI-Vorschau mit OpenAI über Vercel AI Gateway. Deine Nachrichten
              und passende Touren-Metadaten werden zur Beantwortung übertragen.
              Bitte keine persönlichen Daten eingeben. Familiennotizen und
              Bewertungen werden nicht übertragen.
            </Alert>
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {pending && (
              <Box role="status">
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                  {pending}
                </Typography>
                <CircularProgress size={18} sx={{ mr: 1, mt: 1 }} /> Tourenchat
                überlegt …
              </Box>
            )}
            {warnings.map((warning) => (
              <Alert severity="warning" key={warning}>
                {warning}
              </Alert>
            ))}
            {error && <Alert severity="error">{error}</Alert>}
            <div ref={end} />
          </Stack>
        </DialogContent>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          sx={{ p: 2 }}
        >
          <TextField
            label="Deine Frage zu Klettersteigen"
            placeholder="Zum Beispiel: Welche Klettersteige gibt es bei Nürnberg?"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            fullWidth
            size="small"
            disabled={!!pending}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Keine Live-Daten zu Wetter oder Sperrungen. KI kann Fehler machen;
            vor Ort und mit verlässlichen Quellen prüfen. Verlauf nur in diesem
            Fenster; die letzten fünf Frage-Antwort-Paare werden mitgesendet.
          </Typography>
          <DialogActions sx={{ px: 0, pb: 0, flexWrap: 'wrap' }}>
            <Button
              disabled={!!pending}
              onClick={() => {
                setMessages([]);
                setError('');
                setWarnings([]);
                setInput('');
              }}
            >
              Neuer Chat
            </Button>
            <Button onClick={() => setOpen(false)}>Schließen</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!input.trim() || !!pending}
            >
              Senden
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};
