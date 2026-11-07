import {
  matchClimbSlug,
  parseClimbSlugs,
  parseViaFerrataRatings,
} from '../viaFerrata';

const html = `
<h1>Norissteig</h1>
<div class="vf-info-item vf-difficulty" title="Schwierigkeit"><span>B/C</span></div>
<div class="vf-info-item vf-duration" title="Dauer"><span>3 h</span></div>
<meta property="og:image" content="https://www.via-ferrata.de/wp-content/sabai/File/files/l_abc.jpg" />
<div class="sabai-directory-body" itemprop="description"><p>Kurzer Satz &#8211; mit Gedankenstrich.</p><h2>Zufahrt</h2><p>Vom Parkplatz.</p></div>

<div class="sabai-directory-main">
  <span class="sabai-voting-rating-average" itemprop="ratingValue">4.05</span>
  <span itemprop="reviewCount">2</span>
</div>
<div class="sabai-directory-review-title"><span>Beispielstieg</span></div>
<div class="sabai-directory-review-rating">
  <span itemprop="ratingValue">4.0</span>
</div>
<ul class="sabai-entity-activity"><li>
  <a class="sabai-user sabai-user-with-thumbnail" href="https://www.via-ferrata.de/members/ada/">Ada</a>
  reviewed <a href="https://www.via-ferrata.de/klettersteige/reviews/9" title="1. Mai 2024 10:00">vor 2 Jahren</a>
</li></ul>
<div class="sabai-directory-body" itemprop="reviewBody"><p>Kurzer Satz & noch einer.</p></div>
`;

const slugs = [
  'norissteig',
  'hoehengluecksteig',
  'via-ferrata-piero-rossi-ex-ferrata-marmol',
  'steig',
];

test('liest Durchschnitt und eine Bewertung', () => {
  const ratings = parseViaFerrataRatings('norissteig', html);
  expect(ratings).toMatchObject({
    name: 'Norissteig',
    difficulty: 'B/C',
    duration: '3 h',
    images: [
      'https://www.via-ferrata.de/wp-content/sabai/File/files/l_abc.jpg',
    ],
    description: [
      { kind: 'p', text: 'Kurzer Satz – mit Gedankenstrich.' },
      { kind: 'h2', text: 'Zufahrt' },
      { kind: 'p', text: 'Vom Parkplatz.' },
    ],
    average: 4.05,
    count: 2,
    reviews: [
      {
        title: 'Beispielstieg',
        stars: 4,
        author: 'Ada',
        date: '1. Mai 2024 10:00',
        text: 'Kurzer Satz & noch einer.',
        url: 'https://www.via-ferrata.de/klettersteige/reviews/9',
      },
    ],
  });
});

test('ordnet Namen der kompletten Sitemap zu', () => {
  expect(
    parseClimbSlugs(
      '<loc>https://www.via-ferrata.de/klettersteige/topo/norissteig</loc>',
    ),
  ).toEqual(['norissteig']);
  expect(matchClimbSlug('Norissteig', slugs)).toBe('norissteig');
  expect(matchClimbSlug('Höhenglücksteig', slugs)).toBe('hoehengluecksteig');
  expect(matchClimbSlug('Via Ferrata Piero Rossi', slugs)).toBe(
    'via-ferrata-piero-rossi-ex-ferrata-marmol',
  );
  expect(matchClimbSlug('Irgendwas', slugs)).toBeNull();
});
