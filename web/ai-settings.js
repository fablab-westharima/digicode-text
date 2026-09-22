import { MODELS } from './ai-client.js';
const $ = id => document.getElementById(id);
const storageKey = p => `digicode-text.ai.${p}.v1`;
// Keys stay one record per provider (storageKey). The default record holds no key: only which
// provider and model the user pressed 既定にする on, so startup opens on that pair again.
const defaultKey = 'digicode-text.ai.default.v1';
const names = { 'gpt-5-mini': 'GPT-5 Mini', 'gpt-5.3-codex': 'GPT-5.3 Codex', 'gpt-4.1-mini': 'GPT-4.1 Mini', 'claude-sonnet-5': 'Claude Sonnet 5', 'claude-haiku-4-5': 'Claude Haiku 4.5', 'gemini-3.1-flash-lite': 'Gemini 3.1 Flash-Lite', 'gemini-3.8-flash': 'Gemini 3.8 Flash' };
const providerNames = { openai: 'OpenAI', claude: 'Claude', gemini: 'Gemini' };
const APIS = ['chat', 'responses', 'messages', 'generatecontent'];
export function setupAISettings(onChange, say) {
  let provider = 'openai', draftProvider, drafts;
  const configs = {};
  for (const p of Object.keys(MODELS)) {
    configs[p] = { key: '', model: MODELS[p][0].id, api: MODELS[p][0].api };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(p)) || 'null');
      if (saved && typeof saved.key === 'string' && typeof saved.model === 'string' && APIS.includes(saved.api)) configs[p] = { key: saved.key, model: saved.model, api: saved.api };
    } catch { say('一部のAPI設定を復元できませんでした', 'error'); }
  }
  function readDefault() {
    try {
      const saved = JSON.parse(localStorage.getItem(defaultKey) || 'null');
      if (saved && MODELS[saved.provider] && typeof saved.model === 'string' && saved.model.trim() && saved.model.length <= 200 && APIS.includes(saved.api)) return { provider: saved.provider, model: saved.model, api: saved.api };
    } catch { say('既定のAPI設定を復元できませんでした', 'error'); }
    return null;
  }
  function writeDefault(p, c) {
    try { localStorage.setItem(defaultKey, JSON.stringify({ provider: p, model: c.model, api: c.api })); return true; }
    catch { return false; }
  }
  // Restore the saved default. The key is not part of it; it still comes from that provider's
  // own record, so a default without a saved key simply starts as 'API設定が必要'.
  const preferred = readDefault();
  if (preferred) { provider = preferred.provider; configs[provider] = { ...configs[provider], model: preferred.model, api: preferred.api }; }
  function render() { $('ai-connection').textContent = `${providerNames[provider]} / ${names[configs[provider].model] || configs[provider].model} · ${configs[provider].key ? 'キー設定あり' : 'API設定が必要'}`; }
  function fields() {
    const c = drafts[draftProvider];
    $('ai-provider').value = draftProvider; $('ai-key').value = c.key; $('ai-model').value = c.model; $('ai-api').value = c.api;
    $('ai-model-choice').replaceChildren(...MODELS[draftProvider].map(p => new Option(names[p.id], p.id)), new Option('その他・保存済みの独自モデル', 'custom'));
    $('ai-model-choice').value = MODELS[draftProvider].some(p => p.id === c.model && p.api === c.api) ? c.model : 'custom';
    $('ai-advanced').open = $('ai-model-choice').value === 'custom';
    // A provider offers exactly the API methods its own candidate models use.
    const offered = new Set(MODELS[draftProvider].map(p => p.api));
    for (const option of $('ai-api').options) option.disabled = !offered.has(option.value);
  }
  function read() { drafts[draftProvider] = { key: $('ai-key').value.trim(), model: $('ai-model').value.trim(), api: $('ai-api').value }; }
  // この節の draft / commit。dialog を開ける・閉じる・結果の1行を出すのは app.js の側で、
  // ここは自分の節のことだけをする：断るときは理由を footer の1行に出して false を返す。
  function draft() { drafts = structuredClone(configs); draftProvider = provider; fields(); }
  function commit(save) {
    read(); const c = drafts[draftProvider];
    if (!c.model || c.model.length > 200) { $('ai-settings-status').textContent = 'モデルIDを入力してください'; return false; }
    if (save) {
      try { localStorage.setItem(storageKey(draftProvider), JSON.stringify(c)); }
      catch { $('ai-settings-status').textContent = '保存できませんでした。再試行するか「保存せず使う」を選択してください'; return false; }
      // A later save for the provider that is already the default carries its model forward, so
      // the restored startup state is the newest saved one rather than a stale model ID.
      if (readDefault()?.provider === draftProvider) writeDefault(draftProvider, c);
    }
    configs[draftProvider] = { ...c }; provider = draftProvider;
    onChange(); render();
    return true;
  }
  $('ai-settings-close').onclick = () => $('ai-settings').close();
  $('ai-settings').addEventListener('close', () => { drafts = null; $('ai-key').value = ''; $('ai-api-help').hidden = true; $('ai-api-info').setAttribute('aria-expanded', 'false'); });
  $('ai-provider').onchange = () => { read(); draftProvider = $('ai-provider').value; fields(); };
  $('ai-model-choice').onchange = () => {
    read(); const profile = MODELS[draftProvider].find(p => p.id === $('ai-model-choice').value);
    if (profile) { drafts[draftProvider].model = profile.id; drafts[draftProvider].api = profile.api; fields(); }
    else { $('ai-advanced').open = true; $('ai-model').focus(); }
  };
  $('ai-model').oninput = () => { $('ai-model-choice').value = 'custom'; };
  $('ai-api').onchange = () => { $('ai-model-choice').value = 'custom'; };
  $('ai-default').onclick = () => {
    // Records the provider and model shown right now, a freely typed model ID included. It writes
    // no key: saving the key stays 「保存して閉じる」.
    read(); const c = drafts[draftProvider];
    if (!c.model || c.model.length > 200) { $('ai-settings-status').textContent = 'モデルIDを入力してください'; return; }
    $('ai-settings-status').textContent = writeDefault(draftProvider, c)
      ? `起動時の既定を${providerNames[draftProvider]} / ${names[c.model] || c.model}にしました。キーの保存は「保存して閉じる」です`
      : '既定を保存できませんでした';
  };
  $('ai-delete').onclick = () => {
    // Deletion is immediate, independent of draft cancellation, including other provider drafts.
    configs[draftProvider].key = ''; drafts[draftProvider].key = ''; $('ai-key').value = '';
    onChange(); render();
    try {
      localStorage.removeItem(storageKey(draftProvider));
      // A default pointing at the provider just deleted would restore a setting that no longer exists.
      if (readDefault()?.provider === draftProvider) localStorage.removeItem(defaultKey);
      $('ai-settings-status').textContent = 'この提供元のキー・保存設定を削除しました。閉じてもキーは戻りません';
    }
    catch { $('ai-settings-status').textContent = '現在のキーは消去しましたが、保存値を削除できませんでした'; }
  };
  $('ai-api-info').onclick = () => { $('ai-api-help').hidden = !$('ai-api-help').hidden; $('ai-api-info').setAttribute('aria-expanded', String(!$('ai-api-help').hidden)); };
  window.addEventListener('storage', e => {
    if (e.key !== null && !Object.keys(MODELS).some(p => e.key === storageKey(p))) return;
    for (const p of Object.keys(MODELS)) { configs[p].key = ''; if (drafts) drafts[p].key = ''; }
    if (drafts) $('ai-key').value = '';
    onChange(); render(); say('別タブで設定が変わりました。キーを再設定してください', 'error');
  });
  render();
  return { get provider() { return provider; }, config: () => ({ ...configs[provider] }), containsKey: text => Object.values(configs).some(c => c.key && text.includes(c.key)),
    section: { name: 'ai', draft, commit } };
}
