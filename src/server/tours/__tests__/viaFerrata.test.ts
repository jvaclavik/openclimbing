import { parseViaFerrataRatings } from '../viaFerrata';

const html = `
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

test('liest Durchschnitt und eine Bewertung', () => {
  const ratings = parseViaFerrataRatings('norissteig', html);
  expect(ratings).toMatchObject({
    name: 'Norissteig',
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

test('lehnt eine unbekannte Seite ab', () => {
  expect(parseViaFerrataRatings('fremd', html)).toBeNull();
});
