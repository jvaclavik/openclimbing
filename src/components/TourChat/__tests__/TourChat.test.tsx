import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TourChat } from '../TourChat';

const originalFetch = global.fetch;
const originalEnabled = process.env.kletterglueckChatEnabled;
const fetchMock = jest.fn();
beforeEach(() => {
  process.env.kletterglueckChatEnabled = 'true';
  global.fetch = fetchMock;
  fetchMock.mockReset();
});
afterEach(() => {
  global.fetch = originalFetch;
  if (originalEnabled === undefined)
    delete process.env.kletterglueckChatEnabled;
  else process.env.kletterglueckChatEnabled = originalEnabled;
});
const openChat = () => {
  render(<TourChat />);
  fireEvent.click(screen.getByRole('button', { name: 'Tourenchat' }));
};
test('hidden when preview feature is disabled', () => {
  process.env.kletterglueckChatEnabled = 'false';
  render(<TourChat />);
  expect(screen.queryByRole('button', { name: 'Tourenchat' })).toBeNull();
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
  openChat();
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
});
test('displays failures without losing the question', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ error: 'Budget erreicht' }),
  });
  openChat();
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
