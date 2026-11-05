import { describe, expect, it } from 'vitest';

import { esc } from '../src/escape';

/**
 * `esc` fed `&<>` only. That is enough for element text — where most of its
 * call sites are, including every one that renders a user-entered set element
 * (`<li>`, `<span>`, `<code>`) — and not enough for the two attribute
 * positions: `title="${esc(stageLabel)} of ${esc(el)} …"` on the exhibit-2
 * stage chips and `aria-label="${esc(aria)}"` on the ristretto histograms.
 * CodeQL reported js/incomplete-html-attribute-sanitization once for each.
 *
 * REACHABILITY, traced before calling it anything: neither attribute receives
 * user input. Exhibit 2's sets are literal arrays declared in main.ts, and the
 * histogram's `aria` is a template interpolating a count. The user-entered sets
 * from exhibit 3's textareas reach only text contexts. Defence in depth — and
 * the escaper is shared, so hardening it is what protects the next caller that
 * moves one of those values into an attribute.
 */
describe('esc', () => {
  it('escapes the quote that would close an attribute', () => {
    expect(esc('a" onmouseover="x()')).toBe('a&quot; onmouseover=&quot;x()');
    expect(esc("a' onmouseover='x()")).toBe('a&#39; onmouseover=&#39;x()');
  });

  it('still escapes the three it always did', () => {
    expect(esc('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
  });

  it('replaces the ampersand first, so nothing is double-encoded', () => {
    expect(esc('&quot;')).toBe('&amp;quot;');
  });

  it('leaves no character that could terminate a quoted attribute', () => {
    const hostile = `" onfocus="alert(1)" x='y' <img src=x> & done`;
    const escaped = esc(hostile);
    for (const ch of ['"', "'", '<', '>']) {
      expect(escaped.includes(ch), `output still contains ${ch}`).toBe(false);
    }
  });

  it('encodes only into references the parser decodes back', () => {
    // Why rendering is unchanged, checked by construction: each replacement is
    // a named or numeric reference for exactly the character it replaced, with
    // the trailing semicolon that attribute values need.
    for (const [raw, entity] of [
      ['&', '&amp;'],
      ['<', '&lt;'],
      ['>', '&gt;'],
      ['"', '&quot;'],
      ["'", '&#39;'],
    ] as Array<[string, string]>) {
      expect(esc(raw), raw).toBe(entity);
      expect(entity.endsWith(';'), entity).toBe(true);
    }
  });
});
