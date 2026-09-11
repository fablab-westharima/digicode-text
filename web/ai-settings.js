import { MODELS } from './ai-client.js';
const $ = id => document.getElementById(id);
const storageKey = p => `digicode-text.ai.${p}.v1`;
const names = { 'gpt-5-mini': 'GPT-5 Mini', 'gpt-5.3-codex': 'GPT-5.3 Codex', 'gpt-4.1-mini': 'GPT-4.1 Mini', 'claude-sonnet-5': 'Claude Sonnet 5', 'claude-haiku-4-5': 'Claude Haiku 4.5' };
export function setupAISettings(onChange, say) {
  let provider = 'openai', draftProvider, drafts;
  const configs = {};
  for (const p of Object.keys(MODELS)) {
    configs[p] = { key: '', model: MODELS[p][0].id, api: MODELS[p][0].api };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(p)) || 'null');
      if (saved && typeof saved.key === 'string' && typeof saved.model === 'string' && ['chat','responses','messages'].includes(saved.api)) configs[p] = { key: saved.key, model: saved.model, api: saved.api };
    } catch { say('一部のAPI設定を復元できませんでした'); }
  }
  function render() { $('ai-connection').textContent = `${provider === 'openai' ? 'OpenAI' : 'Claude'} / ${names[configs[provider].model] || configs[provider].model} · ${configs[provider].key ? 'キー設定あり' : 'API設定が必要'}`; }
  function fields() {
    const c = drafts[draftProvider];
    $('ai-provider').value = draftProvider; $('ai-key').value = c.key; $('ai-model').value = c.model; $('ai-api').value = c.api;
    $('ai-model-choice').replaceChildren(...MODELS[draftProvider].map(p => new Option(names[p.id], p.id)), new Option('その他・保存済みの独自モデル', 'custom'));
    $('ai-model-choice').value = MODELS[draftProvider].some(p => p.id === c.model && p.api === c.api) ? c.model : 'custom';
    $('ai-advanced').open = $('ai-model-choice').value === 'custom';
    for (const option of $('ai-api').options) option.disabled = draftProvider === 'claude' ? option.value !== 'messages' : option.value === 'messages';
  }
  function read() { drafts[draftProvider] = { key: $('ai-key').value.trim(), model: $('ai-model').value.trim(), api: $('ai-api').value }; }
  function commit(save) {
    read(); const c = drafts[draftProvider];
    if (!c.model || c.model.length > 200) { $('ai-settings-status').textContent = 'モデルIDを入力してください'; return; }
    if (save) {
      try { localStorage.setItem(storageKey(draftProvider), JSON.stringify(c)); }
      catch { $('ai-settings-status').textContent = '保存できませんでした。再試行するか「保存せず使う」を選択してください'; return; }
    }
    configs[draftProvider] = { ...c }; provider = draftProvider;
    onChange(); render(); $('ai-settings').close(); say(save ? 'このブラウザに保存しました' : '保存せず、このページで使用します');
  }
  $('ai-settings-open').onclick = () => { drafts = structuredClone(configs); draftProvider = provider; fields(); $('ai-settings-status').textContent = ''; $('ai-settings').showModal(); };
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
  $('ai-save').onclick = () => commit(true);
  $('ai-use').onclick = () => commit(false);
  $('ai-delete').onclick = () => {
    // Deletion is immediate, independent of draft cancellation, including other provider drafts.
    configs[draftProvider].key = ''; drafts[draftProvider].key = ''; $('ai-key').value = '';
    onChange(); render();
    try { localStorage.removeItem(storageKey(draftProvider)); $('ai-settings-status').textContent = 'この提供元のキー・保存設定を削除しました。閉じてもキーは戻りません'; }
    catch { $('ai-settings-status').textContent = '現在のキーは消去しましたが、保存値を削除できませんでした'; }
  };
  $('ai-api-info').onclick = () => { $('ai-api-help').hidden = !$('ai-api-help').hidden; $('ai-api-info').setAttribute('aria-expanded', String(!$('ai-api-help').hidden)); };
  window.addEventListener('storage', e => {
    if (e.key !== null && !Object.keys(MODELS).some(p => e.key === storageKey(p))) return;
    for (const p of Object.keys(MODELS)) { configs[p].key = ''; if (drafts) drafts[p].key = ''; }
    if (drafts) $('ai-key').value = '';
    onChange(); render(); say('別タブで設定が変わりました。キーを再設定してください');
  });
  render();
  return { get provider() { return provider; }, config: () => ({ ...configs[provider] }), containsKey: text => Object.values(configs).some(c => c.key && text.includes(c.key)) };
}
