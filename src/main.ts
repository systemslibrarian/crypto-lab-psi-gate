import './style.css';
import { runPSI, aliceRound1, bobRound2, aliceRound3, verifyCorrectness } from './psi.js';
import { hashToPoint, pointToHex, randomScalar, scalarMul } from './group.js';
import {
  simulateSetSizeInflation,
  simulateDictionaryAttack,
  simulateReplayAttack,
} from './attacks.js';

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
  btn.className = 'theme-toggle';
  btn.textContent = '☀ / ☾';
  const updateLabel = (): void => {
    const current = document.documentElement.getAttribute('data-theme') ?? 'dark';
    btn.setAttribute('aria-label', `Switch to ${current === 'dark' ? 'light' : 'dark'} theme`);
    btn.setAttribute('title', btn.getAttribute('aria-label')!);
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
      if (next !== -1) { e.preventDefault(); activateTab(tabs[next]); }
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

  // Render initial lists
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
            ✓ PSI complete — only matching contacts revealed. Neither party learned anything else.
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

function initExhibit2(): void {
  const aliceSet = ['alice@example.com', 'mom@gmail.com', 'bob@example.com'];
  const bobSet = ['bob@example.com', 'charlie@example.com', 'dave@example.com'];

  let step = 0;
  let r1: ReturnType<typeof aliceRound1> | null = null;
  let r2: ReturnType<typeof bobRound2> | null = null;

  const panel = document.getElementById('e2-panel') as HTMLDivElement;
  const prevBtn = document.getElementById('e2-prev') as HTMLButtonElement;
  const nextBtn = document.getElementById('e2-next') as HTMLButtonElement;
  const stepCounter = document.getElementById('e2-step') as HTMLSpanElement;

  const steps: Array<() => string> = [
    // Step 0 — Setup
    () => `
      <h3><span class="step-counter">0</span>Setup</h3>
      <div class="card-row">
        <div>
          <div class="set-label alice">Alice's Set A</div>
          <ul class="element-list">
            ${aliceSet.map((el) => `<li>${esc(el)}</li>`).join('')}
          </ul>
        </div>
        <div>
          <div class="set-label bob">Bob's Set B</div>
          <ul class="element-list">
            ${bobSet.map((el) => `<li>${esc(el)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="status info" style="margin-top:1rem">
        Group: ristretto255 (prime-order, DDH-hard). Hash-to-curve: RFC 9380.
        Expected intersection: { bob@example.com }
      </div>`,

    // Step 1 — Alice Round 1
    () => {
      r1 = aliceRound1(aliceSet);
      const scalarHex = Array.from(r1.aliceScalar)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `
        <h3><span class="step-counter">1</span>Alice — Round 1: Blind her elements</h3>
        <p>Alice picks a fresh random scalar α and computes X_i = α · H(a_i) for each element.</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">α (private, NEVER sent):</span>
            <button class="scalar-btn" aria-pressed="false" aria-label="Reveal private scalar (click to toggle)">${scalarHex}</button>
          </div>
        </div>
        <div class="set-label alice" style="margin-top:0.75rem">Blinded elements X_i = α · H(a_i) sent to Bob:</div>
        <ul class="element-list">
          ${r1.blindedElements
            .map((pt, i) => `<li class="blinded" title="Blinded(${esc(aliceSet[i])})">X_${i+1} = ${truncateHex(pointToHex(pt))}</li>`)
            .join('')}
        </ul>
        <div class="status info">Bob sees 3 random-looking curve points. He cannot recover Alice's emails.</div>`;
    },

    // Step 2 — Bob Round 2
    () => {
      if (!r1) return '<p class="status error">Run Step 1 first</p>';
      r2 = bobRound2(r1, bobSet);
      const bScalarHex = Array.from(r2.bobScalar)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `
        <h3><span class="step-counter">2</span>Bob — Round 2: Double-blind + blind his own</h3>
        <p>Bob picks fresh β, computes Y_i = β · X_i (double-blinded Alice's), and Z_j = β · H(b_j) (his own).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">β (private, NEVER sent):</span>
            <button class="scalar-btn" aria-pressed="false" aria-label="Reveal private scalar (click to toggle)">${bScalarHex}</button>
          </div>
        </div>
        <div class="card-row">
          <div>
            <div class="set-label" style="color:var(--double-blinded)">Y_i = β · X_i (sent to Alice)</div>
            <ul class="element-list">
              ${r2.doubleBlindedAliceElements
                .map((pt) => `<li class="double-blinded">Y = ${truncateHex(pointToHex(pt))}</li>`)
                .join('')}
            </ul>
          </div>
          <div>
            <div class="set-label bob">Z_j = β · H(b_j) (sent to Alice, shuffled)</div>
            <ul class="element-list">
              ${r2.bobBlindedElements
                .map((pt) => `<li class="blinded">Z = ${truncateHex(pointToHex(pt))}</li>`)
                .join('')}
            </ul>
          </div>
        </div>
        <div class="status info">Alice can't learn Bob's emails. Bob can't link Y_i back to Alice's emails.</div>`;
    },

    // Step 3 — Alice Round 3
    () => {
      if (!r1 || !r2) return '<p class="status error">Run Steps 1 & 2 first</p>';
      const result = aliceRound3(r1, r2, aliceSet);
      return `
        <h3><span class="step-counter">3</span>Alice — Round 3: Double-blind Bob's and match</h3>
        <p>Alice computes W_j = α · Z_j = αβ · H(b_j). Then checks if any Y_i equals some W_j.</p>
        <div class="set-label" style="color:var(--double-blinded)">W_j = α · Z_j (αβ · H(b_j))</div>
        <ul class="element-list" style="margin-bottom:0.75rem">
          ${r2.bobBlindedElements
            .map((Z, j) => {
              const W = scalarMul(r1!.aliceScalar, Z);
              return `<li class="double-blinded">W_${j+1} = ${truncateHex(pointToHex(W))}</li>`;
            })
            .join('')}
        </ul>
        <div class="status ok">
          Intersection (Y_i matched some W_j):
          ${result.intersection.length > 0
            ? result.intersection.map((el) => `<div class="intersection-item">${esc(el)}</div>`).join('')
            : '<span style="color:var(--text-muted)">∅ (empty)</span>'}
        </div>
        <div class="info-grid" style="margin-top:0.75rem">
          <span class="info-label">Alice learned Bob's set size:</span>
          <span class="info-value bob">${result.aliceLearnedBobSize}</span>
          <span class="info-label">Bob learned Alice's set size:</span>
          <span class="info-value alice">${result.bobLearnedAliceSize}</span>
        </div>`;
    },

    // Step 4 — Verification
    () => {
      if (!r1 || !r2) return '<p class="status error">Run Steps 1-3 first</p>';
      const result = aliceRound3(r1, r2, aliceSet);
      const check = verifyCorrectness(aliceSet, bobSet, result);
      return `
        <h3><span class="step-counter">4</span>Verification</h3>
        <p>Compare PSI output to the plain-text intersection (honest verifier check — not a security feature).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">Expected intersection:</span>
            <span class="info-value match">${check.expected.join(', ') || '∅'}</span>
            <span class="info-label">PSI intersection:</span>
            <span class="info-value match">${check.actual.join(', ') || '∅'}</span>
            <span class="info-label">Correct:</span>
            <span class="info-value ${check.matches ? 'match' : 'private'}">${check.matches ? '✓ YES' : '✗ NO'}</span>
          </div>
        </div>
        <div class="status ok">
          The DH-PSI protocol correctly computed A ∩ B without either party
          revealing their non-intersection elements.
        </div>`;
    },
  ];

  function render(): void {
    panel.innerHTML = steps[step]();
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

  runBtn.addEventListener('click', () => {
    const aliceSet = aliceTa.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const bobSet = bobTa.value.split('\n').map((s) => s.trim()).filter(Boolean);

    if (aliceSet.length === 0 || bobSet.length === 0) {
      output.innerHTML = '<div class="status error">Both sets must be non-empty.</div>';
      return;
    }

    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running…</span> Running…';
    output.innerHTML = `<div class="status info" role="status">Running DH-PSI (${aliceSet.length} × ${bobSet.length} elements)…</div>`;

    setTimeout(() => {
      const result = runPSI(aliceSet, bobSet);
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
        </div>`;

      runBtn.disabled = false;
      runBtn.textContent = 'Run PSI';
    }, 50);
  });
}

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
// HTML template
// ---------------------------------------------------------------------------

const appEl = document.getElementById('app')!;
appEl.innerHTML = `
<a href="#main-content" class="skip-link">Skip to main content</a>
<header>
  <h1>PSI Gate</h1>
  <p>
    Private Set Intersection — compute A ∩ B without either party
    learning non-matching elements.
    <span class="security-note">Semi-honest secure only</span>
  </p>
  <p style="font-size:0.8rem;margin-top:0.25rem">
    DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 · No backends
  </p>
</header>

<nav aria-label="Demo exhibits">
  <div role="tablist" aria-label="Demo exhibits">
    <button id="tab-1" role="tab" aria-selected="true"  aria-controls="exhibit-1" tabindex="0"  class="tab-btn active">1. Contact Discovery</button>
    <button id="tab-2" role="tab" aria-selected="false" aria-controls="exhibit-2" tabindex="-1" class="tab-btn">2. Protocol Walkthrough</button>
    <button id="tab-3" role="tab" aria-selected="false" aria-controls="exhibit-3" tabindex="-1" class="tab-btn">3. Live Simulator</button>
    <button id="tab-4" role="tab" aria-selected="false" aria-controls="exhibit-4" tabindex="-1" class="tab-btn">4. Attacks</button>
    <button id="tab-5" role="tab" aria-selected="false" aria-controls="exhibit-5" tabindex="-1" class="tab-btn">5. Real-World</button>
  </div>
</nav>

<main id="main-content">
<!-- ── Exhibit 1 ── -->
<section id="exhibit-1" role="tabpanel" aria-labelledby="tab-1" class="exhibit active">
  <h2>The Contact Discovery Problem</h2>
  <p>
    You just downloaded <strong>PrayerWarriors.Mobi</strong>. Which of your 8 trusted
    prayer partners are already on the app? The naive solution sends your entire address
    book to the server — a privacy violation. PSI solves this.
  </p>
  <div class="card-row">
    <div>
      <div class="set-label alice">Your Contacts (Alice)</div>
      <ul id="e1-alice-list" class="element-list" aria-label="Alice's contacts"></ul>
    </div>
    <div>
      <div class="set-label bob">App User Database (Bob / Server)</div>
      <ul id="e1-bob-list" class="element-list" aria-label="Server's user database"></ul>
    </div>
  </div>
  <div style="margin-top:1rem">
    <button id="e1-run" class="btn primary">Run Private Set Intersection</button>
  </div>
  <div id="e1-output" aria-live="polite" aria-atomic="true"></div>
  <div class="card" style="margin-top:1rem">
    <div class="info-grid">
      <span class="info-label">Naive approach:</span>
      <span class="info-value private">Send all 8 contacts to server → server learns your full address book</span>
      <span class="info-label">PSI approach:</span>
      <span class="info-value match">Cryptographically blind contacts → server learns only the intersection size</span>
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
    <button id="e2-prev" class="btn">← Prev</button>
    <span id="e2-step" style="align-self:center;color:var(--text-muted);font-size:0.85rem" aria-live="polite"></span>
    <button id="e2-next" class="btn primary">Next →</button>
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
  <div style="margin-top:0.75rem">
    <button id="e3-run" class="btn primary">Run PSI</button>
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
    <button id="e4-a1-run" class="btn danger">Simulate Inflation</button>
    <div id="e4-a1-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 2 — Dictionary Attack on Small Domains</h3>
    <p>
      If Alice's elements come from a small domain (4-digit PINs, short codes),
      Bob can enumerate the entire domain as his set and learn Alice's full set.
    </p>
    <button id="e4-a2-run" class="btn danger">Simulate Dictionary Attack</button>
    <div id="e4-a2-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 3 — Scalar Reuse Across Sessions</h3>
    <p>
      If Alice reuses α across two PSI sessions, Bob can link the sessions and
      detect which elements changed — even without reading any element values.
    </p>
    <button id="e4-a3-run" class="btn danger">Simulate Scalar Reuse</button>
    <div id="e4-a3-output" aria-live="polite" aria-atomic="true"></div>
  </div>
</section>

<!-- ── Exhibit 5 ── -->
<section id="exhibit-5" role="tabpanel" aria-labelledby="tab-5" class="exhibit">
  <h2>Real-World PSI Deployments</h2>
  <div id="e5-selftest" aria-live="polite" aria-atomic="true"></div>

  <div class="deployment-grid" style="margin-top:1rem">
    <div class="deployment-card">
      <h4>Signal — Contact Discovery</h4>
      <p>SGX enclave + OPRF-based PSI. Processes millions of contacts per query
      without the server learning them. Open-source: signalapp/ContactDiscoveryService.</p>
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
      <h4>DP3T / Google-Apple Exposure Notification</h4>
      <p>COVID-19 contact tracing via Bluetooth proximity. PSI with ephemeral IDs.
      Decentralized — no government server sees your contacts.</p>
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
      becomes known. This is exactly the Signal model, adapted for prayer.
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
</main>

<footer>
  <p>DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 via @noble/curves</p>
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

// Scalar-btn: reveal on click/keyboard via event delegation
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('.scalar-btn');
  if (!btn) return;
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
  btn.classList.toggle('revealed', !pressed);
});
