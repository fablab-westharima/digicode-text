// Interpret common description markup as text, never as a DOM document.
// Unknown tags stay literal so C++ templates/includes are not stripped.
const blocks = new Set('address article aside blockquote dd div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table tbody td th thead tr ul'.split(' '));
const inline = new Set('a abbr acronym b bdi bdo big button caption cite code col colgroup del details dfn em font i img input ins kbd label link mark meta option picture q s samp select small source span strike strong sub summary sup textarea time tt u var video audio iframe object embed wbr'.split(' '));

export function descriptionText(value) {
  let text = String(value ?? '')
    .replace(/<!--(?:[\s\S]*?-->|[\s\S]*$)/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ')
    .replace(/<\/?([a-z][a-z0-9]*)(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/gi, (tag, name) => {
      name = name.toLowerCase();
      if (name === 'br' || blocks.has(name)) return '\n';
      return inline.has(name) ? '' : tag;
    });
  // Only a single entity token (no '<' or attributes) enters this inert decoder.
  // Decoded output is not parsed again, including encoded markup examples.
  const decoder = document.createElement('textarea');
  text = text.replace(/&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/gi, entity => {
    decoder.innerHTML = entity;
    return decoder.value;
  });
  return text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
