import { test, expect } from '@playwright/test';

// ライブラリ view の一覧を、エクスプローラと同じ「一覧は名前だけ・押すと詳細の箱」に揃えたことの確認。
// Registry は mock（このファイルは実 Registry に触らない）。
const json = { id: 64, owner: 'bblanchon', name: 'ArduinoJson', version: '7.4.3', description: 'JSON serialization library' };
const servo = { id: 883, owner: 'arduino-libraries', name: 'Servo', version: '1.3.0', description: 'Servo motor library' };
const listed = p => ({ ...p, frameworks: ['*'], platforms: ['*'] });

async function mocks(page) {
  await page.route('**/libraries/search?*', r => r.fulfill({ json: { items: [listed(json), listed(servo)], total: 2 } }));
  await page.route('**/libraries/details?*', r => {
    const name = new URL(r.request().url()).searchParams.get('name');
    const p = name === servo.name ? servo : json;
    return r.fulfill({ json: { ...listed(p), versions: [p.version] } });
  });
}
async function search(page) {
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.click('#libraries-open');
  await page.fill('#library-query', 'json');
  await page.locator('#library-search-form button').click();
  await expect(page.locator('#library-results > li')).toHaveCount(2);
}
const row = (page, id) => page.locator(`[data-library-id="${id}"]`);

test('検索結果の行は名前と提供者だけで、押すと箱に Registry 番号・説明・バージョンのボタンが出る', async ({ page }) => {
  await mocks(page); await search(page);
  // 起動直後・検索直後は、どちらの一覧にも箱が無い。
  await expect(page.locator('#library-result-detail')).toHaveCount(0);
  await expect(page.locator('#library-added-detail')).toHaveCount(0);

  const first = row(page, json.id);
  await expect(first.locator('.library-item strong')).toHaveText(json.name);
  await expect(first.locator('.library-item .library-meta')).toHaveText(json.owner);
  // 行に入るのは名前と提供者だけ。説明・Registry 番号・ボタンは行に無い。
  await expect(first.locator('.library-item')).not.toContainText(json.description);
  await expect(first.locator('.library-item')).not.toContainText('Registry');
  await expect(first.locator('.library-item')).not.toContainText('バージョンを選択');
  await expect(first.locator('.library-item')).toHaveAttribute('aria-expanded', 'false');

  await first.locator('.library-item').click();
  const box = first.locator('#library-result-detail');
  await expect(box).toContainText(`#${json.id}`);
  await expect(box).toContainText(json.description);
  await expect(box.getByRole('button', { name: 'バージョンを選択' })).toBeVisible();
  await expect(first.locator('.library-item')).toHaveAttribute('aria-expanded', 'true');
  await expect(first.locator('.library-item')).toBeFocused(); // 押した行にフォーカスが戻る

  // 別の行を押すと前の箱が閉じ、開くのは1つだけ。
  await row(page, servo.id).locator('.library-item').click();
  await expect(page.locator('#library-result-detail')).toHaveCount(1);
  await expect(row(page, servo.id).locator('#library-result-detail')).toContainText(servo.description);
  await expect(first.locator('#library-result-detail')).toHaveCount(0);

  // もう一度押すと閉じる。
  await row(page, servo.id).locator('.library-item').click();
  await expect(page.locator('#library-result-detail')).toHaveCount(0);
});

test('追加済みの行を押すと箱に削除が出て、削除するとその行が消える', async ({ page }) => {
  await mocks(page); await search(page);
  await row(page, json.id).locator('.library-item').click();
  await row(page, json.id).getByRole('button', { name: 'バージョンを選択' }).click();
  await row(page, json.id).getByRole('button', { name: 'プロジェクトに追加' }).click();

  const added = page.locator('#library-added > li');
  await expect(added).toHaveCount(1);
  await expect(added.locator('.library-item strong')).toHaveText(json.name);
  await expect(added.locator('.library-item .library-meta')).toHaveText(json.version);
  // 追加した直後も、追加済みの箱は閉じたまま。
  await expect(page.locator('#library-added-detail')).toHaveCount(0);
  await expect(added.locator('.library-item')).not.toContainText('削除');

  await page.click('#library-added-toggle'); // 追加済みは初期状態で閉じている
  await added.locator('.library-item').click();
  const box = page.locator('#library-added-detail');
  await expect(box).toContainText(json.owner);
  await expect(box).toContainText(`#${json.id}`);
  await box.getByRole('button', { name: `${json.owner}/${json.name} を削除` }).click();
  await expect(added).toHaveCount(0);
  await expect(page.locator('#library-added-detail')).toHaveCount(0);
  await expect(page.locator('#library-added-count')).toHaveText('0');
});

test('追加済みの行と、検索結果の追加済み行に ✓ が付き、未追加の行には無い', async ({ page }) => {
  await mocks(page); await search(page);
  const mark = locator => locator.evaluate(el => getComputedStyle(el, '::before').content);
  const name = (scope, id) => scope.locator(`[data-library-id="${id}"] .library-item strong`);
  // 追加する前は、検索結果のどの行にも ✓ が無い。見出し「検索結果」は候補があるので出ている。
  await expect(page.locator('#library-results-label')).toBeVisible();
  expect(await mark(name(page, json.id))).not.toContain('✓'); // 幅だけ確保した空の印

  await row(page, json.id).locator('.library-item').click();
  await row(page, json.id).getByRole('button', { name: 'バージョンを選択' }).click();
  await row(page, json.id).getByRole('button', { name: 'プロジェクトに追加' }).click();

  const addedName = page.locator('#library-added .library-item strong');
  await expect(addedName).toHaveCount(1);
  expect(await mark(addedName)).toContain('✓');
  expect(await mark(name(page, json.id))).toContain('✓');
  expect(await mark(name(page, servo.id))).not.toContain('✓');
  // ✓ は飾りで、名前の文字列には入らない。
  await expect(addedName).toHaveText(json.name);
  await expect(name(page, json.id)).toHaveText(json.name);
});

test('候補が無いときは見出し「検索結果」も出ない', async ({ page }) => {
  await page.route('**/libraries/search?*', r => r.fulfill({ json: { items: [], total: 0 } }));
  await page.goto('/');
  await expect(page.locator('#build')).toBeEnabled();
  await page.click('#libraries-open');
  await expect(page.locator('#library-results-label')).toBeHidden();
  await page.fill('#library-query', 'nothing');
  await page.locator('#library-search-form button').click();
  await expect(page.locator('#library-status')).toContainText('見つかりませんでした');
  await expect(page.locator('#library-results-label')).toBeHidden();
});

test('追加済みは初期は閉でバッジに件数、押すと開いて行が出て、削除で件数が減る', async ({ page }) => {
  await mocks(page); await search(page);
  const toggle = page.locator('#library-added-toggle'), count = page.locator('#library-added-count');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAttribute('aria-controls', 'library-added');
  await expect(toggle.locator('span').first()).toHaveText('追加済み');
  await expect(count).toHaveText('0');
  await expect(page.locator('#library-added')).toBeHidden();

  for (const p of [json, servo]) {
    await row(page, p.id).locator('.library-item').click();
    await row(page, p.id).locator('.library-version').click();
    await row(page, p.id).getByRole('button', { name: 'プロジェクトに追加' }).click();
  }
  // 追加しても閉じたまま。件数だけがすぐ変わる。
  await expect(count).toHaveText('2');
  await expect(page.locator('#library-added')).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#library-added > li')).toHaveCount(2);
  await expect(page.locator('#library-added .library-item').first()).toBeVisible();

  await page.locator('#library-added .library-item').first().click();
  await page.locator('#library-added-detail').getByRole('button', { name: /を削除$/ }).click();
  // 削除しても開いたまま。
  await expect(count).toHaveText('1');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#library-added > li')).toHaveCount(1);

  await toggle.click();
  await expect(page.locator('#library-added')).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('追加の知らせのカードは × で消える', async ({ page }) => {
  await mocks(page); await search(page);
  const status = page.locator('#library-status');
  // 素の文（検索まわり）には × が無い。
  await expect(status.locator('.notice-close')).toHaveCount(0);
  await row(page, json.id).locator('.library-item').click();
  await row(page, json.id).locator('.library-version').click();
  await row(page, json.id).getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(status).toHaveAttribute('data-state', 'ok');
  await expect(status).toContainText('プロジェクトに追加しました。');
  await status.locator('.notice-close').click();
  await expect(status).toBeHidden();
  await expect(status).toHaveText('');
  await expect(page.locator('#library-added-count')).toHaveText('1'); // 消えるのは知らせだけ
});

test('追加できた知らせは数秒で消え、失敗の知らせはタイマーでは消えない', async ({ page }) => {
  await mocks(page); await search(page);
  const status = page.locator('#library-status');
  await row(page, json.id).locator('.library-item').click();
  await row(page, json.id).locator('.library-version').click();
  await row(page, json.id).getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(status).toHaveAttribute('data-state', 'ok');
  await expect(status).toContainText('プロジェクトに追加しました。');
  await expect(status).toHaveText('', { timeout: 9000 });
  await expect(page.locator('#library-added-count')).toHaveText('1'); // 消えるのは知らせだけ

  // 失敗の知らせ（検索できない）は 6 秒を過ぎても残る。
  await page.route('**/libraries/search?*', r => r.fulfill({ status: 502, json: { error: 'Registry に接続できません' } }));
  await page.fill('#library-query', 'servo');
  await page.locator('#library-search-form button').click();
  await expect(status).toHaveAttribute('data-state', 'error');
  await expect(status).toContainText('Registry に接続できません');
  await page.waitForTimeout(6500);
  await expect(status).toContainText('Registry に接続できません');
});

test('✓ の有無で名前の左端が動かない', async ({ page }) => {
  await mocks(page); await search(page);
  const name = id => page.locator(`#library-results [data-library-id="${id}"] .library-item strong`);
  // 名前の文字が始まる位置（::before の印の右）を、文字の範囲から測る。
  const textX = locator => locator.evaluate(el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().x; });
  const before = await textX(name(json.id));
  expect(await textX(name(servo.id))).toBe(before);
  await row(page, json.id).locator('.library-item').click();
  await row(page, json.id).locator('.library-version').click();
  await row(page, json.id).getByRole('button', { name: 'プロジェクトに追加' }).click();
  await expect(page.locator('#library-added-count')).toHaveText('1');
  expect(await name(json.id).evaluate(el => getComputedStyle(el, '::before').content)).toContain('✓');
  expect(await textX(name(json.id))).toBe(before);
  expect(await textX(name(servo.id))).toBe(before);
});
