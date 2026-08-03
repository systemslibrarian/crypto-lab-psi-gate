import './style.css';
import {
  type PSITrace,
  runPSI,
  verifyCorrectness,
  tracePSI,
} from './psi.js';
import {
  hashToPoint,
  pointToHex,
  randomScalar,
  scalarFromSeed,
  scalarMul,
} from './group.js';
import {
  simulateSetSizeInflation,
  simulateDictionaryAttack,
  simulateReplayAttack,
  simulateMalformedPointInjection,
  simulateMaliciousOprfBob,
} from './attacks.js';
import { runOPRFPSI } from './oprf-psi.js';
import { callWorker, workerSupported } from './worker-client.js';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncateHex(h: string, n = 16): string {
  return h.slice(0, n) + '…';
}

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

function initThemeToggle(): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '☀ / ☾';
  btn.appendChild(icon);
  const updateLabel = (): void => {
    const current = document.documentElement.getAttribute('data-theme') ?? 'dark';
    const label = `Switch to ${current === 'dark' ? 'light' : 'dark'} theme`;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  };
  updateLabel();
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateLabel();
  });
  document.body.appendChild(btn);
}

// ---------------------------------------------------------------------------
// Tab routing (ARIA-compliant with keyboard navigation)
// ---------------------------------------------------------------------------

function initTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

  function activateTab(tab: HTMLButtonElement): void {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach((p) => p.classList.remove('active'));
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();
    const controls = tab.getAttribute('aria-controls');
    if (controls) document.getElementById(controls)?.classList.add('active');
  }

  tabs.forEach((btn, i) => {
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', (e: KeyboardEvent) => {
      let next = -1;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== -1) { e.preventDefault(); activateTab(tabs[next]!); }
    });
  });
}

// ---------------------------------------------------------------------------
// Exhibit 1 — Contact Discovery Problem
// ---------------------------------------------------------------------------

function initExhibit1(): void {
  const runBtn = document.getElementById('e1-run') as HTMLButtonElement;
  const aliceList = document.getElementById('e1-alice-list') as HTMLUListElement;
  const bobList = document.getElementById('e1-bob-list') as HTMLUListElement;
  const output = document.getElementById('e1-output') as HTMLDivElement;

  const aliceContacts = [
    'prayer.partner@example.com',
    'mom@gmail.com',
    'friend.alex@email.com',
    'pastor.john@church.org',
    'colleague@work.com',
    'neighbor.smith@example.com',
    'sister.mary@example.com',
    'youth.leader@church.org',
  ];

  const serverUsers = [
    'prayer.partner@example.com',
    'friend.alex@email.com',
    'youth.leader@church.org',
    'random.user1@example.com',
    'random.user2@example.com',
    'another.user@example.com',
    'pastor.john@church.org',
  ];

  // Render initial lists.
  //
  // Both columns are printed in full, which is the OMNISCIENT view: you are
  // the lab operator, not a participant. Alice never sees the server column
  // and the server never sees Alice's. The labels below say so, because
  // "neither party learned anything else" printed under a visible plaintext
  // database is otherwise a claim the page appears to contradict on screen.
  aliceList.innerHTML = aliceContacts
    .map((c) => `<li class="no-match">${esc(c)}</li>`)
    .join('');
  bobList.innerHTML = serverUsers
    .map((u) => `<li class="no-match">${esc(u)}</li>`)
    .join('');

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running PSI…</span> Running PSI…';

    // Defer to allow UI to update
    setTimeout(() => {
      const result = runPSI(aliceContacts, serverUsers);
      const intersectionSet = new Set(result.intersection);

      // Update Alice's list
      aliceList.innerHTML = aliceContacts
        .map((c) => {
          const cls = intersectionSet.has(c) ? 'match' : 'no-match';
          return `<li class="${cls}">${esc(c)}</li>`;
        })
        .join('');

      output.innerHTML = `
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Intersection found:</span>
            <span class="info-value match">${result.intersectionSize} contact(s)</span>
            <span class="info-label">Alice's contacts:</span>
            <span class="info-value alice">${aliceContacts.length} (server never saw them)</span>
            <span class="info-label">Server database:</span>
            <span class="info-value bob">${serverUsers.length} users (Alice never downloaded it)</span>
          </div>
          <div style="margin-top:0.75rem">
            ${result.intersection.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')}
          </div>
          <div class="status ok" style="margin-top:0.75rem">
            ✓ PSI complete — only matching contacts revealed. Neither party learned
            anything else <em>from the protocol</em>.
          </div>
          <div class="status info" style="margin-top:0.5rem">
            <strong>Omniscient view.</strong> Both lists are printed above because you are
            outside the protocol, holding both sides' inputs. Alice sees only her own
            contacts plus the ${result.intersectionSize} match(es) and the count
            ${result.aliceLearnedBobSize}; the server sees only its own users plus the count
            ${result.bobLearnedAliceSize}. The
            ${serverUsers.length - result.intersectionSize} server users and
            ${aliceContacts.length - result.intersectionSize} contacts that did not match
            are on your screen and on nobody else's.
          </div>
        </div>`;

      runBtn.disabled = false;
      runBtn.textContent = 'Run PSI Again';
    }, 50);
  });
}

// ---------------------------------------------------------------------------
// Exhibit 2 — Protocol Walkthrough
// ---------------------------------------------------------------------------

// Each walkthrough element gets a STABLE visual identity — an icon + a color —
// that it carries through every stage of blinding. The whole point of PSI is
// that a matched element ends up as the SAME curve point under both blinding
// orders; a persistent chip lets the learner literally watch that happen
// instead of reading it in prose. bob@example.com is the shared element, so it
// is given the same identity in Alice's and Bob's sets.
interface E2Identity {
  icon: string;
  hue: number; // HSL hue for the chip's identity ring
  label: string; // short human label
}

const E2_IDENTITY: Record<string, E2Identity> = {
  'alice@example.com': { icon: '🅰', hue: 205, label: 'alice' },
  'mom@gmail.com': { icon: '🌷', hue: 330, label: 'mom' },
  'bob@example.com': { icon: '🤝', hue: 145, label: 'bob (shared)' },
  'charlie@example.com': { icon: '🎲', hue: 30, label: 'charlie' },
  'dave@example.com': { icon: '🚲', hue: 265, label: 'dave' },
};

function e2Identity(el: string): E2Identity {
  return E2_IDENTITY[el] ?? { icon: '•', hue: 0, label: el };
}

// A chip that renders one element at a given protocol stage: it shows the
// stable identity (icon + email) AND the actual bytes of the curve point at
// this stage, so the learner sees one underlying value flow through H -> αH ->
// βαH. `matched` snaps it green to mark the byte-identical convergence.
function e2Chip(
  el: string,
  stageLabel: string,
  hex: string,
  opts: { matched?: boolean; muted?: boolean } = {}
): string {
  const id = e2Identity(el);
  const cls = ['e2-chip'];
  if (opts.matched) cls.push('matched');
  if (opts.muted) cls.push('muted');
  const ring = opts.matched ? 'var(--match)' : `hsl(${id.hue} 70% 60%)`;
  return `
    <div class="${cls.join(' ')}" style="--chip-ring:${ring}"
      title="${esc(stageLabel)} of ${esc(el)} — same underlying element at every stage">
      <span class="e2-chip-icon" aria-hidden="true">${id.icon}</span>
      <span class="e2-chip-body">
        <span class="e2-chip-name">${esc(el)}</span>
        <span class="e2-chip-hex" aria-hidden="true">${esc(stageLabel)} = ${truncateHex(hex, 12)}</span>
      </span>
    </div>`;
}

function initExhibit2(): void {
  const aliceSet = ['alice@example.com', 'mom@gmail.com', 'bob@example.com'];
  const bobSet = ['bob@example.com', 'charlie@example.com', 'dave@example.com'];

  // Fresh random scalars, generated ONCE for the whole walkthrough so an
  // element's identity is stable as you step forward/back. Real scalar-mul on
  // real ristretto255 points — nothing is faked. We use the deterministic,
  // no-shuffle trace so a_i and b_j stay index-aligned to their chips; the
  // shuffle is a privacy measure the learner already met in Exhibit 1, and
  // hiding it here is what lets the two blinding PATHS be shown side by side.
  let alpha = randomScalar();
  let beta = randomScalar();

  let step = 0;
  const panel = document.getElementById('e2-panel') as HTMLDivElement;
  const prevBtn = document.getElementById('e2-prev') as HTMLButtonElement;
  const nextBtn = document.getElementById('e2-next') as HTMLButtonElement;
  const stepCounter = document.getElementById('e2-step') as HTMLSpanElement;

  const trace = (): ReturnType<typeof tracePSI> => tracePSI(aliceSet, bobSet, alpha, beta);

  const legend = `
    <div class="e2-legend" role="group" aria-label="Colour key for blinding stages">
      <span class="e2-legend-title">Key:</span>
      <span class="e2-legend-item"><span class="e2-swatch plain" aria-hidden="true"></span>plaintext email</span>
      <span class="e2-legend-item"><span class="e2-swatch hx" aria-hidden="true"></span>H(x): point on the curve</span>
      <span class="e2-legend-item"><span class="e2-swatch single" aria-hidden="true"></span>single-blinded (one lock)</span>
      <span class="e2-legend-item"><span class="e2-swatch double" aria-hidden="true"></span>double-blinded (two locks)</span>
      <span class="e2-legend-item"><span class="e2-swatch match" aria-hidden="true"></span>byte-identical match</span>
    </div>`;

  const steps: Array<() => string> = [
    // Step 0 — Plain-language primer: "blinding as a padlock"
    () => `
      <h3><span class="step-counter" aria-hidden="true">0</span>First, the whole idea in 30 seconds</h3>
      <div class="e2-primer">
        <p>
          Alice and Bob each have a list of emails. They want to find the emails
          they <em>share</em> — without either one handing over their list. Here
          is the trick, in plain language:
        </p>
        <ol class="e2-primer-steps">
          <li>
            <strong>Turn each email into a point.</strong> A function
            <code>H(x)</code> ("hash-to-curve") turns any email into a fixed dot
            on a mathematical curve — a
            <span class="e2-term">group point<span class="e2-term-def">one element of the ristretto255 group; think "a specific dot on a curve"</span></span>.
            The same email always lands on the same dot; a different email lands
            somewhere unpredictable.
          </li>
          <li>
            <strong>Lock the point in a box.</strong> Multiplying a point by your
            secret
            <span class="e2-term">scalar<span class="e2-term-def">a secret number you multiply a point by; here α for Alice, β for Bob</span></span>
            (Alice's α, Bob's β) scrambles it into a new random-looking point.
            Only that scalar can undo it — like a padlock only your key opens.
            Nobody can read the email from a locked box.
          </li>
          <li>
            <strong>Both people lock, in either order.</strong> If Alice locks
            then Bob locks (β·α·H(x)), you get the <em>same box</em> as Bob
            locking then Alice locking (α·β·H(x)). Order doesn't matter — that
            property is called being
            <span class="e2-term">commutative<span class="e2-term-def">α·β = β·α, so the two locking orders produce the identical result</span></span>.
          </li>
        </ol>
        <p class="e2-primer-punch">
          So for an email <strong>both</strong> people have, the two locking
          orders land on the <strong>exact same</strong> doubly-locked point —
          byte-for-byte identical. For an email only one person has, they never
          converge. <strong>That single fact is all of PSI.</strong> The next
          steps let you watch it happen.
        </p>
      </div>
      <div class="status info" style="margin-top:1rem">
        Under the hood: group is ristretto255 (prime-order, and "DDH-hard" — the
        locked boxes are provably unlinkable). Hash-to-curve follows RFC 9380.
        You don't need those names to follow along; they're the honest details
        for anyone who wants them.
      </div>`,

    // Step 1 — Setup
    () => `
      <h3><span class="step-counter" aria-hidden="true">1</span>Setup — two lists, one shared email</h3>
      <p>Each email gets a stable icon + colour so you can follow it through every stage.</p>
      <div class="card-row">
        <div>
          <div class="set-label alice">Alice's Set A</div>
          <div class="e2-chip-list">
            ${aliceSet.map((el) => e2Chip(el, 'email', el.split('@')[0]!)).join('')}
          </div>
        </div>
        <div>
          <div class="set-label bob">Bob's Set B</div>
          <div class="e2-chip-list">
            ${bobSet.map((el) => e2Chip(el, 'email', el.split('@')[0]!)).join('')}
          </div>
        </div>
      </div>
      ${legend}
      <div class="status info" style="margin-top:1rem">
        Only <strong>🤝 bob@example.com</strong> is in both lists — watch that
        chip specifically. By the last step its two independently-locked forms
        must become the same point; everyone else's stays random.
      </div>`,

    // Step 2 — H(x): emails become curve points
    () => {
      const t = trace();
      return `
        <h3><span class="step-counter" aria-hidden="true">2</span>Step 1 of the lock: H(x) — email → point on the curve</h3>
        <p>Before any locking, each email is hashed to a curve point with <code>H(x)</code>. Same email ⇒ same point, so 🤝 bob lands on the <em>same</em> dot in both lists (identical hex below).</p>
        <div class="card-row">
          <div>
            <div class="set-label alice">Alice: H(a_i)</div>
            <div class="e2-chip-list">
              ${aliceSet.map((el, i) => e2Chip(el, 'H(x)', pointToHex(t.hashedAlice[i]!))).join('')}
            </div>
          </div>
          <div>
            <div class="set-label bob">Bob: H(b_j)</div>
            <div class="e2-chip-list">
              ${bobSet.map((el, j) => e2Chip(el, 'H(x)', pointToHex(t.hashedBob[j]!))).join('')}
            </div>
          </div>
        </div>
        ${legend}
        <div class="status info">These H(x) points are never sent on the wire — they'd reveal the emails to anyone who can also compute H. Locking comes next.</div>`;
    },

    // Step 3 — Alice locks (α), Bob locks his own (β)
    () => {
      const t = trace();
      const scalarHex = pointToHex(alpha);
      const bScalarHex = pointToHex(beta);
      return `
        <h3><span class="step-counter" aria-hidden="true">3</span>Each party puts on their own lock</h3>
        <p>Alice multiplies each of her points by her secret α → <code>X_i = α·H(a_i)</code>. Bob does the same with his secret β → <code>Z_j = β·H(b_j)</code>. Each is now single-locked and random-looking.</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">α (Alice's secret, NEVER sent):</span>
            <button type="button" class="scalar-btn" aria-pressed="false"
              aria-label="Reveal Alice's private scalar α (currently hidden — click to toggle)">
              <span data-hex aria-hidden="true">${scalarHex}</span>
            </button>
            <span class="info-label">β (Bob's secret, NEVER sent):</span>
            <button type="button" class="scalar-btn" aria-pressed="false"
              aria-label="Reveal Bob's private scalar β (currently hidden — click to toggle)">
              <span data-hex aria-hidden="true">${bScalarHex}</span>
            </button>
          </div>
        </div>
        <div class="card-row" style="margin-top:0.75rem">
          <div>
            <div class="set-label" style="color:var(--blinded)">Alice sends X_i = α·H(a_i) → Bob</div>
            <div class="e2-chip-list single">
              ${aliceSet.map((el, i) => e2Chip(el, 'α·H(x)', pointToHex(t.wireA2B_X[i]!))).join('')}
            </div>
          </div>
          <div>
            <div class="set-label" style="color:var(--blinded)">Bob sends Z_j = β·H(b_j) → Alice</div>
            <div class="e2-chip-list single">
              ${bobSet.map((el, j) => e2Chip(el, 'β·H(x)', pointToHex(t.wireB2A_Z[j]!))).join('')}
            </div>
          </div>
        </div>
        ${legend}
        <div class="status info">Notice 🤝 bob's hex is now <em>different</em> on each side: α·H(bob) ≠ β·H(bob). One lock each is not enough to match — both locks must go on.</div>`;
    },

    // Step 4 — Second lock: the two paths converge (the "aha")
    () => {
      const t = trace();
      // Path 1 (Alice's element): X went to Bob, Bob locks β on top → Y = β·α·H
      // Path 2 (Bob's element):   Z came to Alice, Alice locks α on top → W = α·β·H
      const bobIdxA = aliceSet.indexOf('bob@example.com');
      const bobIdxB = bobSet.indexOf('bob@example.com');
      const yBob = pointToHex(t.wireB2A_Y[bobIdxA]!);
      const wBob = pointToHex(t.computedW[bobIdxB]!);
      const identical = yBob === wBob;
      return `
        <h3><span class="step-counter" aria-hidden="true">4</span>The second lock — the two paths collide ✨</h3>
        <p>Now each party adds the <em>other's</em> lock on top:</p>
        <div class="e2-paths">
          <div class="e2-path">
            <div class="e2-path-title">Path A — Alice's element, Bob locks second</div>
            <div class="e2-chip-list double">
              ${aliceSet.map((el, i) => e2Chip(
                el,
                'β·(α·H)',
                pointToHex(t.wireB2A_Y[i]!),
                { matched: el === 'bob@example.com' }
              )).join('')}
            </div>
            <div class="e2-path-formula">Y_i = β·(α·H(a_i)) = <strong>βα</strong>·H</div>
          </div>
          <div class="e2-path">
            <div class="e2-path-title">Path B — Bob's element, Alice locks second</div>
            <div class="e2-chip-list double">
              ${bobSet.map((el, j) => e2Chip(
                el,
                'α·(β·H)',
                pointToHex(t.computedW[j]!),
                { matched: el === 'bob@example.com' }
              )).join('')}
            </div>
            <div class="e2-path-formula">W_j = α·(β·H(b_j)) = <strong>αβ</strong>·H</div>
          </div>
        </div>
        <div class="${identical ? 'e2-snap ok' : 'e2-snap bad'}" role="status">
          <div class="e2-snap-head">
            <span aria-hidden="true">🤝</span>
            ${identical
              ? 'These two hex strings are BYTE-IDENTICAL — the match:'
              : 'Convergence failed (should not happen):'}
          </div>
          <div class="e2-snap-hex">
            <span>Path A (βα·H(bob)): <code>${esc(truncateHex(yBob, 24))}</code></span>
            <span>Path B (αβ·H(bob)): <code>${esc(truncateHex(wBob, 24))}</code></span>
          </div>
          <p class="e2-snap-note">
            Because αβ = βα (commutative), locking in either order lands on the
            <strong>same</strong> point. Only 🤝 bob — the shared email — snaps
            together. charlie, dave, alice, mom never appear in both paths, so
            they never collide. <strong>That collision IS the intersection.</strong>
          </p>
        </div>
        ${legend}`;
    },

    // Step 5 — Match + what each side learns
    () => {
      const t = trace();
      // Match honestly against this walkthrough's own trace: a_i is shared iff
      // its double-locked form Y_i appears among Bob's double-locked W_j.
      const wSet = new Set(t.computedW.map(pointToHex));
      const matched = aliceSet.filter((_el, i) => wSet.has(pointToHex(t.wireB2A_Y[i]!)));
      const check = verifyCorrectness(aliceSet, bobSet, {
        intersection: matched,
        intersectionSize: matched.length,
        aliceLearnedBobSize: bobSet.length,
        bobLearnedAliceSize: aliceSet.length,
      });
      return `
        <h3><span class="step-counter" aria-hidden="true">5</span>Read off the answer — and check it's honest</h3>
        <p>Alice collects every one of her elements whose double-locked form appears in Bob's double-locked set. Those, and only those, are the shared emails.</p>
        <div class="status ok">
          Intersection (chips that snapped together):
          ${matched.length > 0
            ? matched.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')
            : '<span style="color:var(--text-muted)">∅ (empty)</span>'}
        </div>
        <div class="card" style="margin-top:0.75rem">
          <div class="info-grid">
            <span class="info-label">Plain-text intersection (verifier check):</span>
            <span class="info-value match">${check.expected.join(', ') || '∅'}</span>
            <span class="info-label">PSI result:</span>
            <span class="info-value match">${check.actual.join(', ') || '∅'}</span>
            <span class="info-label">Correct:</span>
            <span class="info-value ${check.matches ? 'match' : 'private'}">${check.matches ? '✓ YES' : '✗ NO'}</span>
          </div>
        </div>
        <div class="info-grid" style="margin-top:0.75rem">
          <span class="info-label">Alice learned:</span>
          <span class="info-value match">the intersection + Bob's set size (${bobSet.length})</span>
          <span class="info-label">Bob learned:</span>
          <span class="info-value bob">Alice's set size (${aliceSet.length})</span>
          <span class="info-label">Neither learned:</span>
          <span class="info-value">the other's non-matching emails</span>
        </div>
        <div class="status info" style="margin-top:0.75rem">
          The verifier check just confirms the math; it is not part of the
          protocol and not a security feature. Try Exhibit 3 to run this on your
          own lists.
        </div>`;
    },
  ];

  function render(): void {
    panel.innerHTML = steps[step]!();
    stepCounter.textContent = `Step ${step + 1} / ${steps.length}`;
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === steps.length - 1;
  }

  prevBtn.addEventListener('click', () => { if (step > 0) { step--; render(); } });
  nextBtn.addEventListener('click', () => { if (step < steps.length - 1) { step++; render(); } });

  render();
}

// ---------------------------------------------------------------------------
// Exhibit 3 — Live Simulator
// ---------------------------------------------------------------------------

function initExhibit3(): void {
  const aliceTa = document.getElementById('e3-alice') as HTMLTextAreaElement;
  const bobTa = document.getElementById('e3-bob') as HTMLTextAreaElement;
  const runBtn = document.getElementById('e3-run') as HTMLButtonElement;
  const output = document.getElementById('e3-output') as HTMLDivElement;

  aliceTa.value = [
    'alice.friend@gmail.com',
    'workmate@example.com',
    'mom@example.com',
    'pastor@church.org',
    'neighbor@example.com',
    'prayer.circle@example.com',
    'book.club@example.com',
    'cousin@example.com',
    'mentor@example.com',
    'colleague.bob@work.com',
  ].join('\n');

  bobTa.value = [
    'alice.friend@gmail.com',
    'workmate@example.com',
    'pastor@church.org',
    'prayer.circle@example.com',
    'random.server.user1@example.com',
    'random.server.user2@example.com',
    'another.user@example.com',
    'server.only@example.com',
    'database.user@example.com',
    'app.user@example.com',
  ].join('\n');

  // Per-run cancellation: a fresh click supersedes any run still in flight so
  // rapid re-clicks (or a huge pasted set) can't queue up behind each other.
  let inFlight: AbortController | null = null;

  // Both runPSI and runOPRFPSI return this shape; the worker echoes it back.
  type SimResult = {
    intersection: string[];
    intersectionSize: number;
    aliceLearnedBobSize: number;
    bobLearnedAliceSize: number;
  };

  // Cap the alignment grid so it stays a mental-model builder, not a wall of
  // hex (and so the extra main-thread trace stays instant). Above this, the
  // final-intersection view is enough.
  const ALIGN_MAX = 12;

  // Build the "watch the match happen" alignment grid from the trace of the
  // run whose result is displayed above it. The learner is told to compare
  // these hex values byte-for-byte, so they have to belong to the SAME
  // execution — an earlier version called tracePSI here with its own fresh
  // scalars, producing a second, unrelated run whose hex the learner was
  // invited to reconcile with the first one's verdict.
  //
  // The trace is real ristretto scalar-mul throughout; the one thing it drops
  // is the shuffle, so rows line up with plaintext. That is a privacy measure
  // against the counterparty, and here the learner IS the trusted observer.
  function alignmentGrid(aliceSet: string[], bobSet: string[], t: PSITrace): string {
    const yHex = t.wireB2A_Y.map(pointToHex);
    const wHex = t.computedW.map(pointToHex);
    const wSet = new Set(wHex);
    const ySet = new Set(yHex);
    const aliceRows = aliceSet
      .map((el, i) => ({ el, hex: yHex[i]!, matched: wSet.has(yHex[i]!) }))
      .sort((a, b) => Number(b.matched) - Number(a.matched));
    const bobRows = bobSet
      .map((el, j) => ({ el, hex: wHex[j]!, matched: ySet.has(wHex[j]!) }))
      .sort((a, b) => Number(b.matched) - Number(a.matched));
    const row = (r: { el: string; hex: string; matched: boolean }): string => `
      <li class="align-row${r.matched ? ' matched' : ''}">
        ${r.matched ? '<span class="align-tick" aria-hidden="true">✓</span>' : '<span class="align-tick empty" aria-hidden="true"></span>'}
        <span class="align-hex">${esc(truncateHex(r.hex, 16))}</span>
        <span class="align-plain" hidden>${esc(r.el)}</span>
      </li>`;
    return `
      <div class="card align-card" style="margin-top:0.75rem">
        <div class="align-head">
          <div style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">
            Watch the match: double-blinded values side by side
          </div>
          <button type="button" id="e3-reveal" class="btn" aria-pressed="false">Reveal plaintext</button>
        </div>
        <p style="font-size:0.82rem;color:var(--text-muted);margin:0.25rem 0 0.75rem">
          Alice's Y_i = βα·H(a_i) beside Bob's W_j = αβ·H(b_j). A row is marked
          ✓ when its bytes appear on both sides — that byte-identical collision
          is exactly what the protocol matches on. Everything else stays random.
          These are the values from the run reported above — same α, same β, same
          points — with only the shuffle omitted so each row still lines up with
          its plaintext for you.
        </p>
        <div class="align-grid">
          <div>
            <div class="set-label alice">Alice: Y_i (βα·H)</div>
            <ul class="align-list" tabindex="0" role="region" aria-label="Alice's double-blinded values">
              ${aliceRows.map(row).join('')}
            </ul>
          </div>
          <div>
            <div class="set-label bob">Bob: W_j (αβ·H)</div>
            <ul class="align-list" tabindex="0" role="region" aria-label="Bob's double-blinded values">
              ${bobRows.map(row).join('')}
            </ul>
          </div>
        </div>
        <p class="align-legend"><span class="align-tick" aria-hidden="true">✓</span> = byte-identical on both sides = in the intersection.</p>
      </div>`;
  }

  runBtn.addEventListener('click', async () => {
    const aliceSet = aliceTa.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const bobSet = bobTa.value.split('\n').map((s) => s.trim()).filter(Boolean);

    if (aliceSet.length === 0 || bobSet.length === 0) {
      output.innerHTML = '<div class="status error">Both sets must be non-empty.</div>';
      return;
    }

    const proto =
      (document.querySelector<HTMLInputElement>(
        'input[name="e3-proto"]:checked'
      )?.value ?? 'dh') === 'oprf'
        ? 'oprf'
        : 'dh';
    const protoLabel = proto === 'oprf' ? 'OPRF-PSI (Jarecki-Liu)' : 'DH-PSI (Meadows)';

    // Supersede any earlier run before starting this one.
    inFlight?.abort();
    const ctrl = new AbortController();
    inFlight = ctrl;

    // Small DH runs are traced on the main thread so the result panel and the
    // alignment grid below it describe ONE execution. At these sizes (≤ 12 × 12)
    // the scalar-mul work is a few milliseconds, so there is nothing to offload.
    const traced = proto === 'dh' && aliceSet.length <= ALIGN_MAX && bobSet.length <= ALIGN_MAX;

    const onWorker = workerSupported() && !traced;
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running…</span> Running…';
    output.innerHTML = `<div class="status info" role="status">Running ${protoLabel} (${aliceSet.length} × ${bobSet.length} elements)${onWorker ? ' in a Web Worker — UI stays responsive' : ''}…</div>`;

    let result: SimResult;
    let trace: PSITrace | null = null;
    try {
      if (traced) {
        // Yield a macrotask so the spinner paints before the synchronous work.
        await new Promise((r) => setTimeout(r, 0));
        if (ctrl.signal.aborted || inFlight !== ctrl) return;
        trace = tracePSI(aliceSet, bobSet, randomScalar(), randomScalar());
        result = {
          intersection: trace.intersection,
          intersectionSize: trace.intersection.length,
          aliceLearnedBobSize: trace.wireB2A_Z.length,
          bobLearnedAliceSize: trace.wireA2B_X.length,
        };
      } else if (onWorker) {
        // Offload the O(n+m) scalar-mul work to the worker so the main thread —
        // and the page — stay responsive even for large pasted sets.
        result = await callWorker<SimResult>(
          proto === 'oprf' ? 'oprf' : 'psi',
          { aliceSet, bobSet },
          { signal: ctrl.signal }
        );
      } else {
        // No Worker support: run on the main thread, but first yield a macrotask
        // so the browser paints the spinner / announces the aria-live status
        // before the synchronous scalar-mul work blocks the thread.
        await new Promise((r) => setTimeout(r, 0));
        if (ctrl.signal.aborted || inFlight !== ctrl) return;
        result = proto === 'oprf' ? runOPRFPSI(aliceSet, bobSet) : runPSI(aliceSet, bobSet);
      }
    } catch (err) {
      // A newer run aborted this one — let the newer run own the UI.
      if (err instanceof Error && err.name === 'AbortError') return;
      output.innerHTML = `<div class="status error">PSI failed: ${esc(err instanceof Error ? err.message : String(err))}</div>`;
      if (inFlight === ctrl) { inFlight = null; runBtn.disabled = false; runBtn.textContent = 'Run PSI'; }
      return;
    }

    // Guard against a race where this run was superseded after resolving.
    if (ctrl.signal.aborted || inFlight !== ctrl) return;

    {
      const check = verifyCorrectness(aliceSet, bobSet, result);

      output.innerHTML = `
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Alice's elements:</span>
            <span class="info-value alice">${aliceSet.length}</span>
            <span class="info-label">Bob's elements:</span>
            <span class="info-value bob">${bobSet.length}</span>
            <span class="info-label">Intersection size:</span>
            <span class="info-value match">${result.intersectionSize}</span>
            <span class="info-label">Correct (verified):</span>
            <span class="info-value ${check.matches ? 'match' : 'private'}">${check.matches ? '✓' : '✗'}</span>
          </div>
          <div style="margin-top:0.75rem">
            ${result.intersection.length > 0
              ? result.intersection.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')
              : '<div class="status info">∅ Empty intersection — no common elements.</div>'}
          </div>
        </div>
        <div class="card" style="margin-top:0.75rem">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">What each party learned</div>
          <div class="info-grid">
            <span class="info-label">Alice learned:</span>
            <span class="info-value match">The intersection (${result.intersectionSize} elements) + Bob's set size (${result.aliceLearnedBobSize})</span>
            <span class="info-label">Bob learned:</span>
            <span class="info-value bob">Alice's set size (${result.bobLearnedAliceSize})</span>
            <span class="info-label">Neither learned:</span>
            <span class="info-value">Alice's ${aliceSet.length - result.intersectionSize} non-matching elements; Bob's ${bobSet.length - result.intersectionSize} non-matching elements</span>
          </div>
        </div>
        ${
          trace !== null
            ? alignmentGrid(aliceSet, bobSet, trace)
            : proto === 'oprf'
              ? '<div class="status info" style="margin-top:0.75rem">The side-by-side alignment grid is shown for the DH-PSI protocol (two double-blinded columns). OPRF-PSI matches a single column of PRF tags instead — switch to DH-PSI above to watch the two columns converge.</div>'
              : `<div class="status info" style="margin-top:0.75rem">The alignment grid renders for sets up to ${ALIGN_MAX} elements each so it stays readable — trim your lists to watch the match row-by-row.</div>`
        }`;

      // Wire the reveal/hide-plaintext toggle for the alignment grid (if shown).
      const revealBtn = document.getElementById('e3-reveal') as HTMLButtonElement | null;
      if (revealBtn) {
        revealBtn.addEventListener('click', () => {
          const showing = revealBtn.getAttribute('aria-pressed') === 'true';
          const next = !showing;
          revealBtn.setAttribute('aria-pressed', String(next));
          revealBtn.textContent = next ? 'Hide plaintext' : 'Reveal plaintext';
          output.querySelectorAll<HTMLElement>('.align-plain').forEach((el) => {
            el.hidden = !next;
          });
          output.querySelectorAll<HTMLElement>('.align-hex').forEach((el) => {
            el.hidden = next;
          });
        });
      }

      inFlight = null;
      runBtn.disabled = false;
      runBtn.textContent = 'Run PSI';
    }
  });

  // Editing either set — or switching protocol — retracts the previous verdict.
  // The result panel names concrete set sizes, prints "Correct (verified) ✓",
  // and the alignment grid under it invites a byte-for-byte comparison; every
  // one of those was computed from the inputs as they stood at click time.
  // Left standing over edited inputs it is a verdict about a run the page is no
  // longer describing — "Alice's elements: 10" above a box holding one line.
  const retractResult = (): void => {
    if (output.innerHTML === '') return;
    // Supersede any run still in flight. An aborted run deliberately returns
    // early so it cannot paint over newer state, which also means it never
    // re-enables the button — so hand the control back here, or a run cancelled
    // by a keystroke would leave "Run PSI" permanently disabled.
    inFlight?.abort();
    inFlight = null;
    output.innerHTML = '';
    runBtn.disabled = false;
    runBtn.textContent = 'Run PSI';
  };
  aliceTa.addEventListener('input', retractResult);
  bobTa.addEventListener('input', retractResult);
  document
    .querySelectorAll<HTMLInputElement>('input[name="e3-proto"]')
    .forEach((radio) => radio.addEventListener('change', retractResult));
}

// Note (Exhibit 3 protocol picker): the radio inputs live in the HTML
// template below; the handler above reads them at click time.

// ---------------------------------------------------------------------------
// Exhibit 4 — Attack Demos
// ---------------------------------------------------------------------------

function initExhibit4(): void {
  // --- Attack 1: Set Size Inflation ---
  const a1Btn = document.getElementById('e4-a1-run') as HTMLButtonElement;
  const a1Output = document.getElementById('e4-a1-output') as HTMLDivElement;

  a1Btn.addEventListener('click', () => {
    const aliceSet = ['alice@example.com', 'mom@example.com', 'pastor@church.org'];
    const bobReal = ['alice@example.com', 'real.user@example.com'];
    // Bob inflates with junk entries
    const junk = Array.from({ length: 20 }, (_, i) => `fake.user.${i}@attacker.com`);
    const bobInflated = [...bobReal, ...junk];

    const result = simulateSetSizeInflation(aliceSet, bobReal, bobInflated);
    a1Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice sees Bob's set size as:</span>
          <span class="info-value warning">${result.aliceSeesBobSize} (inflated)</span>
          <span class="info-label">Bob's actual set size:</span>
          <span class="info-value bob">${result.actualBobSize}</span>
          <span class="info-label">Inflation delta:</span>
          <span class="info-value warning">+${result.inflationDelta} fake entries</span>
          <span class="info-label">Intersection (still correct):</span>
          <span class="info-value match">${result.intersection.join(', ') || '∅'}</span>
        </div>
        <div class="warning-box">
          Bob can claim any size without Alice knowing. Set size hiding requires
          padding, polynomial commitment, or size-preserving protocols (PaXoS, CM20).
        </div>
      </div>`;
  });

  // --- Attack 2: Dictionary Attack ---
  const a2Btn = document.getElementById('e4-a2-run') as HTMLButtonElement;
  const a2Output = document.getElementById('e4-a2-output') as HTMLDivElement;

  a2Btn.addEventListener('click', () => {
    // Alice's set is from a small domain — 4-digit PINs (Alice uses only 3)
    const aliceSet = ['1234', '5678', '9999'];
    // Bob enumerates 0000–0099 + some guesses
    const dictionary = Array.from({ length: 100 }, (_, i) =>
      i.toString().padStart(4, '0')
    ).concat(['1234', '5678', '9999', '0000', '1111']);

    const result = simulateDictionaryAttack(aliceSet, dictionary);
    a2Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice's set size:</span>
          <span class="info-value alice">${aliceSet.length}</span>
          <span class="info-label">Bob's dictionary size:</span>
          <span class="info-value bob">${dictionary.length}</span>
          <span class="info-label">Alice's elements learned by Bob:</span>
          <span class="info-value private">${result.aliceElementsLearned.join(', ') || '∅'}</span>
          <span class="info-label">Coverage:</span>
          <span class="info-value warning">${result.coveragePercent}%</span>
        </div>
        <div class="warning-box">${esc(result.warningMessage)}</div>
      </div>`;
  });

  // --- Attack 3: Scalar Reuse ---
  const a3Btn = document.getElementById('e4-a3-run') as HTMLButtonElement;
  const a3Output = document.getElementById('e4-a3-output') as HTMLDivElement;

  a3Btn.addEventListener('click', () => {
    const session1 = ['alice@example.com', 'mom@example.com', 'bob@example.com'];
    const session2 = ['alice@example.com', 'mom@example.com', 'new.friend@example.com']; // bob removed, new.friend added
    const bobSet = ['alice@example.com', 'service.user@example.com'];
    const reusedAlpha = randomScalar();

    const result = simulateReplayAttack(session1, session2, bobSet, reusedAlpha);
    a3Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Session 1 set:</span>
          <span class="info-value alice">${session1.join(', ')}</span>
          <span class="info-label">Session 2 set:</span>
          <span class="info-value alice">${session2.join(', ')}</span>
          <span class="info-label">Session 1 intersection:</span>
          <span class="info-value match">${result.session1Intersection.join(', ') || '∅'}</span>
          <span class="info-label">Session 2 intersection:</span>
          <span class="info-value match">${result.session2Intersection.join(', ') || '∅'}</span>
          <span class="info-label">Stable elements (both sessions):</span>
          <span class="info-value">${result.stableElements}</span>
          <span class="info-label">Elements added in session 2:</span>
          <span class="info-value warning">${result.addedElements}</span>
          <span class="info-label">Elements removed in session 2:</span>
          <span class="info-value warning">${result.removedElements}</span>
          <span class="info-label">Bob infers Alice's set changed:</span>
          <span class="info-value ${result.bobInfersAliceChange ? 'private' : 'match'}">${result.bobInfersAliceChange ? '✗ YES — privacy violation' : '✓ No change detected'}</span>
          <span class="info-label">Byte-identical X_i seen in both sessions:</span>
          <span class="info-value private">${result.linkedXCount} of ${session1.length} (Bob links these with zero plaintext)</span>
          ${result.linkedXSamples.length > 0
            ? `<span class="info-label">Sample linked X_i (Bob sees twice):</span>
               <span class="info-value">${result.linkedXSamples.map((s) => esc(s)).join(', ')}</span>`
            : ''}
        </div>
        <div class="status info">
          Both sessions above were executed with the reused α shown to the panel — the
          intersections, the X_i values, and the linkage all come from those two runs.
          The linked value is X_i = α·H(a_i), the round-1 A→B wire value. Y_i = β·X_i is
          <em>not</em> linkable: Bob draws a fresh β each session, so it is Alice's half of
          the blinding going stale that leaks, not the pair.
        </div>
        <div class="warning-box">${esc(result.warningMessage)}</div>
      </div>`;
  });

  // --- Attack 4: Malformed / Low-Order Point Injection ---
  const a4Btn = document.getElementById('e4-a4-run') as HTMLButtonElement;
  const a4Output = document.getElementById('e4-a4-output') as HTMLDivElement;

  a4Btn.addEventListener('click', () => {
    const { probes, ristrettoVerdict } = simulateMalformedPointInjection();
    a4Output.innerHTML = `
      <div class="result-box">
        <div class="table-scroll" role="group" tabindex="0" aria-label="Point injection probe results, scrollable">
        <table class="probe-table" aria-label="Malicious point injection probes">
          <thead>
            <tr>
              <th scope="col">Injected encoding</th>
              <th scope="col">32 bytes (hex)</th>
              <th scope="col">isValidPoint</th>
              <th scope="col">psi.ts bobRound2</th>
            </tr>
          </thead>
          <tbody>
            ${probes
              .map((p) => {
                const path =
                  p.protocolOutcome === 'validated'
                    ? { cls: 'match', text: '✓ rejected by validation' }
                    : p.protocolOutcome === 'crashed'
                      ? { cls: 'warning', text: '⚠ decode threw inside scalarMul' }
                      : { cls: 'private', text: '✗ multiplied by β' };
                return `
              <tr>
                <td>${esc(p.label)}</td>
                <td class="mono-cell">${esc(p.bytesHex.slice(0, 16))}…${esc(p.bytesHex.slice(-4))}</td>
                <td class="info-value ${p.accepted ? 'private' : 'match'}">${p.accepted ? '✗ accepted' : '✓ rejected'}</td>
                <td class="info-value ${path.cls}">${path.text}</td>
              </tr>
              <tr class="probe-detail">
                <td colspan="4">${esc(p.consequence)}</td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>
        </div>
        <div class="warning-box">${esc(ristrettoVerdict)}</div>
      </div>`;
  });

  // --- Attack 5: Malicious OPRF Bob lies about his published set ---
  const a5Btn = document.getElementById('e4-a5-run') as HTMLButtonElement;
  const a5Output = document.getElementById('e4-a5-output') as HTMLDivElement;

  a5Btn.addEventListener('click', () => {
    const aliceQuery = [
      'pastor@church.org',
      'celebrity@example.com',
      'friend.alex@email.com',
      'mom@example.com',
    ];
    const bobRealSet = [
      'pastor@church.org',
      'friend.alex@email.com',
      'mom@example.com',
      'random.user@example.com',
    ];
    const phantomAdds = ['celebrity@example.com']; // Bob didn't have this; pretends to
    const silentDrops = ['mom@example.com'];       // Bob really has this; lies that he doesn't

    const result = simulateMaliciousOprfBob(aliceQuery, bobRealSet, phantomAdds, silentDrops);

    const fmt = (xs: string[]): string =>
      xs.length === 0 ? '<em>(empty)</em>' : xs.map((x) => `<code>${esc(x)}</code>`).join(', ');

    a5Output.innerHTML = `
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice's query A:</span>
          <span class="info-value">${fmt(aliceQuery)}</span>
          <span class="info-label">Bob's real set B:</span>
          <span class="info-value">${fmt(bobRealSet)}</span>
          <span class="info-label">Phantom tags Bob adds:</span>
          <span class="info-value">${fmt(phantomAdds)}</span>
          <span class="info-label">Real tags Bob drops:</span>
          <span class="info-value">${fmt(silentDrops)}</span>
        </div>

        <div class="table-scroll" role="group" tabindex="0" aria-label="Honest vs malicious OPRF Bob outcomes, scrollable" style="margin-top:0.75rem">
        <table class="probe-table" aria-label="Honest vs malicious OPRF Bob outcomes">
          <thead>
            <tr>
              <th scope="col">Bob behaviour</th>
              <th scope="col">|F|</th>
              <th scope="col">Alice's intersection</th>
              <th scope="col">Tampering visible to Alice?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Honest</td>
              <td class="num">${result.honest.publishedSize}</td>
              <td class="mono-cell">{${result.honest.intersection.map(esc).join(', ')}}</td>
              <td class="info-value match">N/A (baseline)</td>
            </tr>
            <tr>
              <td>Inflated F (added phantoms)</td>
              <td class="num">${result.inflated.publishedSize}</td>
              <td class="mono-cell">{${result.inflated.intersection.map(esc).join(', ')}}</td>
              <td class="info-value private">✗ no — false positives indistinguishable from honest matches</td>
            </tr>
            <tr>
              <td>Deflated F (dropped real tags)</td>
              <td class="num">${result.deflated.publishedSize}</td>
              <td class="mono-cell">{${result.deflated.intersection.map(esc).join(', ')}}</td>
              <td class="info-value private">✗ no — silent false negatives, Alice cannot prove the omission</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div class="warning-box">${esc(result.warningMessage)}</div>
      </div>`;
  });
}

// ---------------------------------------------------------------------------
// Exhibit 5 — Real-World Deployments
// ---------------------------------------------------------------------------

function initExhibit5(): void {
  // Gate test: run a quick PSI self-check and display results
  const selfTest = document.getElementById('e5-selftest') as HTMLDivElement;

  setTimeout(() => {
    try {
      // Test: hash-to-curve distinct inputs
      const h1 = pointToHex(hashToPoint('alice@example.com'));
      const h2 = pointToHex(hashToPoint('bob@example.com'));
      const hashDistinct = h1 !== h2;

      // Test: intersection correctness
      const r = runPSI(
        ['a@example.com', 'b@example.com', 'c@example.com'],
        ['b@example.com', 'c@example.com', 'd@example.com']
      );
      const intersectionOk = r.intersection.length === 2 &&
        r.intersection.includes('b@example.com') &&
        r.intersection.includes('c@example.com');

      // Test: empty intersection
      const rEmpty = runPSI(['x@example.com'], ['y@example.com']);
      const emptyOk = rEmpty.intersection.length === 0;

      // Test: identical sets
      const items = ['a@example.com', 'b@example.com', 'c@example.com'];
      const rFull = runPSI(items, items);
      const fullOk = rFull.intersection.length === 3;

      const tests = [
        { name: 'hashToPoint distinct inputs', ok: hashDistinct },
        { name: 'PSI small sets (3×3, 2 matching)', ok: intersectionOk },
        { name: 'PSI empty intersection', ok: emptyOk },
        { name: 'PSI identical sets', ok: fullOk },
      ];

      selfTest.innerHTML = `
        <div class="card">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Gate Tests</div>
          ${tests
            .map(
              (t) =>
                `<div class="status ${t.ok ? 'ok' : 'error'}">${t.ok ? '✓' : '✗'} ${esc(t.name)}</div>`
            )
            .join('')}
        </div>`;
    } catch (err) {
      selfTest.innerHTML = `<div class="status error">Self-test error: ${esc(String(err))}</div>`;
    }
  }, 100);
}

// ---------------------------------------------------------------------------
// Exhibit 6 — Cryptographer's Lab (test vectors, benchmarks, transcript)
// ---------------------------------------------------------------------------

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB`;
}

function initExhibit6(): void {
  // --- Test Vectors -------------------------------------------------------
  const tvBtn = document.getElementById('e6-tv-run') as HTMLButtonElement;
  const tvOutput = document.getElementById('e6-tv-output') as HTMLDivElement;
  const transcriptOutput = document.getElementById('e6-transcript') as HTMLDivElement;

  // Canonical inputs for the published test vector. Anyone reimplementing
  // DH-PSI on ristretto255 should reproduce these byte-for-byte.
  const TV_ALICE = ['alice@example.com', 'bob@example.com', 'mom@example.com'];
  const TV_BOB = ['bob@example.com', 'mom@example.com', 'eve@example.com'];
  const TV_ALPHA_SEED =
    '0000000000000000000000000000000000000000000000000000000000000007';
  const TV_BETA_SEED =
    '000000000000000000000000000000000000000000000000000000000000000b';

  function renderTestVectors(): void {
    const alpha = scalarFromSeed(TV_ALPHA_SEED);
    const beta = scalarFromSeed(TV_BETA_SEED);
    const trace = tracePSI(TV_ALICE, TV_BOB, alpha, beta);

    // Machine-readable form of the same trace — copied verbatim to clipboard.
    const traceJson = {
      suite: 'PSI-GATE-v1',
      group: 'ristretto255',
      inputs: {
        A: trace.aliceSet,
        B: trace.bobSet,
        alphaSeed: TV_ALPHA_SEED,
        betaSeed: TV_BETA_SEED,
      },
      scalars: {
        alpha: pointToHex(trace.aliceScalar),
        beta: pointToHex(trace.bobScalar),
      },
      hashed: {
        H_alice: trace.hashedAlice.map(pointToHex),
        H_bob: trace.hashedBob.map(pointToHex),
      },
      wire: {
        X: trace.wireA2B_X.map(pointToHex),
        Y: trace.wireB2A_Y.map(pointToHex),
        Z: trace.wireB2A_Z.map(pointToHex),
      },
      local: {
        W: trace.computedW.map(pointToHex),
      },
      intersection: [...trace.intersection].sort(),
    };

    const row = (label: string, hex: string): string => `
      <div class="tv-row">
        <span class="tv-label">${esc(label)}</span>
        <code class="tv-hex">${esc(hex)}</code>
      </div>`;

    const hashRows = trace.aliceSet
      .map((el, i) => row(`H(a${i + 1}) — "${el}"`, pointToHex(trace.hashedAlice[i]!)))
      .join('') +
      trace.bobSet
        .map((el, i) => row(`H(b${i + 1}) — "${el}"`, pointToHex(trace.hashedBob[i]!)))
        .join('');

    const wireRows =
      trace.wireA2B_X
        .map((p, i) => row(`X_${i + 1} = α·H(a${i + 1})`, pointToHex(p)))
        .join('') +
      trace.wireB2A_Y
        .map((p, i) => row(`Y_${i + 1} = β·X_${i + 1}`, pointToHex(p)))
        .join('') +
      trace.wireB2A_Z
        .map((p, j) => row(`Z_${j + 1} = β·H(b${j + 1})`, pointToHex(p)))
        .join('') +
      trace.computedW
        .map((p, j) => row(`W_${j + 1} = α·Z_${j + 1}`, pointToHex(p)))
        .join('');

    tvOutput.innerHTML = `
      <div class="card">
        <div class="card-section-label">Inputs (fixed)</div>
        ${row('Group', 'ristretto255 (prime order, RFC 9496 + RFC 9380 hash-to-curve)')}
        ${row('α seed', TV_ALPHA_SEED)}
        ${row('β seed', TV_BETA_SEED)}
        ${row('α (32 bytes, big-endian)', pointToHex(trace.aliceScalar))}
        ${row('β (32 bytes, big-endian)', pointToHex(trace.bobScalar))}
        ${row('A = {a_i}', TV_ALICE.join(', '))}
        ${row('B = {b_j}', TV_BOB.join(', '))}
      </div>
      <div class="card">
        <div class="card-section-label">Hashed inputs (not on wire)</div>
        ${hashRows}
      </div>
      <div class="card">
        <div class="card-section-label">Protocol points</div>
        ${wireRows}
      </div>
      <div class="status ok">
        Expected intersection: {${trace.intersection.join(', ')}} —
        any conforming DH-PSI/ristretto255 implementation MUST produce
        the same X, Y, Z, W byte strings given these inputs.
      </div>
      <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
        <button id="e6-tv-copy" type="button" class="btn"
          aria-label="Copy the test vector trace to the clipboard as JSON">Copy as JSON</button>
        <span id="e6-tv-copy-status" class="copy-status" role="status" aria-live="polite"></span>
      </div>`;

    const copyBtn = document.getElementById('e6-tv-copy') as HTMLButtonElement | null;
    const copyStatus = document.getElementById('e6-tv-copy-status') as HTMLSpanElement | null;
    if (copyBtn && copyStatus) {
      copyBtn.addEventListener('click', async () => {
        const json = JSON.stringify(traceJson, null, 2);
        try {
          await navigator.clipboard.writeText(json);
          copyStatus.textContent = `Copied ${json.length.toLocaleString()} bytes.`;
        } catch {
          // Fallback when clipboard API is unavailable (HTTP origin, perms denied).
          copyStatus.textContent = 'Clipboard blocked — see console for JSON.';
          // Surface the data anyway so reviewers still have a path.
          // eslint-disable-next-line no-console
          console.log(json);
        }
        setTimeout(() => { copyStatus.textContent = ''; }, 3000);
      });
    }

    // --- Transcript view (uses same trace) --------------------------------
    const dump = (bytes: Uint8Array): string =>
      Array.from(bytes)
        .map((b, i) => {
          const sep = i > 0 && i % 8 === 0 ? ' ' : '';
          return sep + b.toString(16).padStart(2, '0');
        })
        .join('');

    const xBytes = trace.wireA2B_X.length * 32;
    const yBytes = trace.wireB2A_Y.length * 32;
    const zBytes = trace.wireB2A_Z.length * 32;

    transcriptOutput.innerHTML = `
      <div class="card">
        <div class="card-section-label">A → B  Round 1 — ${trace.wireA2B_X.length} × 32 B = ${formatBytes(xBytes)}</div>
        ${trace.wireA2B_X.map((p, i) => `
          <div class="wire-line wire-alice">
            <span class="wire-tag">X_${i + 1}</span>
            <code class="wire-hex">${dump(p)}</code>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="card-section-label">B → A  Round 2 — ${trace.wireB2A_Y.length + trace.wireB2A_Z.length} × 32 B = ${formatBytes(yBytes + zBytes)}</div>
        ${trace.wireB2A_Y.map((p, i) => `
          <div class="wire-line wire-doubleblinded">
            <span class="wire-tag">Y_${i + 1}</span>
            <code class="wire-hex">${dump(p)}</code>
          </div>`).join('')}
        ${trace.wireB2A_Z.map((p, j) => `
          <div class="wire-line wire-bob">
            <span class="wire-tag">Z_${j + 1}</span>
            <code class="wire-hex">${dump(p)}</code>
          </div>`).join('')}
      </div>
      <div class="status info">
        Total wire traffic: ${formatBytes(xBytes + yBytes + zBytes)}
        (${trace.wireA2B_X.length + trace.wireB2A_Y.length + trace.wireB2A_Z.length} ristretto points).
        DH-PSI is O(n+m) points sent — linear in set sizes.
      </div>`;
  }

  tvBtn.addEventListener('click', renderTestVectors);
  // Render the canonical vectors immediately so reviewers see them on load.
  renderTestVectors();

  // --- Benchmarks ---------------------------------------------------------
  const bmBtn = document.getElementById('e6-bm-run') as HTMLButtonElement;
  const bmOutput = document.getElementById('e6-bm-output') as HTMLDivElement;

  type BenchRow = { name: string; iter: number; totalMs: number; perOpUs: number; opsPerSec: number };

  function localBench(name: string, iter: number, fn: () => void): BenchRow {
    const warm = Math.min(50, Math.max(1, Math.floor(iter * 0.05)));
    for (let i = 0; i < warm; i++) fn();
    const t0 = performance.now();
    for (let i = 0; i < iter; i++) fn();
    const totalMs = performance.now() - t0;
    return { name, iter, totalMs, perOpUs: (totalMs * 1000) / iter, opsPerSec: iter / (totalMs / 1000) };
  }

  bmBtn.addEventListener('click', async () => {
    bmBtn.disabled = true;
    bmBtn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running benchmarks…</span> Running…';
    bmOutput.innerHTML =
      '<div class="status info" role="status">Running benchmarks in a Web Worker — UI stays responsive…</div>';

    const fmt = (n: number, d = 2): string => {
      if (n >= 1000) return Math.round(n).toLocaleString();
      return n.toFixed(d);
    };

    // Set-size grid — now goes up to 1k × 1k because the worker keeps the
    // main thread free. (10k × 10k is feasible but ~30s; we keep it sane.)
    const sizes: Array<[number, number]> = [
      [10, 10], [100, 100], [500, 500], [1000, 1000],
    ];

    let microBenches: BenchRow[];
    let psiRows: BenchRow[];

    try {
      if (workerSupported()) {
        const microTasks = (['hashToPoint', 'scalarMul', 'randomScalar'] as const).map(
          async (op) => {
            const r = await callWorker<{ totalMs: number; perOpUs: number; opsPerSec: number; iter: number }>(
              'bench-op',
              { op, iter: op === 'randomScalar' ? 1000 : 500 }
            );
            return { name: op, ...r };
          }
        );
        microBenches = await Promise.all(microTasks);

        psiRows = [];
        for (const [n, m] of sizes) {
          // Smaller iter for bigger sets so the wall-time stays bounded.
          const iter = n >= 500 ? 2 : n >= 100 ? 4 : 6;
          const r = await callWorker<{ totalMs: number; perOpUs: number; opsPerSec: number; iter: number }>(
            'bench-psi',
            { n, m, iter }
          );
          psiRows.push({ name: `PSI ${n} × ${m}`, ...r });
        }
      } else {
        // Fallback for environments without Worker support — keep the
        // smaller grid so the page doesn't lock up.
        let hbCounter = 0;
        microBenches = [
          localBench('hashToPoint', 500, () => { hashToPoint('bench-' + hbCounter++); }),
          localBench('scalarMul', 500, () => {
            const p = hashToPoint('benchmark');
            const s = randomScalar();
            scalarMul(s, p);
          }),
          localBench('randomScalar', 1000, () => { randomScalar(); }),
        ];
        psiRows = [];
        for (const [n, m] of [[10, 10], [100, 100]] as Array<[number, number]>) {
          const a = Array.from({ length: n }, (_, i) => `alice-${i}@example.com`);
          const b = Array.from({ length: m }, (_, j) => `bob-${j}@example.com`);
          a[0] = b[0]!; if (a.length > 1 && b.length > 1) a[1] = b[1]!;
          psiRows.push(localBench(`PSI ${n} × ${m}`, n >= 100 ? 4 : 6, () => { runPSI(a, b); }));
        }
      }
    } catch (err) {
      bmOutput.innerHTML = `<div class="status error">Benchmark error: ${esc(String(err))}</div>`;
      bmBtn.disabled = false;
      bmBtn.textContent = 'Run benchmarks again';
      return;
    }

    const rowsHtml = (rows: BenchRow[]): string =>
      rows
        .map(
          (r) => `
            <tr>
              <td>${esc(r.name)}</td>
              <td class="num">${r.iter}</td>
              <td class="num">${fmt(r.totalMs)} ms</td>
              <td class="num">${fmt(r.perOpUs)} µs</td>
              <td class="num">${fmt(r.opsPerSec, 0)} /s</td>
            </tr>`
        )
        .join('');

    bmOutput.innerHTML = `
      <div class="result-box">
        <div class="table-scroll" role="group" tabindex="0" aria-label="Benchmark results, scrollable">
        <table class="bench-table" aria-label="Benchmark results">
          <thead>
            <tr>
              <th scope="col">Operation</th>
              <th scope="col" class="num">Iterations</th>
              <th scope="col" class="num">Total</th>
              <th scope="col" class="num">Per op</th>
              <th scope="col" class="num">Throughput</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml(microBenches)}
            <tr><td colspan="5" class="bench-section">End-to-end DH-PSI (in worker)</td></tr>
            ${rowsHtml(psiRows)}
          </tbody>
        </table>
        </div>
        <div class="status info">
          Numbers are from THIS browser session, executed in a Web Worker so the
          main thread stays responsive. For reference: KKRT16/VOLE-PSI in C++ reach
          ~10⁶ elements/sec/core. DH-PSI in JS is roughly two orders of magnitude
          slower and exists here for clarity, not throughput.
        </div>
      </div>`;

    bmBtn.disabled = false;
    bmBtn.textContent = 'Run benchmarks again';
  });

  // --- DDH-pseudorandomness visualization -------------------------------
  initDDHVisualization();
}

function initDDHVisualization(): void {
  const btn = document.getElementById('e6-ddh-run') as HTMLButtonElement | null;
  const out = document.getElementById('e6-ddh-output') as HTMLDivElement | null;
  if (!btn || !out) return;

  // Critical chi-square values for df = 255, two-sided.
  //
  // A two-sided test at level α accepts on [q(α/2), q(1−α/2)], so the α = 0.05
  // band is the 2.5th/97.5th percentiles and the α = 0.01 band is the
  // 0.5th/99.5th. That makes the 0.05 band strictly INSIDE the 0.01 band —
  // the tighter test is the one with the larger α. An earlier version had the
  // pairs swapped in the verdict ladder, which made its middle branch
  // unreachable and reported "rejected at α = 0.05" for values that had
  // actually fallen outside the 0.01 interval.
  //
  // Values are the exact quantiles of χ²(255) (inverse regularized incomplete
  // gamma), not a table row for a nearby df.
  const CRIT = {
    p05_lo: 212.661, //  2.5th percentile
    p05_hi: 301.125, // 97.5th percentile
    p01_lo: 200.588, //  0.5th percentile
    p01_hi: 316.919, // 99.5th percentile
  };

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const originalLabel = btn.textContent ?? '';
    btn.innerHTML =
      '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Sampling…</span> Sampling…';
    out.innerHTML =
      '<div class="status info" role="status">Hashing 5000 strings, multiplying by α in a worker, binning bytes 0–255…</div>';

    try {
      const res = await callWorker<{
        histogram: number[];
        totalBytes: number;
        chiSq: number;
        df: number;
        sampleAlphaHex: string;
        count: number;
        bytesPerSample: number;
        byte0Histogram: number[];
        byte31Histogram: number[];
        byte0Odd: number;
        byte31HighBit: number;
      }>('distribution', { count: 5000 });

      // Render histogram as inline SVG bars. Width fixed at 512 (2px/bin).
      const w = 512;
      const h = 160;
      const max = Math.max(...res.histogram);
      const expected = res.totalBytes / 256;
      const barW = w / 256;
      const bars = res.histogram
        .map((v, i) => {
          const bh = (v / max) * (h - 24);
          const y = h - bh - 16;
          return `<rect x="${i * barW}" y="${y}" width="${barW - 0.2}" height="${bh}" fill="var(--alice)" opacity="0.7"></rect>`;
        })
        .join('');

      const expectedY = h - (expected / max) * (h - 24) - 16;

      // Strictest test first: the α = 0.05 band is the narrower one.
      const verdict =
        res.chiSq >= CRIT.p05_lo && res.chiSq <= CRIT.p05_hi
          ? { msg: 'Consistent with uniform — cannot reject H₀ even at α = 0.05, the stricter of the two tests.', cls: 'ok' }
          : res.chiSq >= CRIT.p01_lo && res.chiSq <= CRIT.p01_hi
          ? { msg: 'Borderline — outside the α = 0.05 band but inside the α = 0.01 band. Rejected at α = 0.05, not rejected at α = 0.01. One run in twenty lands here by chance; re-sample.', cls: 'warn' }
          : { msg: 'Rejected at α = 0.01 — outside both acceptance bands. One run in a hundred lands here by chance; if it repeats, something is structurally non-uniform.', cls: 'warn' };

      // The two constrained bytes, drawn at half width so the shape of the
      // constraint is the thing you see: byte 0 is a comb (evens only), byte
      // 31 is a block that stops dead at bin 128.
      const miniChart = (hist: number[], label: string, aria: string): string => {
        const mw = 256;
        const mh = 70;
        const mmax = Math.max(...hist, 1);
        const mbw = mw / 256;
        const mbars = hist
          .map((v, i) => {
            const bh = (v / mmax) * (mh - 14);
            return `<rect x="${i * mbw}" y="${mh - bh - 10}" width="${Math.max(mbw - 0.15, 0.35)}" height="${bh}" fill="var(--bob)" opacity="0.8"></rect>`;
          })
          .join('');
        return `
          <figure class="ddh-mini">
            <svg viewBox="0 0 ${mw} ${mh}" role="img" aria-label="${esc(aria)}">
              ${mbars}
              <line x1="128" y1="0" x2="128" y2="${mh - 10}" stroke="var(--text-muted)" stroke-dasharray="3 3" stroke-width="0.8"></line>
            </svg>
            <figcaption>${label}</figcaption>
          </figure>`;
      };

      out.innerHTML = `
        <div class="card">
          <div class="card-section-label">Byte-frequency histogram of α·H(x) for ${res.count.toLocaleString()} fresh x — byte positions 1–30</div>
          <div class="ddh-chart-wrap">
            <svg class="ddh-chart" viewBox="0 0 ${w} ${h}" role="img"
              aria-label="Histogram of byte values 0 to 255 from ${res.totalBytes.toLocaleString()} ristretto255 output bytes taken from byte positions 1 through 30; bars near horizontal line indicate uniform distribution.">
              <line x1="0" y1="${expectedY}" x2="${w}" y2="${expectedY}"
                stroke="var(--match)" stroke-dasharray="4 3" stroke-width="1.5"></line>
              ${bars}
              <text x="${w - 4}" y="${expectedY - 4}" text-anchor="end"
                fill="var(--match)" font-family="var(--mono)" font-size="10">
                expected ≈ ${Math.round(expected).toLocaleString()}
              </text>
            </svg>
          </div>
          <div class="info-grid">
            <span class="info-label">Samples:</span>
            <span class="info-value">${res.count.toLocaleString()} points × ${res.bytesPerSample} unconstrained bytes ⇒ ${res.totalBytes.toLocaleString()} observations</span>
            <span class="info-label">α (fresh, this run):</span>
            <span class="info-value mono-cell">${esc(res.sampleAlphaHex)}</span>
            <span class="info-label">Chi-square statistic (df = 255):</span>
            <span class="info-value">${res.chiSq.toFixed(2)}</span>
            <span class="info-label">α = 0.05 acceptance range (2.5–97.5%):</span>
            <span class="info-value">${CRIT.p05_lo.toFixed(2)} … ${CRIT.p05_hi.toFixed(2)}</span>
            <span class="info-label">α = 0.01 acceptance range (0.5–99.5%):</span>
            <span class="info-value">${CRIT.p01_lo.toFixed(2)} … ${CRIT.p01_hi.toFixed(2)}</span>
          </div>
          <div class="status ${verdict.cls}">${esc(verdict.msg)}</div>
          <div class="status info">
            This is the operational consequence of DDH: for any x ∉ A ∩ B,
            the value α·H(x) that an honest-but-curious Bob receives is
            computationally indistinguishable from a uniform group element.
            Across the 30 unconstrained byte positions, its marginals are flat
            to within sampling noise.
          </div>
        </div>

        <div class="card" style="margin-top:0.75rem">
          <div class="card-section-label">Why 1–30 and not 0–31: the encoding is not uniform bytes</div>
          <p style="font-size:0.85rem;color:var(--text-muted);margin:0 0 0.75rem">
            Two of the 32 byte positions are pinned by RFC 9496 and can never be
            flat. Both were measured on this run, not assumed:
          </p>
          <div class="ddh-mini-row">
            ${miniChart(res.byte0Histogram, 'byte 0 — even values only', `Histogram of byte 0 across ${res.count} ristretto encodings: every other bin is empty, because byte 0 is always even.`)}
            ${miniChart(res.byte31Histogram, 'byte 31 — never reaches 0x80', `Histogram of byte 31 across ${res.count} ristretto encodings: all mass is below bin 128, because the high bit is always clear.`)}
          </div>
          <div class="info-grid" style="margin-top:0.75rem">
            <span class="info-label">Byte 0 odd (should be 0):</span>
            <span class="info-value ${res.byte0Odd === 0 ? 'match' : 'private'}">${res.byte0Odd} of ${res.count.toLocaleString()}</span>
            <span class="info-label">Byte 31 ≥ 0x80 (should be 0):</span>
            <span class="info-value ${res.byte31HighBit === 0 ? 'match' : 'private'}">${res.byte31HighBit} of ${res.count.toLocaleString()}</span>
          </div>
          <div class="status info">
            A ristretto encoding is the canonical little-endian encoding of a
            field element s that the standard forces to be <em>non-negative</em>
            — meaning even — and s &lt; 2²⁵⁵ − 19, so the top bit is clear. Byte
            0 therefore takes 128 of its 256 values and byte 31 never reaches
            0x80. That second constraint is the same fact Attack 4 exercises
            from the other side, where an encoding with the high bit set is
            injected and rejected.
            <br><br>
            Pooling all 32 positions into one histogram at this sample size adds
            roughly 310 of systematic χ² on top of the ~255 of genuine noise —
            a total near 560, outside every band printed above, with a visible
            step at bin 128. The exhibit would have failed itself, and for the
            wrong reason. The lesson worth keeping is not "the bytes are flat"
            but the sharper one: pseudorandomness of the group element does not
            mean uniformity of the encoding, and if you need uniform bytes out
            of a ristretto point — a key, a nonce, an IV — you hash it. That is
            exactly what OPRF-PSI's H₂ does before publishing a tag.
          </div>
        </div>`;
    } catch (err) {
      out.innerHTML = `<div class="status error">Visualization error: ${esc(String(err))}</div>`;
    }

    btn.disabled = false;
    btn.textContent = originalLabel || 'Resample distribution';
  });
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

const appEl = document.getElementById('app')!;
appEl.innerHTML = `
<a href="#main-content" class="skip-link">Skip to main content</a>
<header class="cl-hero">
  <div class="cl-hero-main">
    <h1 class="cl-hero-title">PSI Gate</h1>
    <p class="cl-hero-sub">DH-PSI · ristretto255 · three-round Diffie-Hellman</p>
    <p class="cl-hero-desc">
      Watch two parties compute A ∩ B by commutatively blinding hashed
      elements, so each learns only the matches and never the other's
      non-matching set.
    </p>
  </div>
  <aside class="cl-hero-why" aria-label="Why it matters">
    <span class="cl-hero-why-label">WHY IT MATTERS</span>
    <p class="cl-hero-why-text">
      Contact discovery, ad-conversion measurement, and compromised-password
      checks all need to intersect private lists without leaking the rest.
      PSI delivers that guarantee, resting on commutative blinding and the DDH
      assumption.
    </p>
  </aside>
</header>

<div role="tablist" aria-label="Demo exhibits">
  <button type="button" id="tab-1" role="tab" aria-selected="true"  aria-controls="exhibit-1" tabindex="0"  class="tab-btn active">1. Contact Discovery</button>
  <button type="button" id="tab-2" role="tab" aria-selected="false" aria-controls="exhibit-2" tabindex="-1" class="tab-btn">2. Protocol Walkthrough</button>
  <button type="button" id="tab-3" role="tab" aria-selected="false" aria-controls="exhibit-3" tabindex="-1" class="tab-btn">3. Live Simulator</button>
  <button type="button" id="tab-4" role="tab" aria-selected="false" aria-controls="exhibit-4" tabindex="-1" class="tab-btn">4. Attacks</button>
  <button type="button" id="tab-5" role="tab" aria-selected="false" aria-controls="exhibit-5" tabindex="-1" class="tab-btn">5. Real-World</button>
  <button type="button" id="tab-6" role="tab" aria-selected="false" aria-controls="exhibit-6" tabindex="-1" class="tab-btn">6. Cryptographer's Lab</button>
</div>

<main id="main-content">
<!-- ── Exhibit 1 ── -->
<section id="exhibit-1" role="tabpanel" aria-labelledby="tab-1" class="exhibit active">
  <h2>The Contact Discovery Problem</h2>
  <p>
    You just downloaded <strong>PrayerWarriors.Mobi</strong>. Which of your 8 trusted
    prayer partners are already on the app? The naive solution sends your entire address
    book to the server — a privacy violation. PSI solves this.
  </p>
  <p class="status info">
    <strong>You are looking at both sides at once.</strong> That is the lab's omniscient
    view, not any participant's: Alice never sees the server's user database and the server
    never sees Alice's address book. Read the two columns as the ground truth the protocol
    is <em>not</em> allowed to reveal.
  </p>
  <div class="card-row">
    <div>
      <div class="set-label alice">Your Contacts (Alice) <span class="omniscient-tag">omniscient view</span></div>
      <ul id="e1-alice-list" class="element-list" aria-label="Alice's contacts — omniscient view, not visible to the server"></ul>
    </div>
    <div>
      <div class="set-label bob">App User Database (Bob / Server) <span class="omniscient-tag">omniscient view</span></div>
      <ul id="e1-bob-list" class="element-list" aria-label="Server's user database — omniscient view, not visible to Alice"></ul>
    </div>
  </div>
  <div style="margin-top:1rem">
    <button id="e1-run" type="button" class="btn primary">Run Private Set Intersection</button>
  </div>
  <div id="e1-output" aria-live="polite" aria-atomic="true"></div>
  <div class="card" style="margin-top:1rem">
    <div class="info-grid">
      <span class="info-label">Naive approach:</span>
      <span class="info-value private">Send all 8 contacts to server → server learns your full address book</span>
      <span class="info-label">PSI approach:</span>
      <span class="info-value match">Cryptographically blind contacts → server learns only how many contacts you have; you compute the intersection locally</span>
    </div>
  </div>
</section>

<!-- ── Exhibit 2 ── -->
<section id="exhibit-2" role="tabpanel" aria-labelledby="tab-2" class="exhibit">
  <h2>DH-PSI Protocol — Step by Step</h2>
  <p>
    The classic three-round interactive protocol. Click through each round to see
    how blinding transforms plain emails into random curve points — and back.
  </p>
  <div id="e2-panel" class="step-panel" aria-live="polite" aria-atomic="true"></div>
  <div class="step-nav">
    <button type="button" id="e2-prev" class="btn">← Prev</button>
    <span id="e2-step" style="align-self:center;color:var(--text-muted);font-size:0.85rem" aria-live="polite"></span>
    <button id="e2-next" type="button" class="btn primary">Next →</button>
  </div>
</section>

<!-- ── Exhibit 3 ── -->
<section id="exhibit-3" role="tabpanel" aria-labelledby="tab-3" class="exhibit">
  <h2>Live Contact Matching Simulator</h2>
  <p>Enter your own sets — one element per line. PSI runs entirely in your browser.</p>
  <div class="card-row">
    <div>
      <label for="e3-alice" class="set-label alice">Alice's Set (your contacts)</label>
      <textarea id="e3-alice" placeholder="Enter one element per line…"></textarea>
    </div>
    <div>
      <label for="e3-bob" class="set-label bob">Bob's Set (server user database)</label>
      <textarea id="e3-bob" placeholder="Enter one element per line…"></textarea>
    </div>
  </div>
  <fieldset class="proto-picker">
    <legend>Protocol</legend>
    <label class="proto-option">
      <input type="radio" name="e3-proto" value="dh" checked>
      <span>DH-PSI (Meadows 1986)</span>
      <small>three-round interactive; both parties exchange points</small>
    </label>
    <label class="proto-option">
      <input type="radio" name="e3-proto" value="oprf">
      <span>OPRF-PSI (Jarecki-Liu 2010)</span>
      <small>Bob publishes PRF tags once; per-query cost independent of |B|</small>
    </label>
  </fieldset>
  <div style="margin-top:0.75rem">
    <button id="e3-run" type="button" class="btn primary">Run PSI</button>
  </div>
  <div id="e3-output" aria-live="polite" aria-atomic="true"></div>
</section>

<!-- ── Exhibit 4 ── -->
<section id="exhibit-4" role="tabpanel" aria-labelledby="tab-4" class="exhibit">
  <h2>What Can Go Wrong — Attack Simulations</h2>

  <div class="card">
    <h3>Attack 1 — Set Size Inflation</h3>
    <p>
      Bob can claim any set size without Alice knowing. He can inflate to
      hide his database size, or deflate to look smaller.
    </p>
    <button id="e4-a1-run" type="button" class="btn danger">Simulate Inflation</button>
    <div id="e4-a1-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 2 — Dictionary Attack on Small Domains</h3>
    <p>
      If Alice's elements come from a small domain (4-digit PINs, short codes),
      Bob can enumerate the entire domain as his set and learn Alice's full set.
    </p>
    <button id="e4-a2-run" type="button" class="btn danger">Simulate Dictionary Attack</button>
    <div id="e4-a2-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 3 — Scalar Reuse Across Sessions</h3>
    <p>
      If Alice reuses α across two PSI sessions, Bob can link the sessions and
      detect which elements changed — even without reading any element values.
    </p>
    <button id="e4-a3-run" type="button" class="btn danger">Simulate Scalar Reuse</button>
    <div id="e4-a3-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 4 — Malformed / Low-Order Point Injection</h3>
    <p>
      Malicious Bob (or a network attacker) submits crafted 32-byte values
      instead of legitimate group points: the identity, low-order torsion
      points, non-canonical encodings, garbage. On raw Ed25519/Curve25519
      these enable real attacks; ristretto255 removes most of the class by
      construction — but not the identity, which encodes and decodes perfectly
      well and collapses every Y_i to O. Each probe is therefore run twice:
      once through <code>isValidPoint</code> on its own, and once through
      <code>psi.ts</code>'s <code>bobRound2</code>, the function a real session
      calls when X_i arrives. Only the second column is evidence about the
      protocol.
    </p>
    <button id="e4-a4-run" type="button" class="btn danger">Probe Input Validation</button>
    <div id="e4-a4-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 5 — Malicious OPRF Bob lies about his published set</h3>
    <p>
      In OPRF-PSI, Bob publishes a set of PRF tags F = { H₂(k·H(b)) } and
      Alice membership-tests against it. The protocol gives NO integrity on F:
      Bob can add phantom tags (false positives) or drop real ones (silent
      false negatives) and Alice cannot tell from the OPRF transcript alone.
    </p>
    <button id="e4-a5-run" type="button" class="btn danger">Simulate Lying Bob</button>
    <div id="e4-a5-output" aria-live="polite" aria-atomic="true"></div>
  </div>
</section>

<!-- ── Exhibit 5 ── -->
<section id="exhibit-5" role="tabpanel" aria-labelledby="tab-5" class="exhibit">
  <h2>Real-World PSI Deployments</h2>
  <div id="e5-selftest" aria-live="polite" aria-atomic="true"></div>

  <div class="deployment-grid" style="margin-top:1rem">
    <div class="deployment-card">
      <h4>Signal — Contact Discovery <em>(not PSI)</em></h4>
      <p>Intel SGX enclaves plus ORAM, not a PSI protocol — Signal ruled PSI out by name
      and solved the same problem with attested hardware. OPRF-PSI is the academic route
      to the same goal. Open-source: signalapp/ContactDiscoveryService-Icelake.</p>
    </div>
    <div class="deployment-card">
      <h4>Apple Password Monitoring (iOS 14+)</h4>
      <p>Checks saved passwords against breach databases using a PSI variant.
      Apple does not learn your passwords.</p>
    </div>
    <div class="deployment-card">
      <h4>Google Password Checkup</h4>
      <p>Checks passwords against 4+ billion leaked credentials.
      Uses blind hashing + k-anonymity. Google does not learn your passwords.</p>
    </div>
    <div class="deployment-card">
      <h4>Google Private Join and Compute</h4>
      <p>Ad conversion attribution across organizations. Two companies compute joint
      conversion statistics without seeing each other's user databases.
      Open-source: google/private-join-and-compute.</p>
    </div>
    <div class="deployment-card">
      <h4>DP3T / Google-Apple Exposure Notification <em>(not PSI)</em></h4>
      <p>COVID-19 contact tracing via Bluetooth proximity. Rolling proximity identifiers
      are HKDF-derived from daily keys and re-derived locally on-device from downloaded
      diagnosis keys — decentralized, but no two-party intersection protocol runs.</p>
    </div>
    <div class="deployment-card">
      <h4>Healthcare — Cross-Hospital Billing Detection</h4>
      <p>Hospitals combine patient record hashes to detect double-billing patterns.
      Individual records never leave their originating institution.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3>The PrayerWarriors.Mobi Connection</h3>
    <p>
      When a user joins PrayerWarriors.Mobi, they can identify trusted prayer partners.
      The app needs to know which partners are also users — so prayers can be securely
      shared. PSI enables this without the server ever seeing your full contact list,
      and without you downloading the full user database.
    </p>
    <p>
      Your address book never reaches the server. The server's user database never
      reaches you. Only the intersection — prayer partners who are also on the app —
      becomes known. Signal solves the same discovery problem with attested enclaves;
      this is the pure-cryptography route to it, adapted for prayer.
    </p>
  </div>

  <div class="card" style="margin-top:1rem">
    <h3>Related Crypto Labs</h3>
    <pre aria-label="Related crypto lab projects">crypto-lab-opaque-gate       — aPAKE (authentication, related primitive)
crypto-lab-silent-tally      — private aggregation
crypto-lab-blind-oracle      — TFHE (general-purpose PSI via FHE)
crypto-lab-oblivious-shelf   — PIR (private information retrieval)
crypto-lab-patron-shield     — privacy-preserving analytics
crypto-lab-paillier-gate     — Paillier (used in some PSI variants)
crypto-lab-ot-gate           — oblivious transfer (used in OPRF-PSI)</pre>
  </div>
</section>

<!-- ── Exhibit 6 — Cryptographer's Lab ── -->
<section id="exhibit-6" role="tabpanel" aria-labelledby="tab-6" class="exhibit">
  <h2>Cryptographer's Lab</h2>
  <p>
    Reproducible test vectors, wire-format transcripts, benchmarks, and the
    semi-honest security argument. Everything here is byte-exact and replayable.
  </p>

  <h3>Test Vectors (canonical)</h3>
  <p>
    Fixed inputs, fixed scalars (no shuffling, no fresh randomness). Any
    conforming DH-PSI on ristretto255 must reproduce every hex string below.
    NOTE: this mode disables shuffling and uses seeded scalars — it is a
    reference oracle, NOT a secure execution.
  </p>
  <button id="e6-tv-run" type="button" class="btn primary">Recompute Test Vectors</button>
  <div id="e6-tv-output" aria-live="polite" aria-atomic="true"></div>

  <h3>Wire-Format Transcript</h3>
  <p>
    Byte-by-byte view of every ristretto point sent over the wire during the
    test-vector run above. Color-coded by sender; recompute to refresh.
  </p>
  <div id="e6-transcript" aria-live="polite" aria-atomic="true"></div>

  <h3>Benchmarks</h3>
  <p>
    Live measurement of <code>hashToPoint</code>, <code>scalarMul</code>, and
    end-to-end DH-PSI at a few set sizes. Numbers come from your browser, not
    a publication — useful for sanity-checking JS-vs-native expectations.
  </p>
  <button id="e6-bm-run" type="button" class="btn primary">Run Benchmarks</button>
  <div id="e6-bm-output" aria-live="polite" aria-atomic="true"></div>

  <h3>DDH Pseudorandomness — Empirical Check</h3>
  <p>
    Under DDH on ristretto255, the blinded values α·H(x) are computationally
    indistinguishable from uniform random group elements. We sample 5000 fresh
    strings, multiply by a fresh α, then bin every output byte across 0–255
    and compute a chi-square statistic against the uniform expectation.
  </p>
  <button id="e6-ddh-run" type="button" class="btn primary">Sample 5000 × α·H(x)</button>
  <div id="e6-ddh-output" aria-live="polite" aria-atomic="true"></div>

  <h3>Semi-Honest Security Argument</h3>
  <p>
    DH-PSI is secure against semi-honest (honest-but-curious) adversaries
    under the Decisional Diffie-Hellman assumption on ristretto255.
    Each party's view is computationally indistinguishable from a simulated
    view constructed using only their input, output, and set sizes.
  </p>
  <div class="card-row">
    <div class="card">
      <div class="card-section-label">Simulator for corrupt Alice</div>
      <p>Given α (Alice's private input), A, and the output (intersection I, |B|):</p>
      <ol class="proof-list">
        <li>For each element of I, compute Y* = αβ'·H(x) using a fresh β'.</li>
        <li>For each remaining slot up to |A|, sample a uniform random ristretto point.</li>
        <li>Sample |B| fresh random points and assign to Z* (shuffled).</li>
        <li>Output (Y*, Z*) as the simulated round-2 message.</li>
      </ol>
      <p class="proof-note">
        Indistinguishable from a real run by DDH: αβ·H(x) for x ∉ A ∩ B
        is pseudorandom to Alice, who only knows α.
      </p>
    </div>
    <div class="card">
      <div class="card-section-label">Simulator for corrupt Bob</div>
      <p>Given β (Bob's private input), B, and the output (|A|):</p>
      <ol class="proof-list">
        <li>Sample |A| fresh uniform random ristretto points as X*.</li>
        <li>Compute Y* = β·X* (the simulator can do this since β is known).</li>
        <li>Output X* as the simulated round-1 message.</li>
      </ol>
      <p class="proof-note">
        Indistinguishable from a real run by DDH: α·H(a_i) for fresh α
        is pseudorandom over the group, regardless of a_i.
      </p>
    </div>
  </div>

  <h3>What This Implementation Is NOT</h3>
  <ul class="caveat-list">
    <li><strong>Not constant-time.</strong> JavaScript <code>BigInt</code> and array
      ops leak timing through engine internals (GC, JIT). Use a native constant-time
      library (libsodium, BoringSSL) in production.</li>
    <li><strong>Not malicious-secure.</strong> No ZK proofs of correct β-application,
      no commitment to set sizes, no DoS defenses. See VOLE-PSI for malicious security.</li>
    <li><strong>Not side-channel hardened.</strong> No defense against cache, branch,
      or power side channels.</li>
    <li><strong>Not formally verified.</strong> The simulator sketch above is a
      proof intuition, not a machine-checked proof. See Hazay-Lindell or
      Pinkas-Schneider-Zohner for full proofs.</li>
  </ul>

  <h3>PSI Protocol Comparison</h3>
  <div class="psi-compare-scroll" tabindex="0" role="group" aria-label="PSI protocol comparison table, scrollable">
    <table class="psi-compare" aria-label="PSI protocol comparison">
      <thead>
        <tr>
          <th scope="col">Protocol</th>
          <th scope="col">Year</th>
          <th scope="col">Communication</th>
          <th scope="col">Computation</th>
          <th scope="col">Security</th>
          <th scope="col">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">DH-PSI <em>(this demo)</em></th>
          <td>1986</td>
          <td>O(n + m) group elts</td>
          <td>O(n + m) scalar muls</td>
          <td>Semi-honest, DDH</td>
          <td>Simple, slow; baseline for understanding PSI</td>
        </tr>
        <tr>
          <th scope="row">OPRF-PSI (JL10)</th>
          <td>2010</td>
          <td>O(n + m) group elts</td>
          <td>O(n + m) scalar muls</td>
          <td>Semi-honest, one-more-DH</td>
          <td>DH-PSI hardened with an OPRF; the basis of VOPRF-style deployments</td>
        </tr>
        <tr>
          <th scope="row">KKRT16</th>
          <td>2016</td>
          <td>O(n) ciphertexts</td>
          <td>O(n) symmetric ops</td>
          <td>Semi-honest</td>
          <td>OT-extension based; ~10⁶ elts/sec in C++</td>
        </tr>
        <tr>
          <th scope="row">SpOT-Light (PRTY19) / CM20</th>
          <td>2019 / 2020</td>
          <td>O(n) bits asymptotic</td>
          <td>O(n)</td>
          <td>Semi-honest</td>
          <td>Communication-optimal for small intersection</td>
        </tr>
        <tr>
          <th scope="row">PaXoS (PRTY20) / VOLE-PSI (RS21)</th>
          <td>2020 / 2021</td>
          <td>O(n)</td>
          <td>O(n) field ops</td>
          <td>Malicious</td>
          <td>State-of-the-art; malicious security at near-semi-honest cost</td>
        </tr>
        <tr>
          <th scope="row">FHE-PSI (Chen-Laine-Rindal)</th>
          <td>2017</td>
          <td>O(n) ciphertexts</td>
          <td>Heavy (FHE)</td>
          <td>Semi-honest</td>
          <td>Asymmetric: useful when one party has tiny set, other has huge</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
</main>

<footer>
  <p>DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 via @noble/curves</p>
  <p style="margin-top:0.25rem">Related demos:
    <a href="https://systemslibrarian.github.io/crypto-lab-opaque-gate/">crypto-lab-opaque-gate</a>,
    <a href="https://systemslibrarian.github.io/crypto-lab-ot-gate/">crypto-lab-ot-gate</a>,
    <a href="https://systemslibrarian.github.io/crypto-lab-oblivious-shelf/">crypto-lab-oblivious-shelf</a>,
    <a href="https://systemslibrarian.github.io/crypto-lab-paillier-gate/">crypto-lab-paillier-gate</a>,
    <a href="https://systemslibrarian.github.io/crypto-lab-silent-tally/">crypto-lab-silent-tally</a></p>
  <p style="margin-top:0.25rem;font-style:italic;color:var(--text-muted)">
    "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God." — 1 Cor 10:31
  </p>
</footer>
`;

// Initialize all exhibits
initThemeToggle();
initTabs();
initExhibit1();
initExhibit2();
initExhibit3();
initExhibit4();
initExhibit5();
initExhibit6();

// Scalar-btn: reveal on click via event delegation.
// Keyboard activation (Space/Enter) on a <button> fires a click event, so no
// separate keydown handler is needed. Toggling aria-pressed flips both the
// visual reveal (CSS [aria-pressed="true"]) and the screen-reader exposure
// (inner [data-hex] is aria-hidden until revealed).
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const btn = target.closest<HTMLButtonElement>('.scalar-btn');
  if (!btn) return;
  const wasPressed = btn.getAttribute('aria-pressed') === 'true';
  const nowPressed = !wasPressed;
  btn.setAttribute('aria-pressed', nowPressed ? 'true' : 'false');
  const hex = btn.querySelector<HTMLElement>('[data-hex]');
  if (hex) hex.setAttribute('aria-hidden', nowPressed ? 'false' : 'true');
  // Which scalar this button is for — read out of the current label.
  const greek = /α/.test(btn.getAttribute('aria-label') ?? '') ? 'α' : 'β';
  btn.setAttribute(
    'aria-label',
    nowPressed
      ? `Hide private scalar ${greek} (currently revealed — click to toggle)`
      : `Reveal private scalar ${greek} (currently hidden — click to toggle)`
  );
});
