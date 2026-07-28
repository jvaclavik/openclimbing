/* eslint-disable no-console */
const { chromium } = require('playwright-core');

const URL =
  'http://localhost:3000/relation/17262674/climbing/photo/Hlubo%C4%8Depsk%C3%A9%20plotny%20-%20Prav%C3%A1%20plotna.jpg';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`,
  );
};

const getPointCenter = async (page, idx) =>
  page.evaluate((i) => {
    const circles = [
      ...document.querySelectorAll('circle.climbing-no-pan'),
    ].filter((c) => c.getAttribute('fill') === 'transparent');
    const c = circles[i];
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      count: circles.length,
    };
  }, idx);

// The point menu is the extended RouteFloatingMenu (pointMenu state): it shows
// point-type buttons and a delete button (MUI DeleteIcon has a data-testid).
const isMenuOpen = (page) =>
  page.evaluate(() => !!document.querySelector('[data-testid="DeleteIcon"]'));

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const page = await context.newPage();

  console.log('Loading', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('svg line[stroke="transparent"]', {
    timeout: 60000,
  });
  await page.waitForTimeout(2500);

  // enter edit mode
  await page.keyboard.press('e');
  await page.waitForTimeout(500);

  // select a route with a REAL mouse click on its interactive line
  const seg = await page.evaluate(() => {
    const lines = [
      ...document.querySelectorAll('svg line[stroke="transparent"]'),
    ];
    const mid = lines
      .map((l) => ({ l, r: l.getBoundingClientRect() }))
      .filter(({ r }) => r.x > 100 && r.x < 500 && r.y > 150 && r.y < 450)
      .sort((a, b) => b.r.width + b.r.height - (a.r.width + a.r.height))[0];
    return { x: mid.r.x + mid.r.width / 2, y: mid.r.y + mid.r.height / 2 };
  });
  await page.mouse.click(seg.x, seg.y);
  await page.waitForTimeout(800);
  let p = await getPointCenter(page, 1);
  check('0 real click on route line selects the route', !!p);
  if (!p) throw new Error('cannot continue without a selected route');
  console.log(`route selected, ${p.count} point circles`);

  // ---- TEST A: mouse drag & drop in one gesture (Alt disables point snapping) ----
  const target = { x: p.x + 60, y: p.y + 40 };
  await page.keyboard.down('Alt');
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 10 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await page.waitForTimeout(250);

  const after = await getPointCenter(page, 1);
  check(
    'A1 mouse drag moves point to drop position',
    dist(after, target) < 15,
    `target=${Math.round(target.x)},${Math.round(target.y)} got=${Math.round(after.x)},${Math.round(after.y)}`,
  );

  // after release the point must NOT follow the cursor
  await page.mouse.move(target.x + 150, target.y + 120, { steps: 5 });
  await page.waitForTimeout(250);
  const afterMove = await getPointCenter(page, 1);
  check(
    'A2 point does not follow cursor after release',
    dist(afterMove, after) < 3,
    `moved by ${dist(afterMove, after).toFixed(1)}px`,
  );

  check('A3 no menu opened after drag', !(await isMenuOpen(page)));

  // ---- TEST B: fast micro-drag (sticky-drag regression) ----
  p = await getPointCenter(page, 1);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + 2, p.y + 2); // sub-threshold jitter
  await page.mouse.up();
  await page.waitForTimeout(200);
  const menuAfterClick = await isMenuOpen(page);
  await page.mouse.move(p.x + 200, p.y + 150, { steps: 5 });
  await page.waitForTimeout(250);
  const afterB = await getPointCenter(page, 1);
  check(
    'B1 fast click+jitter does not move point / no sticky follow',
    dist(afterB, p) < 3,
    `moved by ${dist(afterB, p).toFixed(1)}px`,
  );
  check('B2 plain click on point opens its menu', menuAfterClick);

  if (menuAfterClick) {
    // background tap cancels the point menu (Escape would exit edit mode)
    await page.mouse.click(p.x + 250, p.y - 120);
    await page.waitForTimeout(300);
  }
  check('B3 menu closed again by background tap', !(await isMenuOpen(page)));

  // ---- TEST C: touch drag via CDP (real touch pipeline) ----
  const cdp = await context.newCDPSession(page);
  p = await getPointCenter(page, 1);
  const tTarget = { x: p.x - 70, y: p.y - 45 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: p.x, y: p.y }],
  });
  const steps = 12;
  for (let i = 1; i <= steps; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: p.x + ((tTarget.x - p.x) * i) / steps,
          y: p.y + ((tTarget.y - p.y) * i) / steps,
        },
      ],
    });
    await page.waitForTimeout(30);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await page.waitForTimeout(300);

  const afterC = await getPointCenter(page, 1);
  check(
    'C1 touch drag moves point to drop position',
    dist(afterC, tTarget) < 25,
    `target=${Math.round(tTarget.x)},${Math.round(tTarget.y)} got=${Math.round(afterC.x)},${Math.round(afterC.y)}`,
  );
  check('C2 no menu opened after touch drag', !(await isMenuOpen(page)));

  // point must stay put after the gesture ended
  await page.waitForTimeout(400);
  const afterC2 = await getPointCenter(page, 1);
  check(
    'C3 point stays where dropped',
    afterC2 && dist(afterC2, afterC) < 3,
    afterC2
      ? `moved by ${dist(afterC2, afterC).toFixed(1)}px`
      : 'points disappeared',
  );

  // ---- TEST D: repeatability - second touch drag right after ----
  const p2 = await getPointCenter(page, 1);
  const t2 = { x: p2.x + 45, y: p2.y + 55 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: p2.x, y: p2.y }],
  });
  for (let i = 1; i <= steps; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: p2.x + ((t2.x - p2.x) * i) / steps,
          y: p2.y + ((t2.y - p2.y) * i) / steps,
        },
      ],
    });
    await page.waitForTimeout(30);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await page.waitForTimeout(300);
  const afterD = await getPointCenter(page, 1);
  check(
    'D1 second touch drag also works',
    dist(afterD, t2) < 25,
    `target=${Math.round(t2.x)},${Math.round(t2.y)} got=${Math.round(afterD.x)},${Math.round(afterD.y)}`,
  );

  // ---- TEST E: mouse drag repeatability after everything above ----
  const p3 = await getPointCenter(page, 1);
  const t3 = { x: p3.x - 50, y: p3.y + 30 };
  await page.keyboard.down('Alt');
  await page.mouse.move(p3.x, p3.y);
  await page.mouse.down();
  await page.mouse.move(t3.x, t3.y, { steps: 8 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await page.waitForTimeout(250);
  const afterE = await getPointCenter(page, 1);
  check(
    'E1 mouse drag still works after all gestures',
    dist(afterE, t3) < 15,
    `target=${Math.round(t3.x)},${Math.round(t3.y)} got=${Math.round(afterE.x)},${Math.round(afterE.y)}`,
  );

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`,
  );
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('SCRIPT ERROR:', e.message);
  process.exit(2);
});
