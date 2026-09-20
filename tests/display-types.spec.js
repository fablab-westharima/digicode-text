import { test, expect } from '@playwright/test';
import { openExplorer, openBoards, openSettings, openAI, fileMenu } from './shell.js';

// 表示の型（web/app.css の「共通の表示規則」、見本は web/styleguide.html）が全 view の実要素に
// 当たっていることの確認。期待値をこの file に数値で書かない：同じページの、実要素と同じ親の中に
// 型の class だけを付けた参照要素を一時的に足し、その計算済みスタイルと実要素の計算済みスタイルを
// 比べる。型（app.css）を変えれば期待値も一緒に動くので、この test が見るのは
// 「型と view が一致しているか」だけになる。
//
// 参照を同じ親に置くのは、継承値（font-size / color / line-height）と容れ物の規則
// （例 .output-heading p、.detail-box の 12px）を両方に等しく効かせるため。裏返すと、
// 容れ物の側で型から外れている分はこの比べ方では出ない。出るのは要素そのものの規則の差だけ。

// 比べるプロパティ。height は中身で決まる（行は折り返し、見出しは字数）ので既定では見ない。
// ボタンだけ props に 'height' を足して、型の var(--row)=28px / compact の 24px を確かめる。
const PROPS = [
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
  'minHeight',
];
const BUTTON_PROPS = [...PROPS, 'height'];
// 色だけの部分集合（全テーマを回すとき用）。
const COLOURS = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', '::before color', '::after color'];
// 文字の色を変えると、枠の色（border-color の初期値は currentColor）と印の色（継承）も一緒に動く。
// 「色だけが型と違う」と書きたいときに並ぶのは、この 7 つ。
const COLOUR_DERIVED = ['::after color', '::before color', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'color'];
const THEMES = ['duotone-dark', 'duotone-sea', 'duotone-space', 'duotone-earth',
  'agila-oceanic', 'agila-origin', 'agila-dracula', 'agila-monokai', 'agila-cobalt',
  'agila-classic', 'agila-neon',
  'material-default', 'material-darker', 'material-palenight', 'kronuz',
  'ayu-dark', 'ayu-mirage'];

/**
 * 実要素を測り、続けて参照要素（ref）を同じ親の末尾に足して測り、すぐ外す。
 * 実要素を先に測るのは、参照を入れたことで :first-child / :last-child の規則
 * （例 .settings-content .heading:first-child）が実要素の値を動かさないようにするため。
 */
async function probe(page, { target, nth = 0, ref, refIn, refPick, props = PROPS }) {
  // 直前に押した行やボタンの上にポインタが残っていると :hover の面（--bg-raised）を測ってしまう。
  // 測る前に必ずステータスバーの端へ逃がす（そこに hover の規則は無い）。
  await page.mouse.move(1090, 845);
  return page.evaluate(({ target, nth, ref, refIn, refPick, props }) => {
    const read = (el) => {
      const s = getComputedStyle(el);
      const out = {};
      for (const p of props) out[p] = s[p];
      // 印（✓ ▸ ▾ ⚠）は ::before / ::after が描くので、content と色と幅まで見る。
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(el, pseudo);
        out[`${pseudo} content`] = ps.content;
        out[`${pseudo} color`] = ps.color;
        out[`${pseudo} width`] = ps.width;
      }
      return out;
    };
    const found = document.querySelectorAll(target);
    const el = found[nth];
    if (!el) throw new Error(`実要素が無い: ${target} [${nth}]（${found.length} 件）`);
    const view = read(el);
    if (!ref) return { view, type: null };
    const host = refIn ? document.querySelector(refIn) : el.parentElement;
    if (!host) throw new Error(`参照の置き場が無い: ${refIn}`);
    const holder = document.createElement('template');
    holder.innerHTML = ref;
    const node = holder.content.firstElementChild;
    host.append(node);
    const type = read(refPick ? node.querySelector(refPick) : node);
    node.remove();
    return { view, type };
  }, { target, nth, ref, refIn, refPick, props });
}

/** 型と実要素の違いだけを返す。一致なら {}。 */
async function diff(page, options) {
  const { view, type } = await probe(page, options);
  const keys = (options.only ?? Object.keys(type)).filter(k => !(options.exclude ?? []).includes(k));
  const out = {};
  for (const key of keys) if (type[key] !== view[key]) out[key] = { 型: type[key], view: view[key] };
  return out;
}

const style = async (page, options) => (await probe(page, options)).view;

// ---- 型の見本（styleguide.html と同じ書き方） ----------------------------------------------
const HEADING = '<h3 class="heading">見出しの見本</h3>';
const row = (attrs = '', extra = '') => `<button type="button" class="list-row${extra}"${attrs}><strong>行の見本</strong></button>`;
// 開かない行（開閉の印を出さない変種）。
const staticRow = (attrs = '') => row(attrs, ' static');
const BOX = '<dl class="detail-box"><dt>語</dt><dd>値</dd></dl>';
const notice = (state) => `<p class="notice"${state === undefined ? '' : ` data-state="${state}"`}>知らせの見本</p>`;
const button = (className = '') => `<button type="button"${className ? ` class="${className}"` : ''}>操作</button>`;
const TABLE = '<table class="table"><thead><tr><th>見出し</th></tr></thead><tbody><tr><td>値</td></tr></tbody></table>';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
}

// ---- ライブラリ view の下ごしらえ ---------------------------------------------------------
const LIB = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3', description: 'JSON library' };
const filler = (n) => Array.from({ length: n }, (_, i) => ({ ...LIB, id: 200 + i, name: `Filler${i}` }));

async function libraryMocks(page, items = [LIB]) {
  await page.route('**/libraries/search?*', r => {
    const q = new URL(r.request().url()).searchParams.get('q');
    // 「候補」のボタンを出すために、綴り違いの問い合わせだけ 0 件で返す。
    return r.fulfill({ json: q === 'ArduinoJso' ? { items: [], total: 0 } : { items, total: items.length, more: false } });
  });
  await page.route('**/libraries/details?*', r => r.fulfill({ json: { ...LIB, frameworks: ['*'], platforms: ['*'], versions: ['7.4.3', '7.4.2'] } }));
}
async function search(page, q = 'ArduinoJson') {
  await page.fill('#library-query', q);
  await page.locator('#library-search-form button').click();
}
/** 検索 → 行を開く → 版を選ぶ → 追加、まで通す（libraries.spec.js と同じ手順）。 */
async function addLibrary(page) {
  await search(page);
  const result = page.locator('[data-library-id="64"]');
  await result.locator('.library-item').click();
  await result.getByRole('button', { name: 'バージョンを選択' }).click();
  await result.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-status')).toHaveAttribute('data-state', 'ok');
}

// =============================================================================================
test('見出し：全 view の .heading が型と一致する', async ({ page }) => {
  await ready(page);

  // エクスプローラ「プロジェクト」
  await openExplorer(page);
  expect(await diff(page, { target: '#explorer-view .heading', ref: HEADING }), 'エクスプローラ「プロジェクト」').toEqual({});

  // ライブラリ「追加済み」「検索結果」
  await libraryMocks(page);
  await page.click('#libraries-open');
  expect(await diff(page, { target: '#library-added-label', ref: HEADING }), 'ライブラリ「追加済み」').toEqual({});
  await search(page);
  await expect(page.locator('#library-results-label')).toBeVisible();
  expect(await diff(page, { target: '#library-results-label', ref: HEADING }), 'ライブラリ「検索結果」').toEqual({});

  // ボード詳細の 4 見出し（ピン・注意点・出所・書き込み）
  await openBoards(page);
  await page.locator('#board-list li[data-board-id="xiao_rp2040"] .board-item').click();
  await page.click('#board-pins-toggle');
  const boardHeadings = page.locator('#board-facts > .heading');
  expect(await boardHeadings.allTextContents()).toEqual(['ピン', '注意点', '出所', '書き込み']);
  for (let i = 0; i < 4; i++) {
    expect(await diff(page, { target: '#board-facts > .heading', nth: i, ref: HEADING }), `ボード詳細の見出し ${i}`).toEqual({});
  }

  // 取説。節の先頭の見出しは .settings-content .heading:first-child が margin-top を 0 にする
  // （節の上端に空きを作らないための置き場の都合）。そこだけ外して、0 であることを別に見る。
  await page.click('#view-help');
  await page.click('#help-nav button[data-section="libraries"]');
  expect(await diff(page, { target: '#help-libraries-title', ref: HEADING, exclude: ['marginTop'] }), '取説「ライブラリ」').toEqual({});
  expect(await style(page, { target: '#help-libraries-title' })).toMatchObject({ marginTop: '0px' });
  // 節の途中の h4 は margin まで型どおり。
  expect(await diff(page, { target: '#help-libraries h4.heading', ref: HEADING }), '取説の h4 見出し').toEqual({});
  await page.click('#help-close');

  // 設定 dialog（節の先頭の見出しだけ。設定に h4 の見出しは無い）
  await openSettings(page);
  expect(await diff(page, { target: '#settings-appearance-title', ref: HEADING, exclude: ['marginTop'] }), '設定「外観」').toEqual({});
  expect(await style(page, { target: '#settings-appearance-title' })).toMatchObject({ marginTop: '0px' });
  await page.click('#settings-nav button[data-section="ai"]');
  expect(await diff(page, { target: '#settings-ai-title', ref: HEADING, exclude: ['marginTop'] }), '設定「AI」').toEqual({});
});

// =============================================================================================
test('行：3 view の .list-row が型と一致し、互いにも一致する', async ({ page }) => {
  await ready(page);

  // --- エクスプローラ：2 件にして、選択中と選択中でない行の両方を出す
  await fileMenu(page, 'project-new');
  await page.fill('#name-input', '2 件目');
  await page.locator('#name-form button[type=submit]').click();
  await openExplorer(page);
  await expect(page.locator('.project-item')).toHaveCount(2);
  expect(await diff(page, { target: '.project-item[aria-current="false"]', ref: row(' aria-current="false"') }), 'プロジェクト 通常').toEqual({});
  const project = await style(page, { target: '.project-item[aria-current="false"]' }); // 3 view 突き合わせ用
  expect(await diff(page, { target: '.project-item[aria-current="true"]', ref: row(' aria-current="true" aria-expanded="false"') }), 'プロジェクト 選択中').toEqual({});
  await page.locator('.project-item[aria-current="true"]').click();
  await expect(page.locator('.project-item[aria-current="true"]')).toHaveAttribute('aria-expanded', 'true');
  expect(await diff(page, { target: '.project-item[aria-expanded="true"]', ref: row(' aria-current="true" aria-expanded="true"') }), 'プロジェクト 開').toEqual({});

  // --- ボード
  await openBoards(page);
  expect(await diff(page, { target: '.board-item[aria-current="false"]', ref: row(' aria-current="false" aria-expanded="false"') }), 'ボード 通常').toEqual({});
  const board = await style(page, { target: '.board-item[aria-current="false"]' });
  expect(await diff(page, { target: '.board-item[aria-current="true"]', ref: row(' aria-current="true" aria-expanded="false"') }), 'ボード 選択中').toEqual({});
  await page.locator('#board-list li[data-board-id="wio_node"] .board-item').click();
  expect(await diff(page, { target: '.board-item[aria-expanded="true"]', ref: row(' aria-current="false" aria-expanded="true"') }), 'ボード 開').toEqual({});
  // ✓ が付かない行の印の枠（content: '' で 1em ぶん確保される）。
  expect(await diff(page, { target: '.board-item > strong', ref: row(), refPick: 'strong', refIn: '#board-list' }), '印の枠').toEqual({});

  // --- ライブラリ
  await libraryMocks(page);
  await page.click('#libraries-open');
  await search(page);
  const item = page.locator('[data-library-id="64"]');
  const result = item.locator('.library-item');
  await expect(result).toBeVisible();
  expect(await diff(page, { target: '#library-results .library-item', ref: row(' aria-expanded="false"') }), 'ライブラリ 通常').toEqual({});
  const library = await style(page, { target: '#library-results .library-item' });
  await result.click();
  expect(await diff(page, { target: '#library-results .library-item', ref: row(' aria-expanded="true"') }), 'ライブラリ 開').toEqual({});
  // 追加済みの ✓ は行の子 strong の ::before。行そのものと、印を描く strong の両方を見る。
  await item.getByRole('button', { name: 'バージョンを選択' }).click();
  await item.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-results .library-item')).toHaveAttribute('data-added', 'true');
  expect(await diff(page, { target: '#library-results .library-item', ref: row(' aria-expanded="true" data-added="true"') }), 'ライブラリ 追加済み').toEqual({});
  expect(await diff(page, {
    target: '#library-results .library-item > strong', ref: row(' data-added="true"'), refPick: 'strong',
  }), '追加済みの ✓').toEqual({});
  // 追加済みの一覧の行も同じ型。
  await page.click('#library-added-toggle');
  expect(await diff(page, { target: '#library-added .library-item', ref: row(' aria-expanded="false" data-added="true"') }), '追加済み一覧の行').toEqual({});

  // --- 設定「外観」のテーマ。押すとその場で決まる開かない行なので、.static の型と比べる。
  await openSettings(page);
  expect(await diff(page, { target: '#theme-select .theme-item[aria-current="false"]', ref: staticRow(' aria-current="false"') }), 'テーマ 通常').toEqual({});
  expect(await diff(page, { target: '#theme-select .theme-item[aria-current="true"]', ref: staticRow(' aria-current="true"') }), 'テーマ 選択中').toEqual({});
  // 開閉の印そのものが出ていないこと（型と一致していても、両方に印があっては意味が無い）。
  expect(await style(page, { target: '#theme-select .theme-item[aria-current="true"]' })).toMatchObject({ '::after content': 'none' });

  // --- 3 view の「通常の行」が互いに一致する（それぞれの view が出ている間に測ったもの）
  expect(board, 'ボードの行 = プロジェクトの行').toEqual(project);
  expect(library, 'ライブラリの行 = プロジェクトの行').toEqual(project);
});

// =============================================================================================
test('箱：4 つの .detail-box と dt / dd が型と一致する', async ({ page }) => {
  await ready(page);

  // エクスプローラ
  await openExplorer(page);
  await page.locator('.project-item[aria-current="true"]').click();
  await expect(page.locator('#project-detail')).toBeVisible();
  expect(await diff(page, { target: '#project-detail', ref: BOX }), '#project-detail').toEqual({});
  expect(await diff(page, { target: '#project-detail dt', ref: BOX, refIn: '#project-list', refPick: 'dt' }), '#project-detail dt').toEqual({});
  expect(await diff(page, { target: '#project-detail dd:not([class])', ref: BOX, refIn: '#project-list', refPick: 'dd' }), '#project-detail dd').toEqual({});

  // ボード
  await openBoards(page);
  await page.locator('#board-list li[data-board-id="pico"] .board-item').click();
  expect(await diff(page, { target: '#board-detail', ref: BOX }), '#board-detail').toEqual({});
  expect(await diff(page, { target: '#board-detail dt', ref: BOX, refIn: '#board-list li[data-board-id="pico"]', refPick: 'dt' }), '#board-detail dt').toEqual({});
  expect(await diff(page, { target: '#board-detail dd', ref: BOX, refIn: '#board-list li[data-board-id="pico"]', refPick: 'dd' }), '#board-detail dd').toEqual({});

  // ライブラリ（検索結果の箱と、追加済みの箱）
  await libraryMocks(page);
  await page.click('#libraries-open');
  await addLibrary(page);
  await expect(page.locator('#library-result-detail')).toBeVisible();
  expect(await diff(page, { target: '#library-result-detail', ref: BOX }), '#library-result-detail').toEqual({});
  // dd は class の無い「Registry」の行で見る。dd.library-description / .library-unusable-reason /
  // .library-incompatible は、説明文と警告を控えめ・危険の色に振る意図した差なので対象外。
  expect(await diff(page, { target: '#library-result-detail dt', ref: BOX, refIn: '[data-library-id="64"]', refPick: 'dt' }), '#library-result-detail dt').toEqual({});
  expect(await diff(page, { target: '#library-result-detail dd:not([class])', ref: BOX, refIn: '[data-library-id="64"]', refPick: 'dd' }), '#library-result-detail dd').toEqual({});

  await page.click('#library-added-toggle');
  await page.locator('#library-added .library-item').click();
  await expect(page.locator('#library-added-detail')).toBeVisible();
  expect(await diff(page, { target: '#library-added-detail', ref: BOX }), '#library-added-detail').toEqual({});
  expect(await diff(page, { target: '#library-added-detail dt', ref: BOX, refIn: '[data-added-id="64"]', refPick: 'dt' }), '#library-added-detail dt').toEqual({});
  expect(await diff(page, { target: '#library-added-detail dd:not([class])', ref: BOX, refIn: '[data-added-id="64"]', refPick: 'dd' }), '#library-added-detail dd').toEqual({});
});

// =============================================================================================
test('通知：全 view の .notice が状態ごとに型と一致する', async ({ page }) => {
  await ready(page);

  // --- エクスプローラの知らせ 2 つ
  await openExplorer(page);
  // ok は取り込みが成功したとき。実際に取り込んで出す。
  await page.locator('#project-file').setInputFiles({
    name: 'project.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'digicode-text-project', version: 1, name: '取り込み', source: 'void setup(){}\nvoid loop(){}\n', env: 'xiao_rp2040' })),
  });
  await expect(page.locator('#project-notice')).toHaveAttribute('data-state', 'ok');
  expect(await diff(page, { target: '#project-notice', ref: notice('ok') }), '#project-notice ok').toEqual({});
  // error は断ったとき。
  await page.locator('#project-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.locator('#project-notice')).toHaveAttribute('data-state', 'error');
  expect(await diff(page, { target: '#project-notice', ref: notice('error') }), '#project-notice error').toEqual({});

  // 自動保存の失敗は localStorage を壊さないと出せないので、DOM に data-state と文を直接入れて
  // 見え方だけを見る（文を入れる経路そのものは projects.spec.js が見ている）。
  await page.evaluate(() => {
    const el = document.getElementById('project-save-message');
    el.textContent = 'このブラウザに保存できませんでした';
    el.dataset.state = 'error';
  });
  expect(await diff(page, { target: '#project-save-message', ref: notice('error') }), '#project-save-message error').toEqual({});

  // --- ライブラリの知らせ（状態なし / loading / ok / error）
  let release;
  await page.route('**/libraries/details?*', r => r.fulfill({ json: { ...LIB, frameworks: ['*'], platforms: ['*'], versions: ['7.4.3'] } }));
  await page.route('**/libraries/search?*', async r => {
    const q = new URL(r.request().url()).searchParams.get('q');
    if (q === 'hold') await new Promise(resolve => { release = resolve; });
    if (q === 'fail') return r.fulfill({ status: 502, json: { error: 'Registry に接続できません' } });
    return r.fulfill({ json: { items: [LIB], total: 1, more: false } });
  });
  await page.click('#libraries-open');
  // 開いた直後は「名前・キーワードを入力」＝状態なし。
  await expect(page.locator('#library-status')).toHaveAttribute('data-state', '');
  expect(await diff(page, { target: '#library-status', ref: notice() }), '#library-status 状態なし').toEqual({});
  // 検索中（loading）は route を保留して捕まえる。
  await search(page, 'hold');
  await expect(page.locator('#library-status')).toHaveAttribute('data-state', 'loading');
  expect(await diff(page, { target: '#library-status', ref: notice('loading') }), '#library-status loading').toEqual({});
  release();
  await expect(page.locator('#library-status')).not.toHaveAttribute('data-state', 'loading');
  await search(page, 'fail');
  await expect(page.locator('#library-status')).toHaveAttribute('data-state', 'error');
  expect(await diff(page, { target: '#library-status', ref: notice('error') }), '#library-status error').toEqual({});
  await addLibrary(page);
  expect(await diff(page, { target: '#library-status', ref: notice('ok') }), '#library-status ok').toEqual({});

  // --- 下パネルの知らせ
  await page.click('#libraries-close');
  await page.route('**/compile', r => r.fulfill({ status: 422, json: { stage: 'compile', log: 'error: mock' } }));
  await page.click('#build');
  await expect(page.locator('#status')).toHaveAttribute('data-state', 'error');
  expect(await diff(page, { target: '#status', ref: notice('error') }), '#status Build 失敗').toEqual({});
  // success は型に無い状態。view が意図して持っている差（成功の色）を、差そのものとして書く：
  // 型に落とすと ok の枠付きカードになり、帯の中の 1 行に枠は要らない。
  await page.unroute('**/compile');
  await page.route('**/compile', r => r.fulfill({ body: Buffer.alloc(512) }));
  await page.locator('#editor .view-lines').click();
  await page.keyboard.type(' ');
  await page.click('#build');
  await expect(page.locator('#status')).toHaveAttribute('data-state', 'success');
  const success = await diff(page, { target: '#status', ref: notice('success') });
  expect(Object.keys(success).sort(), '#status success は色だけが型と違う').toEqual(COLOUR_DERIVED);

  // #build-incompat と #flash-status は、置き場所の都合で margin と font-size だけを view が
  // 決めている（#build-incompat, #flash-status { margin: var(--sp-1) 10px; font-size: var(--fs-small) }）。
  // Human 承認済みの意図した差なので外す。line-height（型は var(--lh) = 1.6 の無単位）と
  // 印（✓ ⚠）の幅は font-size の帰結として一緒に動くので、同じ理由で外す。
  const PLACED = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'fontSize', 'lineHeight', '::before width'];
  // 非互換の知らせと書き込みの知らせは、実機とコンパイラの応答が要る。見え方だけを見たいので
  // data-state と文を DOM に直接入れる（文を入れる経路は libraries/rp2040-flash の spec が見ている）。
  await page.evaluate(() => {
    const incompat = document.getElementById('build-incompat');
    incompat.textContent = 'このボードでは使えないライブラリがあります';
    incompat.hidden = false;
  });
  expect(await diff(page, { target: '#build-incompat', ref: notice('error'), exclude: PLACED }), '#build-incompat').toEqual({});

  for (const [state, label] of [['complete', 'ok'], ['error', 'error'], ['write', 'loading']]) {
    await page.evaluate(([state]) => {
      const el = document.getElementById('flash-status');
      el.textContent = '書き込みの知らせ';
      el.dataset.state = state;
      el.hidden = false;
    }, [state]);
    // complete は型の ok と、途中の stage（connect / erase / write …）は型の loading と同じ見え方。
    expect(await diff(page, { target: '#flash-status', ref: notice(label), exclude: PLACED }), `#flash-status ${state}`).toEqual({});
  }

  // --- AI パネルの 2 行
  await openAI(page);
  await page.evaluate(() => {
    document.getElementById('ai-status').textContent = '変更を適用しました';
    const proposal = document.getElementById('ai-proposal');
    document.getElementById('ai-history').append(proposal); // ai.js が提案のたびに置く場所
    proposal.hidden = false;
    document.getElementById('ai-proposal-note').textContent = 'main.cpp全体の変更案。Buildは未実行です。';
  });
  // #ai-status は data-state を持たない（ai.js は文だけを入れる）。型の 3 状態には入らず、
  // 枠を付けず色だけを loading と同じ accent にする、という差を CSS 側が持っている。
  // その差を、差として書く：違うのは色と、帯に詰めるための margin と font-size だけ
  // （line-height は無単位の 1.6 なので font-size に連れて動く）。
  const aiStatus = await diff(page, { target: '#ai-status', ref: notice() });
  expect(Object.keys(aiStatus).sort(), '#ai-status の型との差').toEqual([...COLOUR_DERIVED, 'fontSize', 'lineHeight', 'marginBottom', 'marginTop'].sort());
  const loadingColour = (await probe(page, { target: '#ai-status', ref: notice('loading') })).type.color;
  expect((await style(page, { target: '#ai-status' })).color, '#ai-status の色は型の loading と同じ').toBe(loadingColour);
  // #ai-proposal-note も状態を持たない 1 行。上下の間は型どおりで、色と字の大きさだけが差。
  const proposalNote = await diff(page, { target: '#ai-proposal-note', ref: notice() });
  expect(Object.keys(proposalNote).sort(), '#ai-proposal-note の型との差').toEqual([...COLOUR_DERIVED, 'fontSize', 'lineHeight'].sort());
});

// =============================================================================================
test('ボタン：全 view の通常・主・quiet・compact が型と一致する', async ({ page }) => {
  await ready(page);

  // --- 下パネルの操作列
  await page.click('#build-tab');
  expect(await diff(page, { target: '#copy-build', ref: button('quiet compact'), props: BUTTON_PROPS }), '#copy-build').toEqual({});
  expect(await diff(page, { target: '#panel-toggle', ref: button('quiet compact'), props: BUTTON_PROPS }), '#panel-toggle').toEqual({});
  await page.click('#serial-tab');
  expect(await diff(page, { target: '#monitor', ref: button('compact'), props: BUTTON_PROPS }), '#monitor').toEqual({});
  expect(await diff(page, { target: '#serial-forget', ref: button('quiet compact'), props: BUTTON_PROPS }), '#serial-forget').toEqual({});
  await page.click('#plotter-tab');
  expect(await diff(page, { target: '#plot-pause', ref: button('compact'), props: BUTTON_PROPS }), '#plot-pause').toEqual({});
  expect(await diff(page, { target: '#plot-clear', ref: button('quiet compact'), props: BUTTON_PROPS }), '#plot-clear').toEqual({});

  // --- AI パネルの操作列
  await openAI(page);
  expect(await diff(page, { target: '#ai-latest', ref: button('quiet'), props: BUTTON_PROPS }), '#ai-latest').toEqual({});
  expect(await diff(page, { target: '#ai-clear', ref: button('quiet'), props: BUTTON_PROPS }), '#ai-clear').toEqual({});
  expect(await diff(page, { target: '#ai-context', ref: button('quiet'), props: BUTTON_PROPS }), '#ai-context').toEqual({});
  await page.evaluate(() => {
    const proposal = document.getElementById('ai-proposal');
    document.getElementById('ai-history').append(proposal);
    proposal.hidden = false;
  });
  expect(await diff(page, { target: '#ai-apply', ref: button('primary'), props: BUTTON_PROPS }), '#ai-apply（主ボタン）').toEqual({});
  expect(await diff(page, { target: '#ai-discard', ref: button(), props: BUTTON_PROPS }), '#ai-discard').toEqual({});
  expect(await diff(page, { target: '#ai-copy', ref: button(), props: BUTTON_PROPS }), '#ai-copy').toEqual({});

  // --- 詳細の箱の操作
  await openBoards(page);
  await page.locator('#board-list li[data-board-id="pico"] .board-item').click();
  expect(await diff(page, { target: '#board-select', ref: button(), props: BUTTON_PROPS }), '#board-select').toEqual({});
  expect(await diff(page, { target: '#board-pins-toggle', ref: button(), props: BUTTON_PROPS }), '#board-pins-toggle').toEqual({});

  // --- ライブラリの検索・候補・ページャ・箱の操作
  await libraryMocks(page, [LIB, ...filler(11)]);
  await page.click('#libraries-open');
  expect(await diff(page, { target: '#library-search-form button', ref: button(), props: BUTTON_PROPS }), 'ライブラリの検索ボタン').toEqual({});
  await search(page);
  await expect(page.locator('#library-next')).toBeVisible();
  expect(await diff(page, { target: '#library-next', ref: button(), props: BUTTON_PROPS }), '#library-next').toEqual({});
  await page.click('#library-next');
  await expect(page.locator('#library-prev')).toBeVisible();
  expect(await diff(page, { target: '#library-prev', ref: button(), props: BUTTON_PROPS }), '#library-prev').toEqual({});
  await page.click('#library-prev');
  const result = page.locator('[data-library-id="64"]');
  await result.locator('.library-item').click();
  expect(await diff(page, { target: '.library-version', ref: button(), props: BUTTON_PROPS }), 'ライブラリの版を選ぶボタン').toEqual({});
  await result.getByRole('button', { name: 'バージョンを選択' }).click();
  await result.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await page.click('#library-added-toggle');
  await page.locator('#library-added .library-item').click();
  expect(await diff(page, { target: '#library-added-detail .detail-actions button', ref: button(), props: BUTTON_PROPS }), 'ライブラリの削除ボタン').toEqual({});
  // 候補のボタンだけは、長い名前を折り返すために height: auto / min-height: var(--row) を持つ
  // （#library-suggestions button）。意図した差なので height は外し、min-height を見る。
  await search(page, 'ArduinoJso');
  await expect(page.locator('#library-suggestions button')).toHaveCount(1);
  expect(await diff(page, { target: '#library-suggestions button', ref: button(), props: BUTTON_PROPS, exclude: ['height'] }), 'ライブラリの候補ボタン').toEqual({});

  // --- 設定 dialog
  await page.click('#libraries-close');
  await openSettings(page);
  expect(await diff(page, { target: '#ai-settings-close', ref: button('quiet'), props: BUTTON_PROPS }), '#ai-settings-close').toEqual({});
  expect(await diff(page, { target: '#layout-reset', ref: button(), props: BUTTON_PROPS }), '#layout-reset').toEqual({});
  expect(await diff(page, { target: '#ai-save', ref: button('primary'), props: BUTTON_PROPS }), '#ai-save（主ボタン）').toEqual({});
  expect(await diff(page, { target: '#ai-use', ref: button(), props: BUTTON_PROPS }), '#ai-use').toEqual({});
  await page.click('#settings-nav button[data-section="ai"]');
  expect(await diff(page, { target: '#ai-delete', ref: button('danger'), props: BUTTON_PROPS }), '#ai-delete').toEqual({});
});

// =============================================================================================
test('表：ボード view のピン表と取説のピン表が .table と一致する', async ({ page }) => {
  await ready(page);
  // .pin-label / .pin-gpio の等幅 font-family はこの view だけの事情（GPIO 番号を読ませる）。
  // font-family は比べるプロパティに入れておらず、列そのものも .nowrap の付かない 3 列目で見る。
  const TABLE_PROPS = [...PROPS, 'borderCollapse'];

  await openBoards(page);
  await page.locator('#board-list li[data-board-id="xiao_rp2040"] .board-item').click();
  await page.click('#board-pins-toggle');
  expect(await diff(page, { target: '#board-facts .pin-table', ref: TABLE, props: TABLE_PROPS }), 'ボードのピン表').toEqual({});
  expect(await diff(page, { target: '#board-facts .pin-table th', nth: 2, ref: TABLE, refIn: '#board-facts .table-scroll', refPick: 'th' }), 'ボードのピン表 th').toEqual({});
  expect(await diff(page, { target: '#board-facts .pin-table tbody td', nth: 2, ref: TABLE, refIn: '#board-facts .table-scroll', refPick: 'td' }), 'ボードのピン表 td').toEqual({});

  await page.click('#view-help');
  await page.click('#help-nav button[data-section="boards"]');
  await expect(page.locator('#help-board-guide table.table').first()).toBeVisible();
  expect(await diff(page, { target: '#help-board-guide table.table', ref: TABLE, props: TABLE_PROPS }), '取説のピン表').toEqual({});
  expect(await diff(page, { target: '#help-board-guide table.table th', nth: 2, ref: TABLE, refIn: '#help-board-guide .table-scroll', refPick: 'th' }), '取説のピン表 th').toEqual({});
  expect(await diff(page, { target: '#help-board-guide table.table tbody td', nth: 2, ref: TABLE, refIn: '#help-board-guide .table-scroll', refPick: 'td' }), '取説のピン表 td').toEqual({});
});

// =============================================================================================
test('テーマ：どの配色でも、色に関わる型が view と一致する', async ({ page }) => {
  await ready(page);
  // 1 ページで見る所をひととおり開いてから、テーマだけを差し替えて同じ比べ方を繰り返す。
  await libraryMocks(page);
  await page.click('#libraries-open');
  await addLibrary(page); // #library-status を ok に
  await openBoards(page);
  await page.locator('#board-list li[data-board-id="xiao_rp2040"] .board-item').click();
  await page.click('#board-pins-toggle'); // 箱の中の見出しを出す
  await openAI(page);

  for (const theme of THEMES) {
    await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    // 行の選択
    expect(await diff(page, { target: '.board-item[aria-current="true"]', ref: row(' aria-current="true" aria-expanded="false"'), only: COLOURS }), `${theme} 選択中の行`).toEqual({});
    expect(await diff(page, { target: '.board-item[aria-current="false"]', ref: row(' aria-current="false" aria-expanded="false"'), only: COLOURS }), `${theme} 通常の行`).toEqual({});
    // 見出しの縦線
    expect(await diff(page, { target: '#board-facts > .heading', ref: HEADING, only: ['color', 'borderLeftColor'] }), `${theme} 見出し`).toEqual({});
    // 知らせ ok / error（ライブラリ view は隠れているが、色は描画に関わらず解決する）
    await page.evaluate(() => { document.getElementById('library-status').dataset.state = 'ok'; });
    expect(await diff(page, { target: '#library-status', ref: notice('ok'), only: COLOURS }), `${theme} 知らせ ok`).toEqual({});
    await page.evaluate(() => { document.getElementById('library-status').dataset.state = 'error'; });
    expect(await diff(page, { target: '#library-status', ref: notice('error'), only: COLOURS }), `${theme} 知らせ error`).toEqual({});
    // 主ボタン
    expect(await diff(page, { target: '#ai-send', ref: button('primary'), only: COLOURS }), `${theme} 主ボタン`).toEqual({});
  }
});
