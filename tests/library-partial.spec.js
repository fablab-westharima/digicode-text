import { test, expect } from '@playwright/test';
const item={id:883,name:'Servo',owner:'arduino-libraries',version:'1.3.0',description:'Servo library'};
async function open(page) { await page.goto('/'); await expect(page.locator('#build')).toBeEnabled(); await page.click('#libraries-open'); }
async function findAcrossPages(page, name) {
 for(let i=0;i<5;i++) {
  const row=page.locator('#library-results li').filter({has:page.locator('strong',{hasText:new RegExp('^'+name+'$')})});
  if(await row.count()) return row.first();
  if(!await page.locator('#library-next').isVisible())break;
  await page.click('#library-next');
 }
 throw new Error('Missing candidate '+name);
}
test('real partial candidates, exact-name priority, version and add; no compile',async({page},info)=>{
 test.setTimeout(120000); await open(page);
 for(const [q,name] of [['serv','Servo'],['servo','Servo'],['arduinoj','ArduinoJson'],['BusIO','Adafruit BusIO']]) {
  // 件数の文は無くなったので、行が出たことで検索完了を待つ。
  await page.fill('#library-query',q); await expect(page.locator('#library-results li').first()).toBeVisible({timeout:30000});
  const row=await findAcrossPages(page,name); await expect(row).toBeVisible();
  if(q==='servo') await expect(page.locator('#library-results strong').first()).toHaveText('Servo');
  if(q==='serv') {
   await page.screenshot({path:info.outputPath('serv-desktop.png')});
   const embedded=await findAcrossPages(page,'ESP32Servo'); await page.setViewportSize({width:390,height:850});
   await embedded.scrollIntoViewIfNeeded(); await page.screenshot({path:info.outputPath('serv-embedded-390.png')}); await page.setViewportSize({width:1440,height:850});
  }
  if(q==='arduinoj') {
   await row.locator('.library-item').click(); await row.locator('.library-version').click();
   await row.locator('select').selectOption('7.4.3'); await row.getByRole('button',{name:'プロジェクトに追加'}).click();
   // 追加済みの行は名前と版だけ。提供者は名前を押して開く箱の中。
   await expect(page.locator('#library-added')).toContainText('ArduinoJson');
   if (await page.locator('#library-added-toggle').getAttribute('aria-expanded') === 'false') await page.click('#library-added-toggle'); // 追加済みは初期状態で閉じている
   await page.locator('#library-added .library-item').click();
   await expect(page.locator('#library-added-detail')).toContainText('bblanchon');
   await page.screenshot({path:info.outputPath('arduinoj-added.png')});
  }
 }
});
test('suggestions only from obtained Registry candidates and selected explicitly',async({page})=>{
 const queries=[];
 await page.route('**/libraries/search?*',r=>{
  const q=new URL(r.request().url()).searchParams.get('q'); queries.push(q);
  return r.fulfill({json:{items:q==='serov'?[]:[item],scope:'candidates',total:q==='serov'?0:1}});
 });
 await open(page); await page.fill('#library-query','serv'); await expect(page.locator('#library-results')).toContainText('Servo');
 await page.fill('#library-query','serov'); await expect(page.locator('#library-suggestions')).toContainText('もしかして'); await expect(page.locator('#library-query')).toHaveValue('serov');
 await page.locator('#library-suggestions button').click(); await expect(page.locator('#library-query')).toHaveValue('Servo'); await expect.poll(()=>queries.at(-1)).toBe('Servo');
 await expect(page.locator('#library-suggestions')).toBeEmpty();
});
