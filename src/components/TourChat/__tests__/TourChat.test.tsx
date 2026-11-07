import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Feature } from '../../../services/types';
import {
  FeatureContext,
  type FeatureContextType,
} from '../../utils/FeatureContext';
import { DATA_NOTICE, LIMITATION } from '../tourHelp';
import { TourChat } from '../TourChat';

jest.mock('../../helpers', () => {
  const actual = jest.requireActual('../../helpers');
  return { ...actual, useMobileMode: () => false };
});

const originalFetch = global.fetch;
const originalEnabled = process.env.kletterglueckChatEnabled;
const fetchMock = jest.fn();

beforeEach(() => {
  process.env.kletterglueckChatEnabled = 'true';
  global.fetch = fetchMock;
  fetchMock.mockReset();
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalEnabled === undefined)
    delete process.env.kletterglueckChatEnabled;
  else process.env.kletterglueckChatEnabled = originalEnabled;
});

const openHelp = () => {
  render(<TourChat />);
  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));
};

test('hidden when preview feature is disabled', () => {
  process.env.kletterglueckChatEnabled = 'false';
  render(<TourChat />);
  expect(screen.queryByRole('button', { name: 'Tourenhilfe' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tourenchat' })).toBeNull();
});

test('starts collapsed and shows suggestions only after a tap', () => {
  render(<TourChat />);
  expect(screen.getByRole('button', { name: 'Tourenhilfe' })).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Leichte Touren hier finden' }),
  ).toBeNull();
  expect(screen.queryByText(LIMITATION)).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));

  expect(
    screen.getByRole('button', { name: 'Leichte Touren hier finden' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', {
      name: 'Welche Tour passt zu meiner Erfahrung?',
    }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', {
      name: 'Welche Klettersteige gibt es in einer Region?',
    }),
  ).toBeTruthy();
  expect(screen.getByRole('textbox')).toBeTruthy();
  expect(screen.getByText(LIMITATION)).toBeTruthy();
  expect(screen.queryByText(DATA_NOTICE)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Datenhinweis' }));
  expect(screen.getByText(DATA_NOTICE)).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('leaves the map interactive while the panel is open', () => {
  const onMarker = jest.fn();
  render(
    <div>
      <button type="button" onClick={onMarker}>
        Kartenmarker
      </button>
      <TourChat />
    </div>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.querySelector('.MuiBackdrop-root')).toBeNull();
  expect(document.querySelector('.MuiModal-root')).toBeNull();
  expect(document.body.style.overflow).not.toBe('hidden');
  expect(document.body.getAttribute('aria-hidden')).not.toBe('true');

  const shell = screen.getByTestId('tour-help');
  expect(shell.style.position).toBe('absolute');
  expect(shell.style.pointerEvents).toBe('none');
  expect(shell.style.left).toBe('');
  expect(shell.style.top).toBe('');
  expect(shell.style.height).toBe('');
  expect(shell.style.width).not.toBe('100%');
  expect(shell.style.width).not.toBe('100vw');

  const panel = screen.getByRole('region', { name: 'Tourenhilfe' });
  expect(panel.getAttribute('aria-modal')).toBeNull();
  expect(panel.style.pointerEvents).toBe('auto');
  expect(panel.style.maxHeight).not.toBe('100%');
  expect(panel.style.maxHeight).not.toBe('100vh');

  const marker = screen.getByRole('button', { name: 'Kartenmarker' });
  expect(marker.getAttribute('aria-hidden')).not.toBe('true');
  expect(marker.closest('[inert]')).toBeNull();
  act(() => {
    screen.getByRole('textbox').focus();
  });
  fireEvent.click(marker);
  expect(onMarker).toHaveBeenCalledTimes(1);
});

test('sends a question, displays an answer and safe source link, then clears history', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      text: 'Hier ist eine Tour aus dem Katalog.',
      sources: [
        {
          name: 'Teststeig',
          href: '/way/123',
          difficulty: 'B',
          source: 'OSM',
          location: 'de',
        },
      ],
      warnings: [],
    }),
  });
  openHelp();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Welche Touren gibt es?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
  await screen.findByText('Hier ist eine Tour aus dem Katalog.');
  expect(
    screen.getByRole('link', { name: 'Teststeig' }).getAttribute('href'),
  ).toBe('/way/123');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages).toEqual([
    { role: 'user', content: 'Welche Touren gibt es?' },
  ]);
  fireEvent.click(screen.getByRole('button', { name: 'Neuer Chat' }));
  expect(screen.queryByText('Hier ist eine Tour aus dem Katalog.')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Leichte Touren hier finden' }),
  ).toBeTruthy();
});

test('keeps the conversation when minimized and reopened', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      text: 'Eine ruhige Empfehlung.',
      sources: [],
      warnings: [],
    }),
  });
  openHelp();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Was passt zu wenig Erfahrung?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
  await screen.findByText('Eine ruhige Empfehlung.');

  fireEvent.click(screen.getByRole('button', { name: 'Minimieren' }));
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('button', { name: 'Tourenhilfe' })).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));
  expect(screen.getByText('Eine ruhige Empfehlung.')).toBeTruthy();
  expect(screen.getByText('Was passt zu wenig Erfahrung?')).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('displays failures without losing the question', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'Budget erreicht' }),
  });
  openHelp();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Meine Frage' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
  await screen.findByText('Budget erreicht');
  await waitFor(() =>
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(
      false,
    ),
  );
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
    'Meine Frage',
  );
});

const renderWithFeature = (feature: Partial<Feature> | null) =>
  render(
    <FeatureContext.Provider value={{ feature } as FeatureContextType}>
      <TourChat />
    </FeatureContext.Provider>,
  );

test('sends the open tour name with the here-starter and nothing invented otherwise', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ text: 'Katalogantwort', sources: [], warnings: [] }),
  });
  renderWithFeature({
    tags: { name: 'Norissteig', 'addr:city': 'Nürnberg' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Leichte Touren hier finden' }),
  );
  await screen.findByText('Katalogantwort');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content).toBe(
    'Leichte Touren hier finden\nAusgewählte Karte: Norissteig, Nürnberg',
  );
});

test('does not invent a place from map coordinates', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ text: 'Katalogantwort', sources: [], warnings: [] }),
  });
  renderWithFeature({ tags: {}, center: [11.07, 49.45] });
  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Leichte Touren hier finden' }),
  );
  await screen.findByText('Katalogantwort');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content).toBe(
    'Leichte Touren hier finden',
  );
});

test('does not speak when the map selection changes', () => {
  const view = (feature: Partial<Feature> | null) => (
    <FeatureContext.Provider value={{ feature } as FeatureContextType}>
      <TourChat />
    </FeatureContext.Provider>
  );
  const { rerender } = render(view(null));
  fireEvent.click(screen.getByRole('button', { name: 'Tourenhilfe' }));
  rerender(view({ tags: { name: 'Norissteig' } }));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByText(/Ausgewählte Karte/)).toBeNull();
});
