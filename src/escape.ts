/**
 * Escape for HTML text AND for a quoted attribute value.
 *
 * The quotes are what was missing. This replaced `&`, `<` and `>` only, which
 * is enough for element text — where most of its ~18 call sites are, including
 * every one that handles a user-entered set element — and not enough for the
 * two attribute positions in main.ts: a `title="..."` on the exhibit-2 stage
 * chips and an `aria-label="..."` on the ristretto histograms. CodeQL reported
 * js/incomplete-html-attribute-sanitization once for each.
 *
 * Escaping them changes nothing a reader sees: `&quot;` and `&#39;` are
 * references the HTML parser maps back to the characters themselves, in text
 * and in attribute values alike. `&` is replaced first so nothing is
 * double-encoded.
 */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
