import { expect, test, type Page } from '@playwright/test';

/**
 * Functional regression gate for the PSI Gate (DH-PSI / OPRF-PSI) demo.
 *
 * The a11y spec proves the page is reachable and scannable; this one proves the
 * page is *right*. PSI has exactly one load-bearing claim — "A ∩ B and nothing
 * else" — and every verdict here is checked against a value the page itself
 * rendered: the intersection is recomputed in the test from the two sets the
 * page is displaying and compared with the count and the elements the page
 * reports, so a wrong answer cannot be papered over with a hardcoded string.
 * What is pinned:
 *
 *   1. Correctness. Exhibits 1, 3 and 6 each report an intersection; each is
 *      recomputed from the plaintext that exhibit rendered, and the cardinality
 *      counters are asserted to add up (matched + unmatched = |set|, per side).
 *   2. Privacy — the claim the README makes twice. In Exhibit 2's two blinding
 *      paths and in Exhibit 3's alignment grid, the double-blinded value of a
 *      NON-matching element must not appear on the other party's side; only the
 *      shared elements' bytes collide. That is asserted as set disjointness on
 *      the rendered hex, not as the presence of a reassuring sentence.
 *   3. Every failure and tamper path the app has, each asserted to reach its
 *      failure state AND to name its cause on screen: empty input, the two
 *      no-alignment-grid paths (OPRF, over-size), all five attack simulations
 *      (inflation, dictionary, scalar reuse, malformed-point injection, lying
 *      OPRF Bob), and the blocked-clipboard fallback.
 *   4. Stale state. Exhibit 3's verdict names concrete set sizes; editing either
 *      set must retract it rather than leave it standing over inputs it was not
 *      computed from. (Regression: it used to linger — see the retractResult
 *      note in initExhibit3.)
 *   5. Internal consistency of the statistics: the transcript's per-round byte
 *      counts sum to its total, the benchmark table's per-op and throughput
 *      columns follow from its own total and iteration count, and the DDH
 *      sampler's verdict is the one its own χ² statistic and its own printed
 *      acceptance bands imply.
 */

// Uncaught page exceptions fail the test that provoked them. Reset per test;
// a worker only ever runs one test at a time, so this stays test-scoped.
let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto('.');
  await expect(page.locator('#tab-1')).toBeVisible();
});

test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

// --- helpers ---------------------------------------------------------------

/** Whitespace-normalized text of the first match. */
async function text(page: Page, selector: string): Promise<string> {
  return ((await page.locator(selector).textContent()) ?? '').replace(/\s+/g, ' ').trim();
}

async function texts(page: Page, selector: string): Promise<string[]> {
  return (await page.locator(selector).allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());
}

/**
 * Every `.info-grid` under `scope` as label → value. The grids alternate
 * `.info-label` / `.info-value` children, which is how the page pairs them
 * visually, so reading them in document order is reading what a user sees.
 */
async function infoPairs(page: Page, scope: string): Promise<Map<string, string>> {
  const cells = await page.$$eval(`${scope} .info-grid > *`, (nodes) =>
    nodes.map((n) => [n.className, (n.textContent ?? '').replace(/\s+/g, ' ').trim()]),
  );
  const out = new Map<string, string>();
  for (let i = 0; i + 1 < cells.length; i += 2) {
    expect(cells[i]![0]).toContain('info-label');
    expect(cells[i + 1]![0]).toContain('info-value');
    out.set(cells[i]![1], cells[i + 1]![1]);
  }
  return out;
}

/** First integer in a rendered value, commas and units stripped. */
function firstInt(s: string): number {
  const m = /-?[\d,]+/.exec(s);
  expect(m, `no integer in ${JSON.stringify(s)}`).not.toBeNull();
  return Number(m![0].replace(/,/g, ''));
}

/** All integers in a string, in order. */
function allInts(s: string): number[] {
  return [...s.matchAll(/\d[\d,]*/g)].map((m) => Number(m[0].replace(/,/g, '')));
}

function sorted(xs: string[]): string[] {
  return [...xs].sort();
}

/** The honest answer: elements of A that really are in B. */
function trueIntersection(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((el) => bSet.has(el));
}

function splitList(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

/** Exhibit 2 renders one step at a time; rewind, then advance to `index`. */
async function e2Step(page: Page, index: number): Promise<void> {
  const prev = page.locator('#e2-prev');
  const next = page.locator('#e2-next');
  for (let i = 0; i < 10 && !(await prev.isDisabled()); i += 1) await prev.click();
  for (let i = 0; i < index; i += 1) await next.click();
  await expect(page.locator('#e2-step')).toHaveText(`Step ${index + 1} / 6`);
}

/** The chips on the current walkthrough step: name, stage hex, matched flag. */
async function e2Chips(page: Page): Promise<Array<{ name: string; hex: string; matched: boolean }>> {
  return page.$$eval('#e2-panel .e2-chip', (chips) =>
    chips.map((c) => ({
      name: (c.querySelector('.e2-chip-name')?.textContent ?? '').trim(),
      // "α·H(x) = 7435c2a1ce29…" — keep the bytes, drop the stage label and the
      // truncation ellipsis.
      hex: ((c.querySelector('.e2-chip-hex')?.textContent ?? '').split('=').pop() ?? '')
        .replace('…', '')
        .trim(),
      matched: c.classList.contains('matched'),
    })),
  );
}

// --- Exhibit 1: contact discovery -----------------------------------------

test('exhibit 1 reports the true intersection of the two lists it printed', async ({ page }) => {
  await page.locator('#tab-1').click();

  // The omniscient view prints both sides in plaintext, so the honest answer is
  // recomputable from the page itself — no expected value is written down here.
  const aliceContacts = await texts(page, '#e1-alice-list li');
  const serverUsers = await texts(page, '#e1-bob-list li');
  expect(aliceContacts.length).toBeGreaterThan(0);
  expect(serverUsers.length).toBeGreaterThan(0);
  const expected = trueIntersection(aliceContacts, serverUsers);
  expect(expected.length).toBeGreaterThan(0); // the scenario must actually match something

  // Before the run nothing is marked as matching.
  expect(await page.locator('#e1-alice-list li.match').count()).toBe(0);

  await page.locator('#e1-run').click();
  await expect(page.locator('#e1-output .result-box')).toBeVisible();

  const pairs = await infoPairs(page, '#e1-output');
  expect(firstInt(pairs.get('Intersection found:')!)).toBe(expected.length);
  expect(firstInt(pairs.get("Alice's contacts:")!)).toBe(aliceContacts.length);
  expect(firstInt(pairs.get('Server database:')!)).toBe(serverUsers.length);

  // The elements named are exactly the true intersection — no extra, none
  // missing. (The protocol shuffles, so order is not part of the claim.)
  expect(sorted(await texts(page, '#e1-output .intersection-item'))).toEqual(sorted(expected));

  // Alice's list is re-marked from the SAME result: every highlighted contact is
  // genuinely in the server database, and every un-highlighted one is not.
  expect(sorted(await texts(page, '#e1-alice-list li.match'))).toEqual(sorted(expected));
  expect(sorted(await texts(page, '#e1-alice-list li.no-match'))).toEqual(
    sorted(aliceContacts.filter((c) => !expected.includes(c))),
  );
  // Parts sum to the whole on both sides of the marking.
  expect(await page.locator('#e1-alice-list li').count()).toBe(aliceContacts.length);

  // The "omniscient view" paragraph's five numbers are the counts it claims:
  // matches, each side's size, and the two non-matching remainders.
  const note = await text(page, '#e1-output .status.info');
  const m = /plus the (\d+) match\(es\) and the count (\d+); the server sees only its own users plus the count (\d+)\. The (\d+) server users and (\d+) contacts that did not match/.exec(
    note,
  );
  expect(m, `omniscient note did not parse: ${note}`).not.toBeNull();
  expect(m!.slice(1).map(Number)).toEqual([
    expected.length,
    serverUsers.length,
    aliceContacts.length,
    serverUsers.length - expected.length,
    aliceContacts.length - expected.length,
  ]);

  // A second run draws fresh α and β. The blinding changes; the answer must not.
  await expect(page.locator('#e1-run')).toHaveText('Run PSI Again');
  await page.locator('#e1-run').click();
  await expect(page.locator('#e1-run')).toHaveText('Run PSI Again');
  expect(sorted(await texts(page, '#e1-output .intersection-item'))).toEqual(sorted(expected));
});

// --- Exhibit 2: protocol walkthrough --------------------------------------

test('exhibit 2 converges only the shared element, and only after both locks', async ({ page }) => {
  await page.locator('#tab-2').click();

  // Step 1 names the two sets; everything below is derived from them.
  await e2Step(page, 1);
  const setup = await e2Chips(page);
  const half = setup.length / 2;
  expect(Number.isInteger(half)).toBe(true);
  const aliceSet = setup.slice(0, half).map((c) => c.name);
  const bobSet = setup.slice(half).map((c) => c.name);
  const shared = trueIntersection(aliceSet, bobSet);
  expect(shared).toEqual(['bob@example.com']);

  // Step 2 — H(x) is a function: the shared email hashes to the same point on
  // both sides, and distinct emails land on distinct points.
  await e2Step(page, 2);
  const hashed = await e2Chips(page);
  const hashOf = new Map(hashed.map((c) => [c.name, c.hex]));
  for (const el of shared) {
    const bothSides = hashed.filter((c) => c.name === el).map((c) => c.hex);
    expect(bothSides).toHaveLength(2);
    expect(bothSides[0]).toBe(bothSides[1]);
  }
  expect(new Set(hashOf.values()).size).toBe(hashOf.size);

  // Step 3 — one lock each is NOT enough: α·H(bob) ≠ β·H(bob), and no
  // single-blinded value is shared between the columns.
  await e2Step(page, 3);
  const single = await e2Chips(page);
  const singleAlice = single.slice(0, half).map((c) => c.hex);
  const singleBob = single.slice(half).map((c) => c.hex);
  expect(singleAlice.filter((h) => singleBob.includes(h))).toEqual([]);
  // Both scalars are rendered as press-to-reveal buttons, not as plain text.
  await expect(page.locator('#e2-panel .scalar-btn')).toHaveCount(2);
  for (const pressed of await page.locator('#e2-panel .scalar-btn').evaluateAll((bs) =>
    bs.map((b) => b.getAttribute('aria-pressed')),
  )) {
    expect(pressed).toBe('false');
  }

  // Step 4 — the second lock. The two blinding orders collide byte-for-byte on
  // the shared element and on nothing else: that disjointness IS the privacy
  // claim, checked on the rendered bytes.
  await e2Step(page, 4);
  const dbl = await e2Chips(page);
  const dblAlice = dbl.slice(0, half);
  const dblBob = dbl.slice(half);
  expect(dblAlice.filter((c) => c.matched).map((c) => c.name)).toEqual(shared);
  expect(dblBob.filter((c) => c.matched).map((c) => c.name)).toEqual(shared);
  const sharedHexA = dblAlice.find((c) => c.name === shared[0])!.hex;
  const sharedHexB = dblBob.find((c) => c.name === shared[0])!.hex;
  expect(sharedHexA).toBe(sharedHexB);
  // Every non-shared element's double-blinded value stays on its own side.
  const crossed = dblAlice
    .filter((c) => !shared.includes(c.name))
    .map((c) => c.hex)
    .filter((h) => dblBob.map((c) => c.hex).includes(h));
  expect(crossed).toEqual([]);

  // The "byte-identical" banner is the OK variant and quotes that same value on
  // both paths — the page's headline claim, checked against its own chips.
  await expect(page.locator('#e2-panel .e2-snap')).toHaveClass(/e2-snap ok/);
  const snapHexes = await texts(page, '#e2-panel .e2-snap-hex code');
  expect(snapHexes).toHaveLength(2);
  expect(snapHexes[0]).toBe(snapHexes[1]);
  expect(snapHexes[0]!.replace('…', '').startsWith(sharedHexA)).toBe(true);

  // Step 5 — the verifier check, and what each side is told it learned.
  await e2Step(page, 5);
  const verdict = await infoPairs(page, '#e2-panel');
  expect(splitList(verdict.get('Plain-text intersection (verifier check):')!)).toEqual(sorted(shared));
  expect(splitList(verdict.get('PSI result:')!)).toEqual(sorted(shared));
  expect(verdict.get('Correct:')).toBe('✓ YES');
  await expect(page.locator('#e2-panel .info-value.match').nth(2)).toHaveText('✓ YES');
  expect(await texts(page, '#e2-panel .intersection-item')).toEqual(shared);
  expect(firstInt(verdict.get('Alice learned:')!)).toBe(bobSet.length);
  expect(firstInt(verdict.get('Bob learned:')!)).toBe(aliceSet.length);

  // Navigation bounds: first step cannot go back, last cannot go forward.
  await expect(page.locator('#e2-next')).toBeDisabled();
  await e2Step(page, 0);
  await expect(page.locator('#e2-prev')).toBeDisabled();
});

// --- Exhibit 3: live simulator --------------------------------------------

/** Read the simulator's two textareas the way the app parses them. */
async function e3Sets(page: Page): Promise<{ alice: string[]; bob: string[] }> {
  const parse = (v: string): string[] => v.split('\n').map((s) => s.trim()).filter(Boolean);
  return {
    alice: parse(await page.locator('#e3-alice').inputValue()),
    bob: parse(await page.locator('#e3-bob').inputValue()),
  };
}

test('the simulator reports the intersection of the sets in its own textareas', async ({ page }) => {
  await page.locator('#tab-3').click();
  const { alice, bob } = await e3Sets(page);
  const expected = trueIntersection(alice, bob);
  expect(expected.length).toBeGreaterThan(0);
  expect(expected.length).toBeLessThan(Math.min(alice.length, bob.length)); // a real, partial overlap

  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });

  const pairs = await infoPairs(page, '#e3-output');
  expect(firstInt(pairs.get("Alice's elements:")!)).toBe(alice.length);
  expect(firstInt(pairs.get("Bob's elements:")!)).toBe(bob.length);
  expect(firstInt(pairs.get('Intersection size:')!)).toBe(expected.length);
  expect(pairs.get('Correct (verified):')).toBe('✓');
  expect(sorted(await texts(page, '#e3-output .intersection-item'))).toEqual(sorted(expected));

  // "What each party learned" — the leakage claim, as arithmetic: what each
  // side is told, plus what it is told it did NOT learn, is the whole set.
  expect(allInts(pairs.get('Alice learned:')!)).toEqual([expected.length, bob.length]);
  expect(allInts(pairs.get('Bob learned:')!)).toEqual([alice.length]);
  expect(allInts(pairs.get('Neither learned:')!)).toEqual([
    alice.length - expected.length,
    bob.length - expected.length,
  ]);
});

test('the alignment grid ticks exactly the matching rows and leaks nothing else', async ({ page }) => {
  await page.locator('#tab-3').click();
  const { alice, bob } = await e3Sets(page);
  const expected = trueIntersection(alice, bob);

  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .align-card')).toBeVisible({ timeout: 15_000 });

  const columns = await page.$$eval('#e3-output .align-list', (lists) =>
    lists.map((ul) =>
      Array.from(ul.querySelectorAll('.align-row')).map((li) => ({
        matched: li.classList.contains('matched'),
        hex: (li.querySelector('.align-hex')?.textContent ?? '').replace('…', '').trim(),
        plain: (li.querySelector('.align-plain')?.textContent ?? '').trim(),
        plainHidden: (li.querySelector('.align-plain') as HTMLElement | null)?.hidden ?? null,
        hexHidden: (li.querySelector('.align-hex') as HTMLElement | null)?.hidden ?? null,
      })),
    ),
  );
  expect(columns).toHaveLength(2);
  const [aliceCol, bobCol] = columns as [typeof columns[0], typeof columns[0]];

  // One row per element, and exactly |A ∩ B| of them are ticked on each side.
  expect(aliceCol).toHaveLength(alice.length);
  expect(bobCol).toHaveLength(bob.length);
  expect(aliceCol.filter((r) => r.matched)).toHaveLength(expected.length);
  expect(bobCol.filter((r) => r.matched)).toHaveLength(expected.length);

  // The tick is earned: the ticked rows are byte-identical across the two
  // columns, and NO other value appears on both sides. Non-matching elements
  // are not revealed to the other party — the README's core privacy promise,
  // asserted as disjointness of the rendered double-blinded bytes.
  const tickedA = sorted(aliceCol.filter((r) => r.matched).map((r) => r.hex));
  const tickedB = sorted(bobCol.filter((r) => r.matched).map((r) => r.hex));
  expect(tickedA).toEqual(tickedB);
  const bobHexes = new Set(bobCol.map((r) => r.hex));
  expect(aliceCol.filter((r) => !r.matched && bobHexes.has(r.hex))).toEqual([]);
  const aliceHexes = new Set(aliceCol.map((r) => r.hex));
  expect(bobCol.filter((r) => !r.matched && aliceHexes.has(r.hex))).toEqual([]);
  expect(new Set([...aliceHexes, ...bobHexes]).size).toBe(
    alice.length + bob.length - expected.length,
  );

  // Plaintext is hidden until asked for.
  expect(aliceCol.every((r) => r.plainHidden === true && r.hexHidden === false)).toBe(true);
  await expect(page.locator('#e3-reveal')).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#e3-reveal').click();
  await expect(page.locator('#e3-reveal')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#e3-reveal')).toHaveText('Hide plaintext');
  const revealed = await page.$$eval('#e3-output .align-list', (lists) =>
    lists.map((ul) =>
      Array.from(ul.querySelectorAll('.align-row')).map((li) => ({
        matched: li.classList.contains('matched'),
        plain: (li.querySelector('.align-plain')?.textContent ?? '').trim(),
        plainHidden: (li.querySelector('.align-plain') as HTMLElement | null)?.hidden ?? null,
        hexHidden: (li.querySelector('.align-hex') as HTMLElement | null)?.hidden ?? null,
      })),
    ),
  );
  // Revealed, each column is its own set, and the ticked rows spell out exactly
  // the true intersection — the rows and the verdict describe one execution.
  expect(sorted(revealed[0]!.map((r) => r.plain))).toEqual(sorted(alice));
  expect(sorted(revealed[1]!.map((r) => r.plain))).toEqual(sorted(bob));
  expect(sorted(revealed[0]!.filter((r) => r.matched).map((r) => r.plain))).toEqual(sorted(expected));
  expect(sorted(revealed[1]!.filter((r) => r.matched).map((r) => r.plain))).toEqual(sorted(expected));
  expect(revealed[0]!.every((r) => r.plainHidden === false && r.hexHidden === true)).toBe(true);

  await page.locator('#e3-reveal').click();
  await expect(page.locator('#e3-reveal')).toHaveText('Reveal plaintext');
  await expect(page.locator('#e3-output .align-plain').first()).toBeHidden();
});

test('editing a set retracts the verdict instead of leaving it standing', async ({ page }) => {
  await page.locator('#tab-3').click();
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });

  // Regression: the result panel names concrete set sizes and prints "Correct
  // (verified) ✓". Editing an input used to leave that verdict on screen over
  // inputs it was never computed from.
  await page.locator('#e3-alice').fill(['x@example.com', 'y@example.com'].join('\n'));
  await expect(page.locator('#e3-output .result-box')).toHaveCount(0);
  await expect(page.locator('#e3-output .align-card')).toHaveCount(0);
  await expect(page.locator('#e3-run')).toBeEnabled();
  await expect(page.locator('#e3-run')).toHaveText('Run PSI');

  // And the control still works afterwards, on the new inputs.
  await page.locator('#e3-bob').fill(['y@example.com', 'z@example.com'].join('\n'));
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });
  let pairs = await infoPairs(page, '#e3-output');
  expect(firstInt(pairs.get('Intersection size:')!)).toBe(1);
  expect(await texts(page, '#e3-output .intersection-item')).toEqual(['y@example.com']);

  // Switching protocol retracts it too: the same sets under a different
  // protocol is a different run, and the panel says which protocol it ran.
  await page.locator('input[name="e3-proto"][value="oprf"]').check();
  await expect(page.locator('#e3-output .result-box')).toHaveCount(0);
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });
  pairs = await infoPairs(page, '#e3-output');
  expect(firstInt(pairs.get('Intersection size:')!)).toBe(1);
});

test('an empty set is refused, and the refusal names the reason', async ({ page }) => {
  await page.locator('#tab-3').click();

  await page.locator('#e3-alice').fill('   \n  \n');
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .status.error')).toHaveText('Both sets must be non-empty.');
  await expect(page.locator('#e3-output .result-box')).toHaveCount(0);
  await expect(page.locator('#e3-run')).toBeEnabled();

  // The other side is refused the same way, and the run button never dies.
  await page.locator('#e3-alice').fill('a@example.com');
  await page.locator('#e3-bob').fill('');
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .status.error')).toHaveText('Both sets must be non-empty.');

  await page.locator('#e3-bob').fill('a@example.com');
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });
});

test('OPRF-PSI and over-size sets each say why there is no alignment grid', async ({ page }) => {
  await page.locator('#tab-3').click();

  // OPRF-PSI matches a single column of PRF tags — no two-column grid exists.
  await page.locator('#e3-alice').fill(['a@x.com', 'b@x.com', 'c@x.com'].join('\n'));
  await page.locator('#e3-bob').fill(['b@x.com', 'c@x.com', 'd@x.com'].join('\n'));
  await page.locator('input[name="e3-proto"][value="oprf"]').check();
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 15_000 });
  expect(firstInt((await infoPairs(page, '#e3-output')).get('Intersection size:')!)).toBe(2);
  expect(sorted(await texts(page, '#e3-output .intersection-item'))).toEqual(['b@x.com', 'c@x.com']);
  await expect(page.locator('#e3-output .align-card')).toHaveCount(0);
  await expect(page.locator('#e3-output .status.info')).toContainText(
    'alignment grid is shown for the DH-PSI protocol',
  );

  // Over the grid's size cap, DH-PSI still answers — and names the cap.
  await page.locator('input[name="e3-proto"][value="dh"]').check();
  const big = Array.from({ length: 13 }, (_, i) => `bulk-${i}@example.com`);
  await page.locator('#e3-alice').fill(big.join('\n'));
  await page.locator('#e3-bob').fill([...big.slice(0, 5), 'server.only@example.com'].join('\n'));
  await page.locator('#e3-run').click();
  await expect(page.locator('#e3-output .result-box')).toBeVisible({ timeout: 30_000 });
  const pairs = await infoPairs(page, '#e3-output');
  expect(firstInt(pairs.get('Intersection size:')!)).toBe(5);
  expect(pairs.get('Correct (verified):')).toBe('✓');
  await expect(page.locator('#e3-output .align-card')).toHaveCount(0);
  await expect(page.locator('#e3-output .status.info')).toContainText(
    'alignment grid renders for sets up to 12 elements each',
  );
});

// --- Exhibit 4: attacks ----------------------------------------------------

test('attack 1: the inflated size Alice sees is the real size plus the padding', async ({ page }) => {
  await page.locator('#tab-4').click();
  await page.locator('#e4-a1-run').click();
  await expect(page.locator('#e4-a1-output .result-box')).toBeVisible();

  const pairs = await infoPairs(page, '#e4-a1-output');
  const seen = firstInt(pairs.get("Alice sees Bob's set size as:")!);
  const actual = firstInt(pairs.get("Bob's actual set size:")!);
  const delta = firstInt(pairs.get('Inflation delta:')!);
  expect(seen).toBe(actual + delta);
  expect(delta).toBeGreaterThan(0);
  expect(pairs.get("Alice sees Bob's set size as:")).toContain('inflated');
  // The lie is about the size only: the intersection is still the honest one.
  expect(splitList(pairs.get('Intersection (still correct):')!).length).toBeGreaterThan(0);
  await expect(page.locator('#e4-a1-output .warning-box')).toContainText(
    'Bob can claim any size without Alice knowing',
  );
});

test('attack 2: dictionary coverage is the fraction of the set it recovered', async ({ page }) => {
  await page.locator('#tab-4').click();
  await page.locator('#e4-a2-run').click();
  await expect(page.locator('#e4-a2-output .result-box')).toBeVisible();

  const pairs = await infoPairs(page, '#e4-a2-output');
  const aliceSize = firstInt(pairs.get("Alice's set size:")!);
  const dictSize = firstInt(pairs.get("Bob's dictionary size:")!);
  const learned = splitList(pairs.get("Alice's elements learned by Bob:")!);
  const coverage = firstInt(pairs.get('Coverage:')!);

  expect(learned.length).toBeLessThanOrEqual(aliceSize);
  expect(coverage).toBe(Math.round((learned.length / aliceSize) * 100));
  expect(dictSize).toBeGreaterThan(aliceSize);
  // A small domain really is fully enumerable — the point of the exhibit.
  expect(learned).toHaveLength(aliceSize);
  expect(coverage).toBe(100);

  // The prose repeats the same four numbers rather than a second story.
  const warning = await text(page, '#e4-a2-output .warning-box');
  expect(allInts(warning).slice(0, 4)).toEqual([dictSize, learned.length, aliceSize, coverage]);
  expect(warning).toContain('rate limiting, proof-of-work, or OPRF-based PSI');
});

test('attack 3: reused α links exactly the elements that stayed put', async ({ page }) => {
  await page.locator('#tab-4').click();
  await page.locator('#e4-a3-run').click();
  await expect(page.locator('#e4-a3-output .result-box')).toBeVisible();

  const pairs = await infoPairs(page, '#e4-a3-output');
  const s1 = splitList(pairs.get('Session 1 set:')!);
  const s2 = splitList(pairs.get('Session 2 set:')!);
  const stable = firstInt(pairs.get('Stable elements (both sessions):')!);
  const added = firstInt(pairs.get('Elements added in session 2:')!);
  const removed = firstInt(pairs.get('Elements removed in session 2:')!);

  // The three change counters are recomputed from the two sets on screen, and
  // they partition each session's set.
  expect(stable).toBe(trueIntersection(s1, s2).length);
  expect(added).toBe(s2.filter((el) => !s1.includes(el)).length);
  expect(removed).toBe(s1.filter((el) => !s2.includes(el)).length);
  expect(stable + removed).toBe(s1.length);
  expect(stable + added).toBe(s2.length);

  // The leak itself: the number of byte-identical X_i Bob sees twice is the
  // number of elements that did not change — learned with zero plaintext.
  const [linked, ofTotal] = allInts(pairs.get('Byte-identical X_i seen in both sessions:')!);
  expect(linked).toBe(stable);
  expect(ofTotal).toBe(s1.length);
  expect(pairs.get("Bob infers Alice's set changed:")).toBe('✗ YES — privacy violation');
  expect(added + removed).toBeGreaterThan(0); // which is what makes that YES true

  // The samples row only exists when something was linked, and it shows at
  // most three of them.
  const sampleCell = pairs.get('Sample linked X_i (Bob sees twice):');
  expect(sampleCell !== undefined).toBe(linked! > 0);
  const samples = sampleCell === undefined ? [] : splitList(sampleCell);
  expect(samples).toHaveLength(Math.min(3, linked!));
  for (const s of samples) expect(s).toMatch(/^[0-9a-f]{16}…$/);

  // Both sessions still answered correctly, from their own set.
  for (const [key, set] of [['Session 1 intersection:', s1], ['Session 2 intersection:', s2]] as const) {
    const found = splitList(pairs.get(key)!).filter((x) => x !== '∅');
    expect(found.every((el) => (set as string[]).includes(el))).toBe(true);
  }

  const warning = await text(page, '#e4-a3-output .warning-box');
  expect(warning).toContain('LEAK');
  expect(allInts(warning)).toEqual([linked!, added, removed]);
  expect(warning).toContain('fresh random α per session — MANDATORY');
});

test('attack 4: every invalid encoding is rejected on the real receive path', async ({ page }) => {
  await page.locator('#tab-4').click();
  await page.locator('#e4-a4-run').click();
  await expect(page.locator('#e4-a4-output .probe-table')).toBeVisible();

  const rows = await page.$$eval('#e4-a4-output tbody tr:not(.probe-detail)', (trs) =>
    trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
  );
  const details = await texts(page, '#e4-a4-output tr.probe-detail td');
  expect(rows.length).toBeGreaterThanOrEqual(4);
  expect(details).toHaveLength(rows.length); // every probe states its consequence

  const byLabel = new Map(rows.map((r) => [r[0]!, r]));
  // The three encodings that are invalid by construction must be rejected by
  // isValidPoint AND by bobRound2 — the function a real session calls when X_i
  // arrives — not merely by the standalone check.
  for (const label of [
    'Identity element O (all-zero encoding)',
    'Non-canonical encoding (high bit set)',
    'Order-2 point (raw Curve25519 torsion)',
  ]) {
    const row = byLabel.get(label);
    expect(row, `missing probe: ${label}`).toBeDefined();
    expect(row![2]).toBe('✓ rejected');
    expect(row![3]).toBe('✓ rejected by validation');
    expect(row![1]).toMatch(/^[0-9a-f]{16}…[0-9a-f]{4}$/);
  }

  // The random-bytes probe is NOT invalid by construction — about 1 in 16
  // random strings really is a group element. Its two columns must agree with
  // each other, whichever way that run fell.
  const random = byLabel.get('Random 32 bytes (garbage)')!;
  expect(['✓ rejected', '✗ accepted']).toContain(random[2]);
  const randomAccepted = random[2] === '✗ accepted';
  expect(random[3]).toBe(randomAccepted ? '✗ multiplied by β' : '✓ rejected by validation');

  // The verdict is read off the protocol column, counts only the deterministic
  // probes, and reports the random one honestly either way.
  const verdict = await text(page, '#e4-a4-output .warning-box');
  expect(verdict).toMatch(/^All 3 invalid-by-construction encodings were rejected by psi\.ts's bobRound2/);
  expect(verdict).toContain('all 3 were caught by the explicit isValidPoint check');
  expect(verdict).toContain(
    randomAccepted
      ? 'happened to decode to a genuine group element this run'
      : 'The random-bytes probe was also rejected',
  );
  expect(verdict).not.toContain('WARNING');
  expect(verdict).toContain('The identity is the exception it does NOT cover');
});

test('attack 5: a lying OPRF Bob produces exactly the phantoms and omissions claimed', async ({ page }) => {
  await page.locator('#tab-4').click();
  await page.locator('#e4-a5-run').click();
  await expect(page.locator('#e4-a5-output .probe-table')).toBeVisible();

  const pairs = await infoPairs(page, '#e4-a5-output');
  const query = splitList(pairs.get("Alice's query A:")!);
  const real = splitList(pairs.get("Bob's real set B:")!);
  const phantoms = splitList(pairs.get('Phantom tags Bob adds:')!);
  const drops = splitList(pairs.get('Real tags Bob drops:')!);
  expect(phantoms.length).toBeGreaterThan(0);
  expect(drops.length).toBeGreaterThan(0);

  const rows = await page.$$eval('#e4-a5-output tbody tr', (trs) =>
    trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
  );
  expect(rows).toHaveLength(3);
  const parseSet = (cell: string): string[] => sorted(splitList(cell.replace(/[{}]/g, '')));

  // Each of the three published-set variants is recomputed from the four
  // plaintext rows above the table.
  const inflatedB = [...real, ...phantoms];
  const deflatedB = real.filter((el) => !drops.includes(el));
  const expectations: Array<[string, number, string[]]> = [
    ['Honest', new Set(real).size, trueIntersection(query, real)],
    ['Inflated F (added phantoms)', new Set(inflatedB).size, trueIntersection(query, inflatedB)],
    ['Deflated F (dropped real tags)', new Set(deflatedB).size, trueIntersection(query, deflatedB)],
  ];
  for (let i = 0; i < 3; i += 1) {
    const [label, fSize, intersection] = expectations[i]!;
    expect(rows[i]![0]).toBe(label);
    expect(Number(rows[i]![1])).toBe(fSize);
    expect(parseSet(rows[i]![2]!)).toEqual(sorted(intersection));
  }
  // Tampering with F is invisible in the transcript — both lying rows say so.
  expect(rows[0]![3]).toContain('N/A (baseline)');
  expect(rows[1]![3]).toContain('false positives indistinguishable');
  expect(rows[2]![3]).toContain('silent false negatives');

  // The warning's four numbers and two element sets are the same tamper.
  const honestIntersection = trueIntersection(query, real);
  const falsePositives = trueIntersection(query, phantoms);
  const falseNegatives = honestIntersection.filter((el) => drops.includes(el));
  const warning = await text(page, '#e4-a5-output .warning-box');
  expect(allInts(warning)).toEqual([
    new Set(real).size,
    honestIntersection.length,
    phantoms.length,
    falsePositives.length,
    drops.length,
    falseNegatives.length,
  ]);
  expect(warning).toContain(`{${falsePositives.join(', ')}}`);
  expect(warning).toContain(`{${falseNegatives.join(', ')}}`);
  expect(warning).toContain('OPRF-PSI provides NO integrity on F');
});

// --- Exhibit 5: self-test --------------------------------------------------

test('exhibit 5 gate tests all pass', async ({ page }) => {
  await page.locator('#tab-5').click();
  await expect(page.locator('#e5-selftest .card')).toBeVisible({ timeout: 15_000 });

  const statuses = await page.$$eval('#e5-selftest .status', (ns) =>
    ns.map((n) => [n.className, (n.textContent ?? '').trim()]),
  );
  expect(statuses.length).toBeGreaterThanOrEqual(4);
  for (const [cls, label] of statuses) {
    expect(cls, `failing gate test: ${label}`).toContain('status ok');
    expect(label!.startsWith('✓')).toBe(true);
  }
  await expect(page.locator('#e5-selftest .status.error')).toHaveCount(0);
});

// --- Exhibit 6: cryptographer's lab ---------------------------------------

/** The test-vector panel as label → hex. */
async function tvRows(page: Page): Promise<Map<string, string>> {
  const rows = await page.$$eval('#e6-tv-output .tv-row', (rs) =>
    rs.map((r) => [
      (r.querySelector('.tv-label')?.textContent ?? '').trim(),
      (r.querySelector('.tv-hex')?.textContent ?? '').trim(),
    ]),
  );
  return new Map(rows as Array<[string, string]>);
}

test('the canonical test vectors are self-consistent and imply the stated intersection', async ({ page }) => {
  await page.locator('#tab-6').click();
  await expect(page.locator('#e6-tv-output .card').first()).toBeVisible();

  const rows = await tvRows(page);
  const A = splitList(rows.get('A = {a_i}')!);
  const B = splitList(rows.get('B = {b_j}')!);
  expect(A).toHaveLength(3);
  expect(B).toHaveLength(3);

  // The scalars really are the seeds (both are far below the group order, so
  // scalarFromSeed reduces to the identity map).
  expect(rows.get('α (32 bytes, big-endian)')).toBe(rows.get('α seed'));
  expect(rows.get('β (32 bytes, big-endian)')).toBe(rows.get('β seed'));

  // H is a function of the element, not of which party holds it: the same email
  // hashes to the same point on both sides, distinct emails to distinct points.
  const hashOf = new Map<string, string>();
  for (const [label, hex] of rows) {
    const m = /^H\([ab]\d+\) — "(.+)"$/.exec(label);
    if (!m) continue;
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
    const prev = hashOf.get(m[1]!);
    if (prev !== undefined) expect(hex).toBe(prev);
    hashOf.set(m[1]!, hex);
  }
  expect(hashOf.size).toBe(new Set([...A, ...B]).size);
  expect(new Set(hashOf.values()).size).toBe(hashOf.size);

  const pick = (re: RegExp): string[] =>
    [...rows.entries()]
      .filter(([label]) => re.test(label))
      .sort((x, y) => Number(/_(\d+)/.exec(x[0])![1]) - Number(/_(\d+)/.exec(y[0])![1]))
      .map(([, hex]) => hex);
  const X = pick(/^X_\d+ = α·H\(a\d+\)$/);
  const Y = pick(/^Y_\d+ = β·X_\d+$/);
  const Z = pick(/^Z_\d+ = β·H\(b\d+\)$/);
  const W = pick(/^W_\d+ = α·Z_\d+$/);
  expect([X.length, Y.length, Z.length, W.length]).toEqual([A.length, A.length, B.length, B.length]);
  for (const hex of [...X, ...Y, ...Z, ...W]) expect(hex).toMatch(/^[0-9a-f]{64}$/);
  // Blinding is injective: no two elements collide inside one batch.
  for (const batch of [X, Y, Z, W]) expect(new Set(batch).size).toBe(batch.length);

  // The protocol's own matching rule, applied to the rendered bytes: a_i is in
  // the intersection iff Y_i appears among the W_j. That must be the plaintext
  // intersection of A and B, and the headline the panel prints.
  const wSet = new Set(W);
  const derived = A.filter((_el, i) => wSet.has(Y[i]!));
  expect(sorted(derived)).toEqual(sorted(trueIntersection(A, B)));
  expect(derived.length).toBeGreaterThan(0);
  const claim = await text(page, '#e6-tv-output .status');
  expect(claim).toContain(`Expected intersection: {${derived.join(', ')}}`);
  // …and nothing that is not in both sets sneaks in.
  for (const el of A.filter((x) => !B.includes(x))) expect(claim).not.toContain(el);

  // Recomputing is deterministic — that is the whole promise of a test vector.
  await page.locator('#e6-tv-run').click();
  expect([...(await tvRows(page)).entries()]).toEqual([...rows.entries()]);
});

test('the wire transcript is the same trace, and its byte counts add up', async ({ page }) => {
  await page.locator('#tab-6').click();
  await expect(page.locator('#e6-transcript .card').first()).toBeVisible();

  const rows = await tvRows(page);
  const lines = await page.$$eval('#e6-transcript .wire-line', (ls) =>
    ls.map((l) => [
      (l.querySelector('.wire-tag')?.textContent ?? '').trim(),
      (l.querySelector('.wire-hex')?.textContent ?? '').replace(/\s+/g, ''),
    ]),
  );
  // Every dumped point is the corresponding test-vector point, byte for byte.
  for (const [tag, hex] of lines) {
    const match = [...rows.entries()].find(([label]) => label.startsWith(`${tag} =`));
    expect(match, `no test-vector row for ${tag}`).toBeDefined();
    expect(hex).toBe(match![1]);
  }
  const tags = lines.map(([t]) => t);
  expect(tags.filter((t) => t!.startsWith('X_'))).toHaveLength(3);
  expect(tags.filter((t) => t!.startsWith('Y_'))).toHaveLength(3);
  expect(tags.filter((t) => t!.startsWith('Z_'))).toHaveLength(3);
  // W_j is Alice's LOCAL computation — it must never appear on the wire.
  expect(tags.filter((t) => t!.startsWith('W_'))).toHaveLength(0);

  // Each round's header states count × 32 B = total, and the two rounds sum to
  // the traffic figure and point count in the footer.
  const headers = await texts(page, '#e6-transcript .card-section-label');
  expect(headers).toHaveLength(2);
  let points = 0;
  let bytes = 0;
  for (const header of headers) {
    const m = /(\d+) × 32 B = ([\d,]+) B$/.exec(header);
    expect(m, `round header did not parse: ${header}`).not.toBeNull();
    const count = Number(m![1]);
    const total = Number(m![2]!.replace(/,/g, ''));
    expect(total).toBe(count * 32);
    points += count;
    bytes += total;
  }
  expect(points).toBe(lines.length);
  const footer = await text(page, '#e6-transcript .status');
  expect(allInts(footer)).toEqual([bytes, points]);
  expect(footer).toContain('O(n+m)');
});

test('the copied JSON is the trace the page is showing', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#tab-6').click();
  await expect(page.locator('#e6-tv-output .card').first()).toBeVisible();
  const rows = await tvRows(page);

  await page.locator('#e6-tv-copy').click();
  await expect(page.locator('#e6-tv-copy-status')).toHaveText(/^Copied [\d,]+ bytes\.$/);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(firstInt(await text(page, '#e6-tv-copy-status'))).toBe(copied.length);

  const json = JSON.parse(copied);
  expect(json.suite).toBe('PSI-GATE-v1');
  expect(json.group).toBe('ristretto255');
  expect(json.inputs.A).toEqual(splitList(rows.get('A = {a_i}')!));
  expect(json.inputs.B).toEqual(splitList(rows.get('B = {b_j}')!));
  expect(json.scalars.alpha).toBe(rows.get('α (32 bytes, big-endian)'));
  expect(json.scalars.beta).toBe(rows.get('β (32 bytes, big-endian)'));
  for (let i = 0; i < json.wire.X.length; i += 1) {
    expect(json.wire.X[i]).toBe(rows.get(`X_${i + 1} = α·H(a${i + 1})`));
    expect(json.wire.Y[i]).toBe(rows.get(`Y_${i + 1} = β·X_${i + 1}`));
  }
  for (let j = 0; j < json.wire.Z.length; j += 1) {
    expect(json.wire.Z[j]).toBe(rows.get(`Z_${j + 1} = β·H(b${j + 1})`));
    expect(json.local.W[j]).toBe(rows.get(`W_${j + 1} = α·Z_${j + 1}`));
  }
  expect(json.intersection).toEqual(sorted(trueIntersection(json.inputs.A, json.inputs.B)));

  // The confirmation is transient, not a stuck banner.
  await expect(page.locator('#e6-tv-copy-status')).toHaveText('', { timeout: 10_000 });
});

test('a blocked clipboard falls back and says so', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(msg.text()));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.reload();
  await page.locator('#tab-6').click();
  await expect(page.locator('#e6-tv-output .card').first()).toBeVisible();

  await page.locator('#e6-tv-copy').click();
  await expect(page.locator('#e6-tv-copy-status')).toHaveText('Clipboard blocked — see console for JSON.');
  // The data is not lost: the same trace goes to the console instead.
  const dumped = logs.find((l) => l.includes('PSI-GATE-v1'));
  expect(dumped, 'the JSON was not logged as the fallback promises').toBeDefined();
  expect(JSON.parse(dumped!).suite).toBe('PSI-GATE-v1');
});

test('the DDH sampler reaches the verdict its own statistic implies', async ({ page }) => {
  await page.locator('#tab-6').click();
  await page.locator('#e6-ddh-run').click();
  await expect(page.locator('#e6-ddh-output .ddh-chart')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('#e6-ddh-output .ddh-mini')).toHaveCount(2);
  await expect(page.locator('#e6-ddh-run')).toBeEnabled({ timeout: 90_000 });

  const pairs = await infoPairs(page, '#e6-ddh-output');
  const [count, perSample, observations] = allInts(pairs.get('Samples:')!) as [number, number, number];
  expect(count * perSample).toBe(observations);
  expect(perSample).toBe(30); // bytes 1–30; byte 0 and byte 31 are pinned by RFC 9496
  expect(pairs.get('α (fresh, this run):')).toMatch(/^[0-9a-f]{64}$/);

  const chi = Number(pairs.get('Chi-square statistic (df = 255):'));
  const [lo05, hi05] = pairs.get('α = 0.05 acceptance range (2.5–97.5%):')!.split('…').map(Number);
  const [lo01, hi01] = pairs.get('α = 0.01 acceptance range (0.5–99.5%):')!.split('…').map(Number);
  // The α = 0.05 band is the STRICTER test, so it lies strictly inside the
  // α = 0.01 band. (Regression: the ladder once had the pairs swapped, which
  // made its middle branch unreachable.)
  expect(lo01!).toBeLessThan(lo05!);
  expect(hi05!).toBeLessThan(hi01!);

  const verdict = page.locator('#e6-ddh-output .status').first();
  if (chi >= lo05! && chi <= hi05!) {
    await expect(verdict).toHaveClass(/status ok/);
    await expect(verdict).toContainText('cannot reject H₀ even at α = 0.05');
  } else if (chi >= lo01! && chi <= hi01!) {
    await expect(verdict).toHaveClass(/status warn/);
    await expect(verdict).toContainText('Rejected at α = 0.05, not rejected at α = 0.01');
  } else {
    await expect(verdict).toHaveClass(/status warn/);
    await expect(verdict).toContainText('Rejected at α = 0.01');
  }

  // The two RFC 9496 constraints are measured on this run, and hold: a
  // ristretto encoding's byte 0 is always even and its byte 31 never reaches
  // 0x80. Both counters must read zero out of the full sample.
  for (const key of ['Byte 0 odd (should be 0):', 'Byte 31 ≥ 0x80 (should be 0):']) {
    const [violations, outOf] = allInts(pairs.get(key)!) as [number, number];
    expect(violations).toBe(0);
    expect(outOf).toBe(count);
  }
  await expect(page.locator('#e6-ddh-output .info-value.private')).toHaveCount(0);
});

test('the benchmark table is arithmetically consistent with its own timings', async ({ page }) => {
  test.slow();
  await page.locator('#tab-6').click();
  await page.locator('#e6-bm-run').click();
  await expect(page.locator('#e6-bm-output .bench-table')).toBeVisible({ timeout: 180_000 });
  await expect(page.locator('#e6-bm-run')).toBeEnabled({ timeout: 180_000 });

  const rows = await page.$$eval('#e6-bm-output tbody tr', (trs) =>
    trs.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())),
  );
  const dataRows = rows.filter((r) => r.length === 5);
  expect(dataRows.length).toBeGreaterThanOrEqual(7); // 3 micro-benchmarks + 4 PSI sizes
  expect(rows.some((r) => r.length === 1 && r[0] === 'End-to-end DH-PSI (in worker)')).toBe(true);
  expect(dataRows.map((r) => r[0]).slice(0, 3)).toEqual(['hashToPoint', 'scalarMul', 'randomScalar']);

  for (const [name, iterCell, totalCell, perOpCell, throughputCell] of dataRows as string[][]) {
    const iter = firstInt(iterCell!);
    const totalMs = Number(totalCell!.replace(/[^\d.]/g, ''));
    const perOpUs = Number(perOpCell!.replace(/[^\d.]/g, ''));
    const throughput = Number(throughputCell!.replace(/[^\d.]/g, ''));
    expect(iter, name).toBeGreaterThan(0);
    expect(totalMs, name).toBeGreaterThan(0);

    // Per-op and throughput are not independent measurements — they are the
    // total and the iteration count, rearranged. Tolerance covers the 2-decimal
    // rounding the table applies before printing.
    const expectedPerOp = (totalMs * 1000) / iter;
    expect(Math.abs(perOpUs - expectedPerOp), `${name} per-op`).toBeLessThanOrEqual(
      Math.max(0.51, expectedPerOp * 0.02),
    );
    const expectedThroughput = iter / (totalMs / 1000);
    expect(Math.abs(throughput - expectedThroughput), `${name} throughput`).toBeLessThanOrEqual(
      Math.max(0.51, expectedThroughput * 0.02),
    );
  }

  // Cost is linear in the set sizes, so the 1000×1000 row cannot be cheaper per
  // op than the 10×10 one.
  const psiRows = dataRows.filter((r) => r[0]!.startsWith('PSI '));
  expect(psiRows.length).toBeGreaterThanOrEqual(2);
  const perOp = psiRows.map((r) => Number(r[3]!.replace(/[^\d.]/g, '')));
  for (let i = 1; i < perOp.length; i += 1) expect(perOp[i]!).toBeGreaterThan(perOp[i - 1]!);
});
