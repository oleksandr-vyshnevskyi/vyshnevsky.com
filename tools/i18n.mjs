import { parse, NodeType } from "node-html-parser";
export const norm = s => s.replace(/\s+/g, ' ').trim();
export const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'code']);
export const INLINE = new Set(['strong', 'em', 'b', 'i', 'a', 'br', 'span', 'wbr']);
export const ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'data-name', 'data-type', 'data-desc'];
const hasText = s => /[A-Za-z]{2}/.test(s);
const isMixed = el => {
  let inline = 0, text = 0;
  for (const n of el.childNodes) {
    if (n.nodeType === NodeType.TEXT_NODE) { if (hasText(n.rawText)) text++; }
    else if (n.nodeType === NodeType.ELEMENT_NODE) {
      const t = n.rawTagName.toLowerCase();
      if (!INLINE.has(t)) return false;
      if (n.querySelector('svg') && !hasText(n.text)) continue;
      inline++;
    }
  }
  return inline > 0 && text > 0;
};
export function visit(root, { onText, onBlock, onAttr }) {
  const walk = el => {
    for (const n of el.childNodes) {
      if (n.nodeType === NodeType.TEXT_NODE) {
        const k = norm(n.rawText);
        if (k && hasText(k)) onText(n, k);
      } else if (n.nodeType === NodeType.ELEMENT_NODE) {
        const tag = n.rawTagName.toLowerCase();
        if (SKIP.has(tag)) continue;
        for (const a of ATTRS) { const v = n.getAttribute(a); if (v && hasText(v)) onAttr(n, a, norm(v)); }
        if (tag === 'meta') {
          const name = n.getAttribute('name') || n.getAttribute('property') || '';
          if (/description|title|image:alt/.test(name) && n.getAttribute('content')) onAttr(n, 'content', norm(n.getAttribute('content')));
          continue;
        }
        if (tag === 'title') { onText(n.firstChild, norm(n.text)); continue; }
        if (isMixed(n)) { onBlock(n, norm(n.innerHTML)); continue; }
        walk(n);
      }
    }
  };
  walk(root);
}
export { parse };
