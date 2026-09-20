import { test, expect } from '@playwright/test';
import { boardFacts } from '../web/ai-context.js';
import { openAI, selectBoard } from './shell.js';

// adafruit/Adafruit MQTT Library is the one row the compiler's table carries today: the harness
// saw it fail on the ESP32 board and build on the ESP8266 one. Both packages here are the real
// Registry coordinates; the search and details responses are mocked so no Registry call is made.
const mqtt = { id: 1092, owner: 'adafruit', name: 'Adafruit MQTT Library', version: '2.6.6' };
const pubsub = { id: 89, owner: 'knolleary', name: 'PubSubClient', version: '2.8' };
// The second kind of row: written for one board, not for its platform. The harness saw OneWire
// fail on the C5 alone; the other three esp32 boards build it.
const onewire = { id: 1, owner: 'paulstoffregen', name: 'OneWire', version: '2.3.8' };
const listed = p => ({ ...p, description: `${p.name} description`, frameworks: ['arduino'], platforms: ['*'] });
const UNUSABLE = 'adafruit/Adafruit MQTT Library';
const BOARD_ONLY = 'paulstoffregen/OneWire';
const BLOCKED_BOARD = 'xiao_esp32c3', OK_BOARD = 'wio_node';
// Same platform as BLOCKED_BOARD ('esp32'), so only a board row can tell them apart.
const ONE_BOARD = 'xiao_esp32c5', SAME_PLATFORM = ['xiao_esp32c3', 'xiao_esp32s3', 'esp32_devkitc_v4'];
// The row is about the C5 chip, so it names every C5 board the harness has been run on.
const C5_BOARDS = ['xiao_esp32c5', 'esp32_c5_devkitc_1'];
const projectKey = 'digicode-text.projects.v1';
const uiKey = 'digicode-text.libs-ui.v1';
const mqttRow = page => page.locator(`[data-library-id="${mqtt.id}"]`);
// A successful ESP flash set, so a Build can finish without a compiler or a device.
const flashSet = JSON.stringify({ format: 'digicode-text-flash-set', version: 2, board: 'seeed_xiao_esp32c3', chip: 'esp32c3',
  flashMode: 'dio', flashFrequency: '80m', flashSize: '4MB',
  images: [{ file: 'bootloader.bin', address: '0x0', size: 4, sha256: '', data: Buffer.from('mock').toString('base64') }] });

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { if (navigator.serial) navigator.serial.getPorts = navigator.serial.requestPort = () => { throw new Error('serial forbidden'); }; });
});
async function mocks(page) {
  await page.route('**/libraries/search?*', route => route.fulfill({ json: { items: [listed(pubsub), listed(mqtt)], total: 2 } }));
  await page.route('**/libraries/details?*', route => {
    const url = new URL(route.request().url());
    const p = url.searchParams.get('name') === mqtt.name ? mqtt : pubsub;
    return route.fulfill({ json: { ...listed(p), versions: [p.version] } });
  });
}
async function onewireMocks(page) {
  await page.route('**/libraries/search?*', route => route.fulfill({ json: { items: [listed(pubsub), listed(onewire)], total: 2 } }));
  await page.route('**/libraries/details?*', route => {
    const url = new URL(route.request().url());
    const p = url.searchParams.get('name') === onewire.name ? onewire : pubsub;
    return route.fulfill({ json: { ...listed(p), versions: [p.version] } });
  });
}
async function ready(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); }
async function openLibraries(page) { if (!await page.locator('#library-query').isVisible()) await page.click('#libraries-open'); }
async function search(page) {
  await openLibraries(page);
  await page.fill('#library-query', 'mqtt');
  await page.locator('#library-search-form button').click();
  await expect(page.locator(`[data-library-id="${pubsub.id}"]`)).toBeVisible();
}
/** Add the unusable library to the current project, which the UI must keep allowing. */
async function addUnusable(page) {
  await search(page);
  await page.check('#library-show-incompatible');
  await mqttRow(page).locator('.library-item').click(); // 名前を押して詳細の箱を開く
  await mqttRow(page).getByRole('button', { name: 'バージョンを選択' }).click();
  await mqttRow(page).getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-added')).toContainText(mqtt.name);
}
/** The computed colour of an element that asks for one of the theme's own variables. */
function themeColour(page, variable) {
  return page.evaluate(name => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, variable);
}

test('a library the board cannot build is hidden from the results until the checkbox asks for it, and stays addable', async ({ page }) => {
  await mocks(page); await ready(page);
  await selectBoard(page, BLOCKED_BOARD);
  await search(page);
  // Hidden by default; the library that does build is listed as usual.
  await expect(mqttRow(page)).toHaveCount(0);
  await expect(page.locator(`[data-library-id="${pubsub.id}"]`)).toBeVisible();
  expect(await page.evaluate(k => localStorage.getItem(k), uiKey)).toBe(null);

  await page.check('#library-show-incompatible');
  await expect(mqttRow(page)).toBeVisible();
  // 行に出るのはバッジだけ。理由と代替は名前を押して開く箱の中にある。
  await expect(mqttRow(page).locator('.library-item')).toContainText('使えません');
  await expect(mqttRow(page)).not.toContainText('WiFiNINA fork');
  await mqttRow(page).locator('.library-item').click();
  const box = mqttRow(page).locator('#library-result-detail');
  await expect(box).toContainText('WiFiNINA fork');
  await expect(box).toContainText('代替: knolleary/PubSubClient');
  // Shown as unavailable, not as an error: the muted colour, not the failure colour.
  await expect(box.locator('.library-unusable-reason')).toHaveCSS('color', await themeColour(page, '--fg-muted'));
  // The library that does build gains no badge.
  await expect(page.locator(`[data-library-id="${pubsub.id}"] .library-badge`)).toHaveCount(0);

  // The user may still add it: the row is evidence, not a veto.
  await mqttRow(page).getByRole('button', { name: 'バージョンを選択' }).click();
  await mqttRow(page).getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-added')).toContainText(mqtt.name);
  await expect(page.locator('#library-added')).toContainText(mqtt.version);
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).projects.find(p => p.id === JSON.parse(localStorage.getItem(k)).activeId).libraries, projectKey))
    .toEqual([mqtt]);

  // The choice is remembered for this browser, and the row is visible again after a reload.
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), uiKey)).toEqual({ showIncompatible: true });
  await page.reload(); await expect(page.locator('#build')).toBeEnabled();
  await search(page);
  await expect(page.locator('#library-show-incompatible')).toBeChecked();
  await expect(mqttRow(page)).toBeVisible();
  await page.uncheck('#library-show-incompatible');
  await expect(mqttRow(page)).toHaveCount(0);
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), uiKey)).toEqual({ showIncompatible: false });
});

test('the dependency row wears the badge, the box states the reason in the failure colour, and both clear when the board changes', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  await mocks(page); await ready(page);
  await selectBoard(page, BLOCKED_BOARD);
  await addUnusable(page);

  // 追加済みの行に出るのはバッジだけ。理由と代替は名前を押して開く箱の中。
  const badge = page.locator('#library-added .library-badge');
  await expect(badge).toHaveCount(1);
  await expect(badge).toHaveText('使えません');
  await expect(page.locator('#library-added')).not.toContainText('WiFiNINA fork');
  if (await page.locator('#library-added-toggle').getAttribute('aria-expanded') === 'false') await page.click('#library-added-toggle'); // 追加済みは初期状態で閉じている
  await page.locator('#library-added .library-item').click();
  const flag = page.locator('#library-added-detail .library-incompatible');
  await expect(flag).toHaveCount(1);
  await expect(flag).toContainText(`${boards.find(b => b.id === BLOCKED_BOARD).name}では使えません`);
  await expect(flag).toContainText('WiFiNINA fork');
  await expect(flag).toContainText('代替: knolleary/PubSubClient');
  await expect(flag).toHaveCSS('color', await themeColour(page, '--danger'));

  // The ESP8266 board shares the compiler's 'esp' family with the C3 but builds this library:
  // the badge and the statement are gone as soon as the board changes, without reopening the view.
  await selectBoard(page, OK_BOARD);
  await expect(badge).toHaveCount(0);
  await expect(flag).toHaveCount(0);
  await expect(page.locator('#library-added')).toContainText(mqtt.name); // still a dependency
  await expect(page.locator('#library-added-detail')).toHaveCount(1); // 箱は開いたまま
  await selectBoard(page, BLOCKED_BOARD);
  await expect(badge).toHaveCount(1);
  await expect(flag).toHaveCount(1);
});

test('Build states the unusable dependency at the top of the build output and still runs the Build', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  const name = boards.find(b => b.id === BLOCKED_BOARD).name;
  const row = boards.find(b => b.id === BLOCKED_BOARD).incompatibleLibraries.find(r => r.library === UNUSABLE);
  const compiled = [];
  await mocks(page); await ready(page);
  await page.route('**/compile', route => { compiled.push(route.request().postDataJSON()); return route.fulfill({ contentType: 'application/json', body: flashSet }); });
  await selectBoard(page, BLOCKED_BOARD);
  await addUnusable(page);
  await page.click('#libraries-close');

  const notice = page.locator('#build-incompat');
  await expect(notice).toBeHidden(); // nothing claimed before a Build is asked for
  await page.click('#build');
  await expect(page.locator('#status')).toContainText('Build成功');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveText(`${UNUSABLE} は ${name} で使えません: ${row.reason}。代替: ${row.alternative}`);
  await expect(notice).toHaveCSS('color', await themeColour(page, '--danger'));
  // The Build was not blocked: it was sent, with the dependency the user configured.
  expect(compiled).toHaveLength(1);
  expect(compiled[0].libraries).toEqual([mqtt]);
  // It sits above the log, so it is read before the compiler's own output.
  expect(await notice.evaluate(el => el.compareDocumentPosition(document.getElementById('log')) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();

  // Removing the dependency clears the notice, and a Build on a board that builds it says nothing.
  await page.click('#libraries-open');
  if (await page.locator('#library-added-toggle').getAttribute('aria-expanded') === 'false') await page.click('#library-added-toggle'); // 追加済みは初期状態で閉じている
  await page.locator('#library-added .library-item').click();
  await page.locator('#library-added-detail').getByRole('button', { name: /を削除$/ }).click();
  await expect(notice).toBeHidden();
  await addUnusable(page);
  await selectBoard(page, OK_BOARD);
  await page.click('#build');
  await expect(page.locator('#status')).toContainText('Build成功');
  await expect(notice).toBeHidden();
  expect(compiled).toHaveLength(2);
});

test('the board sentence sent to the AI names the unusable library, and says nothing on a board that builds it', async ({ page, context, request, baseURL }) => {
  const boards = await (await request.get('/boards')).json();
  const blocked = boards.find(b => b.id === BLOCKED_BOARD), ok = boards.find(b => b.id === OK_BOARD);
  const sent = [];
  await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.route('https://api.openai.com/**', route => {
    sent.push(route.request().postDataJSON());
    const text = JSON.stringify({ kind: 'answer', message: '模擬応答。品質評価には使用しません。', source: null });
    return route.fulfill({ json: { status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text }] }] } });
  });
  await ready(page); await openAI(page);
  await page.click('#ai-settings-open'); await page.selectOption('#ai-provider', 'openai');
  await page.fill('#ai-key', 'dummy-openai-test-only'); await page.click('#ai-save');

  for (const board of [blocked, ok]) {
    await selectBoard(page, board.id);
    await page.fill('#ai-prompt', `このボードの注意点を教えて ${board.id}`);
    await page.click('#ai-send');
    await expect(page.locator('#ai-status')).toContainText('コードは変更していません');
    const facts = JSON.parse(sent.at(-1).input.at(-1).content).contextData.boardFacts;
    // The browser and the pure function agree, because both read the same /boards entry.
    expect(facts).toBe(boardFacts(board));
    if (board === blocked) {
      const row = board.incompatibleLibraries.find(r => r.library === UNUSABLE);
      expect(facts.split('\n')[1]).toBe(`使えないライブラリ: ${UNUSABLE}（${row.reason}。代替: ${row.alternative}）`);
    } else {
      expect(board.incompatibleLibraries).toEqual([]);
      expect(facts).not.toContain('使えないライブラリ');
    }
    await page.click('#ai-clear');
  }
  // One sentence per unusable library, right after the opening sentence and before the pin table.
  expect(boardFacts(blocked).indexOf('使えないライブラリ')).toBeLessThan(boardFacts(blocked).indexOf('ピンはcoreのvariant'));
  for (const b of boards) expect(Array.isArray(b.incompatibleLibraries)).toBe(true);
});

test('the rows on screen follow the checkbox and the board, and the pager states the page', async ({ page }) => {
  await mocks(page); await ready(page);
  await selectBoard(page, BLOCKED_BOARD);
  await search(page);
  const pager = page.locator('#library-page'), rows = page.locator('#library-results > li');
  // Two candidates came back; one is hidden as unusable, so one is what the user can see.
  await expect(rows).toHaveCount(1);
  await expect(pager).toHaveText('1 / 1');
  // 件数の文はもう無い。画面にあるのは行とページ送りだけ。
  await expect(page.locator('#library-status')).toBeEmpty();
  await page.check('#library-show-incompatible');
  await expect(rows).toHaveCount(2);
  await expect(pager).toHaveText('1 / 1');
  await page.uncheck('#library-show-incompatible');
  await expect(rows).toHaveCount(1);
  // The board decides what is hidden, so the rows follow a board change without a new search.
  await selectBoard(page, OK_BOARD);
  await expect(rows).toHaveCount(2);
  await selectBoard(page, BLOCKED_BOARD);
  await expect(rows).toHaveCount(1);
  await expect(pager).toHaveText('1 / 1');
});

test('copying the build output carries the unusable dependency notice while it is showing', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  const name = boards.find(b => b.id === BLOCKED_BOARD).name;
  const row = boards.find(b => b.id === BLOCKED_BOARD).incompatibleLibraries.find(r => r.library === UNUSABLE);
  await mocks(page); await ready(page);
  await page.route('**/compile', route => route.fulfill({ contentType: 'application/json', body: flashSet }));
  // The clipboard itself is a browser permission; what the button hands it is what is checked.
  await page.evaluate(() => { window.copied = []; navigator.clipboard.writeText = async text => { window.copied.push(text); }; });
  await selectBoard(page, BLOCKED_BOARD);
  await addUnusable(page);
  await page.click('#libraries-close');
  await page.click('#build');
  await expect(page.locator('#status')).toContainText('Build成功');
  await expect(page.locator('#build-incompat')).toBeVisible();
  await page.click('#copy-build');
  await expect(page.locator('#ui-notice')).toContainText('コピーしました');
  const log = await page.locator('#log').textContent();
  const notice = `${UNUSABLE} は ${name} で使えません: ${row.reason}。代替: ${row.alternative}`;
  expect(await page.evaluate(() => window.copied)).toEqual([`${notice}\n${log}`]);

  // On a board that builds the dependency the notice is hidden, and the copy is the log alone.
  await selectBoard(page, OK_BOARD);
  await page.click('#build');
  await expect(page.locator('#status')).toContainText('Build成功');
  await expect(page.locator('#build-incompat')).toBeHidden();
  await page.click('#copy-build');
  const second = await page.locator('#log').textContent();
  await expect.poll(() => page.evaluate(() => window.copied.length)).toBe(2);
  expect((await page.evaluate(() => window.copied))[1]).toBe(second);
});

// A row written for one board, on a platform three other boards share. Every reader of the table
// has to keep that distinction: the Libraries view, the Build notice, the AI's board sentence and
// the 取説's table all read the same /boards entry, so all four are checked on one pass.
test('a row written for one board reaches that board only, in the view, the Build notice, the AI sentence and the 取説 table', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  const entry = id => boards.find(b => b.id === id);
  const rowOf = id => entry(id).incompatibleLibraries.find(r => r.library === BOARD_ONLY);

  // /boards is the browser's only source, so the scoping is visible there first.
  for (const id of C5_BOARDS) expect(rowOf(id), id).toBeTruthy();
  expect(rowOf(ONE_BOARD).alternative).toBe('pstolarz/OneWireNg');
  for (const id of [...SAME_PLATFORM, OK_BOARD, 'pico_w', 'pico', 'xiao_rp2040'])
    expect(rowOf(id), id).toBeUndefined();
  // The platform row is still a platform row: every esp32 board keeps it.
  for (const id of [...C5_BOARDS, ...SAME_PLATFORM])
    expect(entry(id).incompatibleLibraries.some(r => r.library === UNUSABLE), id).toBe(true);

  // AI's board sentence: the pure function the browser hands to the model.
  expect(boardFacts(entry(ONE_BOARD))).toContain(`使えないライブラリ: ${BOARD_ONLY}`);
  for (const id of SAME_PLATFORM) expect(boardFacts(entry(id)), id).not.toContain(BOARD_ONLY);

  await onewireMocks(page); await ready(page);
  await page.route('**/compile', route => route.fulfill({ contentType: 'application/json', body: flashSet }));
  await selectBoard(page, ONE_BOARD);
  await search(page);
  const row = page.locator(`[data-library-id="${onewire.id}"]`);
  await expect(row).toHaveCount(0); // hidden until the checkbox asks for it
  await page.check('#library-show-incompatible');
  await expect(row.locator('.library-badge')).toHaveText('使えません');

  // Add it, and the Build notice names it on this board.
  await row.locator('.library-item').click();
  await row.getByRole('button', { name: 'バージョンを選択' }).click();
  await row.getByRole('button', { name: 'プロジェクトに追加' }).click();
  await page.click('#libraries-close');
  await page.click('#build');
  await expect(page.locator('#status')).toContainText('Build成功');
  const notice = page.locator('#build-incompat');
  await expect(notice).toHaveText(`${BOARD_ONLY} は ${entry(ONE_BOARD).name} で使えません: ${rowOf(ONE_BOARD).reason}。代替: ${rowOf(ONE_BOARD).alternative}`);

  // The other boards on the same platform build it: no badge, no notice, and the row is listed
  // without the checkbox being asked for.
  for (const id of SAME_PLATFORM) {
    await selectBoard(page, id);
    await expect(notice, id).toBeHidden();
    // 開き直すと候補は白紙に戻るので、行を見るにはもう一度検索する。
    await search(page);
    await expect(page.locator('#library-added .library-badge'), id).toHaveCount(0);
    await page.uncheck('#library-show-incompatible');
    await expect(row, id).toBeVisible(); // 伏せられていない = このボードでは使える
    await page.click('#libraries-close');
    await page.click('#build');
    await expect(page.locator('#status')).toContainText('Build成功');
    await expect(notice, id).toBeHidden();
  }

  // 取説の非互換表: one line per library, naming the boards it cannot be used on.
  await page.click('#view-help');
  await expect(page.locator('#help-dialog')).toBeVisible();
  const line = page.locator('#help-incompat tbody tr').filter({ hasText: BOARD_ONLY });
  await expect(line).toHaveCount(1);
  await expect(line.locator('td').nth(1)).toHaveText(C5_BOARDS.map(id => entry(id).name).join('、'));
  await expect(line.locator('td').nth(2)).toContainText('pstolarz/OneWireNg');
  const mqttLine = page.locator('#help-incompat tbody tr').filter({ hasText: UNUSABLE });
  for (const id of [...C5_BOARDS, ...SAME_PLATFORM]) await expect(mqttLine.locator('td').nth(1)).toContainText(entry(id).name);
});

test('the unusable badge wears the failure colour and the view names the board it speaks for', async ({ page, request }) => {
  const boards = await (await request.get('/boards')).json();
  const boardName = id => boards.find(b => b.id === id).name;
  await mocks(page); await ready(page);
  await selectBoard(page, BLOCKED_BOARD);
  await search(page);
  await page.check('#library-show-incompatible');
  const badge = mqttRow(page).locator('.library-badge');
  await expect(badge).toHaveText('使えません');
  const danger = await themeColour(page, '--danger');
  await expect(badge).toHaveCSS('color', danger);
  await expect(badge).toHaveCSS('border-color', danger);
  await expect(badge).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  // 使えない行は太さでは示さない。一覧の行の太さは型のまま（他の行と同じ）で、違うのは色だけ。
  const name = mqttRow(page).locator('.library-item > strong');
  const usable = page.locator(`[data-library-id="${pubsub.id}"] .library-item > strong`);
  await expect(name).toHaveCSS('color', await themeColour(page, '--fg-muted'));
  await expect(name).toHaveCSS('font-weight', await usable.evaluate(el => getComputedStyle(el).fontWeight));
  expect(await usable.evaluate(el => getComputedStyle(el).color)).not.toBe(await themeColour(page, '--fg-muted'));

  // Everything hidden or flagged here is one board's statement, so the view names that board.
  const target = page.locator('#libraries-dialog .current-project');
  await expect(page.locator('#library-target')).toHaveText(await page.locator('#project-name').textContent());
  await expect(target).toContainText(`· ${boardName(BLOCKED_BOARD)}`);
  await selectBoard(page, OK_BOARD);
  await expect(target).toContainText(`· ${boardName(OK_BOARD)}`);
  await expect(target).not.toContainText(boardName(BLOCKED_BOARD));
});
