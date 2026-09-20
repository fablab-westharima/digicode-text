import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openSettings } from './shell.js';

const THEME_KEY = 'digicode-text.theme.v1';
const THEMES = ['duotone-dark', 'duotone-sea', 'duotone-space', 'duotone-earth',
  'agila-oceanic', 'agila-origin', 'agila-dracula', 'agila-monokai', 'agila-cobalt',
  'agila-classic', 'agila-neon',
  'material-default', 'material-darker', 'material-palenight'];
const LAST = THEMES[THEMES.length - 1];
// 一覧の行の id（= data-theme の値）を並び順に。<select> の option value 列の代わり。
const listed = (page) => page.locator('#theme-select li').evaluateAll(els => els.map(el => el.dataset.themeId));
const pickTheme = (page, id) => page.click(`#theme-select li[data-theme-id="${id}"] .theme-item`);

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  // Monaco colours a line only once it has tokenized it; wait for the first coloured token.
  await expect(page.locator('.view-line span[class*="mtk"]').first()).toBeVisible();
}
const cssVar = (page, name) => page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
const rgb = (hex) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
// Colours Monaco actually painted: the editor background plus every token colour on screen.
const painted = (page) => page.evaluate(() => ({
  background: getComputedStyle(document.querySelector('.monaco-editor .monaco-editor-background')).backgroundColor,
  tokens: [...new Set([...document.querySelectorAll('.view-line span[class*="mtk"]')].map(s => getComputedStyle(s).color))],
}));

test('Switching theme moves the CSS variables and the Monaco theme together, and is remembered', async ({ page }) => {
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'duotone-dark');
  await openSettings(page);
  expect(await listed(page)).toEqual(THEMES);
  // 系統の括りは、ボード一覧のメーカー区切りと同じ型で出る。
  expect(await page.locator('#theme-select h4.board-vendor').allTextContents())
    .toEqual(['DuoTone', 'Agila', 'Material']);

  const seen = [];
  for (const theme of THEMES) {
    await openSettings(page);
    await pickTheme(page, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    // 選んだ行だけが選択中になる。
    expect(await page.locator('#theme-select .theme-item[aria-current="true"]')
      .evaluateAll(els => els.map(el => el.closest('li').dataset.themeId))).toEqual([theme]);
    // The Monaco theme is switched with the attribute, not left on the previous one.
    await expect(page.locator('html')).toHaveAttribute('data-monaco-theme', theme);
    await expect(page.locator('.monaco-editor')).toHaveClass(/vs-dark/);

    // Monaco's canvas is painted from this theme's own variables: the editor background is
    // --bg-editor and the keyword hue --duo-1 is among the token colours on screen.
    const keyword = rgb(await cssVar(page, '--duo-1'));
    await expect.poll(async () => (await painted(page)).tokens).toContain(keyword);
    const shown = await painted(page);
    expect(shown.background).toBe(rgb(await cssVar(page, '--bg-editor')));
    // The chrome moved too: the status bar uses this theme's --bg-statusbar.
    expect(await page.locator('.status-bar').evaluate(el => getComputedStyle(el).backgroundColor))
      .toBe(rgb(await cssVar(page, '--bg-statusbar')));
    // Every theme is a distinct palette, not the same one under several names.
    expect(seen).not.toContainEqual(shown.background);
    seen.push(shown.background);

    expect(await page.evaluate(k => localStorage.getItem(k), THEME_KEY)).toBe(theme);
  }

  // The chosen theme survives a reload, in the CSS and in Monaco.
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('data-theme', LAST);
  await expect(page.locator('html')).toHaveAttribute('data-monaco-theme', LAST);
  await openSettings(page);
  await expect(page.locator(`#theme-select li[data-theme-id="${LAST}"] .theme-item`))
    .toHaveAttribute('aria-current', 'true');
  expect((await painted(page)).background).toBe(rgb(await cssVar(page, '--bg-editor')));

  // An unknown stored value falls back to the default without being overwritten.
  await page.evaluate(k => localStorage.setItem(k, 'solarized-light'), THEME_KEY);
  await page.reload();
  await expect(page.locator('#build')).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'duotone-dark');
  expect(await page.evaluate(k => localStorage.getItem(k), THEME_KEY)).toBe('solarized-light');
});

test('app.css writes colour literals only where the themes are defined', async () => {
  const css = await readFile(new URL('../web/app.css', import.meta.url), 'utf8');
  // Drop comments, then the `:root` / `:root[data-theme=...]` declaration blocks: those are the
  // only place a raw colour may appear. Everything else must reach colour through a variable.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:root[^{}]*\{[^{}]*\}/g, '');
  const literal = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(|(?<![\w-])(?:white|black|red|green|blue|yellow|orange|purple|gray|grey|silver|navy|teal|olive|maroon|lime|aqua|fuchsia)(?![\w-])/g;
  const offenders = [];
  for (const line of rules.split('\n')) {
    const found = line.match(literal);
    if (found) offenders.push(`${found.join(' ')}  <-  ${line.trim()}`);
  }
  expect(offenders).toEqual([]);

  // And every theme block really is there, each defining the full token set.
  for (const theme of THEMES) {
    const block = css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`))
      ?? (theme === 'duotone-dark' ? css.match(/:root,\s*\n:root\[data-theme="duotone-dark"\]\s*\{([^}]*)\}/) : null);
    expect(block, theme).toBeTruthy();
    for (const token of ['--uno-1', '--uno-2', '--uno-3', '--uno-4', '--uno-5', '--duo-1', '--duo-2', '--duo-3',
      '--syntax-bg', '--syntax-fg', '--syntax-guide', '--syntax-accent',
      '--bg-editor', '--bg-panel', '--bg-sidebar', '--bg-activity', '--bg-statusbar',
      '--border', '--fg', '--fg-muted', '--accent', '--accent-2', '--danger']) {
      expect(block[1], `${theme} ${token}`).toContain(`${token}:`);
    }
  }
});

test('Body text reaches 7:1 and secondary text 4.5:1 on every surface, in every theme', async ({ page }) => {
  await ready(page);
  const contrast = await page.evaluate(async (themes) => {
    const parse = (value) => value.trim().startsWith('#')
      ? [1, 3, 5].map(i => parseInt(value.trim().slice(i, i + 2), 16))
      : value.match(/\d+/g).slice(0, 3).map(Number);
    const lum = (c) => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(parse(a)), lum(parse(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const get = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const out = {};
    for (const theme of themes) {
      document.documentElement.dataset.theme = theme;
      out[theme] = {};
      for (const surface of ['--bg-editor', '--bg-panel', '--bg-sidebar', '--bg-activity', '--bg-statusbar']) {
        out[theme][surface] = { fg: ratio(get('--fg'), get(surface)), muted: ratio(get('--fg-muted'), get(surface)) };
      }
    }
    return out;
  }, THEMES);
  for (const [theme, surfaces] of Object.entries(contrast)) {
    for (const [surface, { fg, muted }] of Object.entries(surfaces)) {
      expect(fg, `${theme} --fg on ${surface}`).toBeGreaterThanOrEqual(7);
      expect(muted, `${theme} --fg-muted on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});
