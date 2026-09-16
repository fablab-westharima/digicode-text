// DuoTone themes (simurai, MIT — see LICENSE-duotone.txt).
//
// Where the colours come from
// ---------------------------
// Each theme's palette was read from the theme repo's own styles/colors.less (branch master):
//   Dark   https://raw.githubusercontent.com/simurai/duotone-dark-syntax/master/styles/colors.less
//   Sea    https://raw.githubusercontent.com/simurai/duotone-dark-sea-syntax/master/styles/colors.less
//   Space  https://raw.githubusercontent.com/simurai/duotone-dark-space-syntax/master/styles/colors.less
//   Earth  https://raw.githubusercontent.com/simurai/duotone-dark-earth-syntax/master/styles/colors.less
// Sea / Space / Earth declare @uno-1..5 and @duo-1..3 as hsl() literals there. Dark's colors.less
// declares only @syntax-hue and the base colours; its uno/duo scales are produced at runtime by
// lib/duotone.coffee from the package.json configSchema defaults (uno #a59ccc, duo #ffe685) via
// chroma-js, so those five/three values were reproduced with chroma-js 1.1.1 using the same code.
//
// The resolved hex values live in web/app.css, in the `:root` / `:root[data-theme=...]` blocks —
// that file is the single place in the product that holds a literal colour. This module reads them
// back out of the cascade, so a Monaco theme can never drift from the CSS it sits next to.

export const THEME_KEY = 'digicode-text.theme.v1';
export const DEFAULT_THEME = 'duotone-dark';

export const THEMES = [
  { id: 'duotone-dark', name: 'DuoTone Dark（紫×金）', repo: 'simurai/duotone-dark-syntax' },
  { id: 'duotone-sea', name: 'DuoTone Sea（青×緑）', repo: 'simurai/duotone-dark-sea-syntax' },
  { id: 'duotone-space', name: 'DuoTone Space（青紫×橙）', repo: 'simurai/duotone-dark-space-syntax' },
  { id: 'duotone-earth', name: 'DuoTone Earth（茶×橙）', repo: 'simurai/duotone-dark-earth-syntax' },
];
const ids = new Set(THEMES.map(t => t.id));
export const isTheme = (id) => ids.has(id);

// Monaco wants #rrggbb / #rrggbbaa without the leading-hash case mattering, but not empty strings.
function readVars(names) {
  const style = getComputedStyle(document.documentElement);
  const out = {};
  for (const name of names) out[name] = style.getPropertyValue('--' + name).trim();
  return out;
}

const VARS = ['uno-1', 'uno-2', 'uno-3', 'uno-4', 'uno-5', 'duo-1', 'duo-2', 'duo-3',
  'bg-editor', 'line-highlight', 'selection', 'syntax-guide', 'accent', 'danger'];

// DuoTone's rule: two hues carry meaning, everything structural sinks into the uno scale.
// keyword / storage type / preprocessor -> duo-1, function name / string -> duo-2,
// number / constant -> duo-3, comment -> uno-5, punctuation / operator / bracket -> uno-4,
// variable and plain text -> uno-2.
function monacoTheme(c) {
  const rules = [
    ['', c['uno-2']],
    ['identifier', c['uno-2']],
    ['variable', c['uno-2']],
    ['variable.predefined', c['uno-2']],
    ['keyword', c['duo-1']],
    ['keyword.directive', c['duo-1']],
    ['keyword.directive.define', c['duo-1']],
    ['keyword.flow', c['duo-1']],
    ['type', c['duo-1']],
    ['type.identifier', c['duo-1']],
    ['annotation', c['duo-1']],
    ['metatag', c['duo-1']],
    ['metatag.include', c['duo-1']],
    ['metatag.content', c['duo-2']],
    ['string', c['duo-2']],
    ['string.escape', c['duo-2']],
    ['string.escape.invalid', c['danger']],
    ['identifier.function', c['duo-2']],
    ['function', c['duo-2']],
    ['number', c['duo-3']],
    ['number.float', c['duo-3']],
    ['number.hex', c['duo-3']],
    ['number.binary', c['duo-3']],
    ['number.octal', c['duo-3']],
    ['constant', c['duo-3']],
    ['comment', c['uno-5']],
    ['comment.doc', c['uno-5']],
    ['delimiter', c['uno-4']],
    ['delimiter.parenthesis', c['uno-4']],
    ['delimiter.square', c['uno-4']],
    ['delimiter.curly', c['uno-4']],
    ['delimiter.angle', c['uno-4']],
    ['operator', c['uno-4']],
    ['operators', c['uno-4']],
    ['invalid', c['danger']],
  ];
  return {
    base: 'vs-dark',
    inherit: true,
    rules: rules.map(([token, foreground]) => ({ token, foreground: foreground.replace('#', '') })),
    colors: {
      'editor.background': c['bg-editor'],
      'editor.foreground': c['uno-2'],
      'editorLineNumber.foreground': c['uno-5'],
      'editorLineNumber.activeForeground': c['uno-3'],
      'editor.lineHighlightBackground': c['line-highlight'],
      'editor.lineHighlightBorder': c['line-highlight'],
      'editor.selectionBackground': c['selection'],
      'editor.inactiveSelectionBackground': c['selection'],
      'editor.selectionHighlightBackground': c['selection'],
      'editorIndentGuide.background': c['syntax-guide'],
      'editorIndentGuide.activeBackground': c['uno-4'],
      'editorWhitespace.foreground': c['syntax-guide'],
      'editorRuler.foreground': c['syntax-guide'],
      'editorCursor.foreground': c['accent'],
      'editorBracketMatch.background': c['selection'],
      'editorBracketMatch.border': c['uno-4'],
      // DuoTone sinks brackets into the uno scale, so the rainbow pair colours are turned off by
      // giving every nesting level the same low-contrast grade punctuation already uses.
      'editorBracketHighlight.foreground1': c['uno-4'],
      'editorBracketHighlight.foreground2': c['uno-4'],
      'editorBracketHighlight.foreground3': c['uno-4'],
      'editorBracketHighlight.foreground4': c['uno-4'],
      'editorBracketHighlight.foreground5': c['uno-4'],
      'editorBracketHighlight.foreground6': c['uno-4'],
      'editorBracketHighlight.unexpectedBracket.foreground': c['danger'],
      'editorGutter.background': c['bg-editor'],
      'editorWidget.background': c['bg-editor'],
      'editorWidget.border': c['uno-5'],
      'editorSuggestWidget.background': c['bg-editor'],
      'editorSuggestWidget.border': c['uno-5'],
      'editorSuggestWidget.selectedBackground': c['selection'],
      'editorHoverWidget.background': c['bg-editor'],
      'editorHoverWidget.border': c['uno-5'],
      'diffEditor.insertedTextBackground': c['selection'],
      'scrollbarSlider.background': c['selection'],
      'scrollbarSlider.hoverBackground': c['selection'],
      'scrollbarSlider.activeBackground': c['selection'],
    },
  };
}

export function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && isTheme(saved)) return saved;
  } catch { /* storage may be denied; the default still renders */ }
  return DEFAULT_THEME;
}

// Switching is one DOM attribute plus one Monaco theme. The Monaco theme is (re)defined from the
// CSS custom properties that the new data-theme just brought into effect, so the two cannot differ.
export function setupThemes(monaco) {
  let current = null;
  function apply(id, { save = false } = {}) {
    const theme = isTheme(id) ? id : DEFAULT_THEME;
    document.documentElement.dataset.theme = theme;
    monaco.editor.defineTheme(theme, monacoTheme(readVars(VARS)));
    monaco.editor.setTheme(theme);
    document.documentElement.dataset.monacoTheme = theme;
    current = theme;
    if (save) { try { localStorage.setItem(THEME_KEY, theme); } catch { /* keep the applied theme */ } }
    return theme;
  }
  apply(readTheme());
  return { apply, get current() { return current; } };
}
