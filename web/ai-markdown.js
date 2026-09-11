import MarkdownIt from 'markdown-it';

// Only the parser's generated HTML is inserted. Raw HTML and image loading are disabled.
const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
md.validateLink = href => {
  try { return ['https:', 'http:'].includes(new URL(href).protocol); } catch { return false; }
};
md.renderer.rules.image = (tokens, i) => md.utils.escapeHtml(`[画像: ${tokens[i].content}]`);
const linkOpen = md.renderer.rules.link_open || ((tokens, i, options, env, renderer) => renderer.renderToken(tokens, i, options));
md.renderer.rules.link_open = (tokens, i, options, env, renderer) => {
  tokens[i].attrSet('target', '_blank');
  tokens[i].attrSet('rel', 'noopener noreferrer');
  return linkOpen(tokens, i, options, env, renderer);
};
export function renderMarkdown(element, text) { element.innerHTML = md.render(text); }
