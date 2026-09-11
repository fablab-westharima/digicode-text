// Browser-only adapters. Never accept an endpoint from settings or retry a request.
export const MODELS = {
  openai: [
    { id: 'gpt-5-mini', api: 'responses', effort: 'low' },
    { id: 'gpt-5.3-codex', api: 'responses', effort: 'low' },
    { id: 'gpt-4.1-mini', api: 'chat' },
  ],
  claude: [{ id: 'claude-sonnet-5', api: 'messages' }, { id: 'claude-haiku-4-5', api: 'messages' }],
};
export const LIMITS = { source: 256 * 1024, output: 256 * 1024, envelope: 1024 * 1024, response: 2 * 1024 * 1024, prompt: 16000, history: 32000, turns: 12, tokens: 16384, timeout: 180000 };
export const bytes = text => new TextEncoder().encode(text).length;
const fail = message => { throw new Error(message); };

export function contract(provider, config, system, messages) {
  if (!MODELS[provider] || !config.model?.trim() || config.model.length > 200) fail('プロバイダー・モデル設定を確認してください');
  const profile = MODELS[provider].find(p => p.id === config.model);
  if (profile && profile.api !== config.api) fail('候補モデルのAPI方式が一致しません');
  const body = { model: config.model, stream: false };
  if (provider === 'claude') {
    if (config.api !== 'messages') fail('ClaudeはMessages APIを選択してください');
    return { url: 'https://api.anthropic.com/v1/messages', headers: { 'x-api-key': config.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: { ...body, system, messages, max_tokens: LIMITS.tokens } };
  }
  const headers = { Authorization: `Bearer ${config.key}` };
  if (config.api === 'responses') return { url: 'https://api.openai.com/v1/responses', headers, body: { ...body, store: false, instructions: system, input: messages, max_output_tokens: LIMITS.tokens, ...(profile?.effort ? { reasoning: { effort: profile.effort } } : {}) } };
  if (config.api === 'chat') return { url: 'https://api.openai.com/v1/chat/completions', headers, body: { ...body, store: false, messages: [{ role: 'system', content: system }, ...messages], max_completion_tokens: LIMITS.tokens } };
  fail('API方式を選択してください');
}

export function responseText(api, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('応答形式が不正です');
  let text;
  if (api === 'chat') {
    if (!Array.isArray(data.choices) || data.choices.length !== 1) fail('応答候補が単一ではありません');
    const choice = data.choices[0];
    if (!choice) fail('応答形式が不正です');
    if (choice.message?.refusal || choice.finish_reason === 'content_filter') fail('提供側が応答を拒否しました');
    if (choice.finish_reason !== 'stop') fail(choice.finish_reason === 'length' ? '出力が上限で打ち切られました' : '正常終了を確認できません');
    if (choice.message?.tool_calls) fail('未対応のツール応答です');
    text = choice.message?.content;
  } else if (api === 'messages') {
    if (data.stop_reason === 'refusal' || data.stop_details?.type === 'refusal') fail('提供側が応答を拒否しました');
    if (data.stop_reason !== 'end_turn') fail(['max_tokens', 'model_context_window_exceeded'].includes(data.stop_reason) ? '出力が上限で打ち切られました' : '正常終了を確認できません');
    if (!Array.isArray(data.content) || data.content.length !== 1 || data.content[0]?.type !== 'text') fail('単一のテキスト応答ではありません');
    text = data.content[0].text;
  } else if (api === 'responses') {
    if (data.status !== 'completed' || data.error || data.incomplete_details) fail(data.status === 'incomplete' ? '出力が打ち切られました' : '正常終了を確認できません');
    if (!Array.isArray(data.output)) fail('応答形式が不正です');
    const messages = data.output.filter(x => x?.type === 'message');
    if (data.output.some(x => !['message', 'reasoning'].includes(x?.type)) || messages.length !== 1) fail('単一のメッセージ応答ではありません');
    const m = messages[0];
    if (Array.isArray(m.content) && m.content.some(x => x?.type === 'refusal')) fail('提供側が応答を拒否しました');
    if (m.status !== 'completed' || m.role !== 'assistant' || !Array.isArray(m.content) || m.content.length !== 1 || m.content[0]?.type !== 'output_text') fail('単一の正常なテキスト応答ではありません');
    text = m.content[0].text;
  } else fail('未対応のAPI応答です');
  if (typeof text !== 'string' || !text.trim()) fail('応答が空です');
  if (bytes(text) > LIMITS.envelope) fail('応答の内部形式が1 MiBを超えています');
  return text;
}

// Prompt-based envelope: no native structured-output capability is assumed for custom models.
export function parseReply(text) {
  const invalid = () => fail('回答形式を確認できませんでした。コードは適用していません（自動再送なし）');
  if (typeof text !== 'string' || bytes(text) > LIMITS.envelope) invalid();
  let reply;
  try { reply = JSON.parse(text); } catch { invalid(); }
  if (!reply || Array.isArray(reply) || typeof reply !== 'object') invalid();
  const fields = Object.keys(reply);
  if (fields.length !== 3 || !['kind', 'message', 'source'].every(k => fields.includes(k))) invalid();
  if (!['answer', 'change'].includes(reply.kind) || typeof reply.message !== 'string' || !reply.message.trim() || bytes(reply.message) > LIMITS.output) invalid();
  if (reply.kind === 'answer' ? reply.source !== null : typeof reply.source !== 'string') invalid();
  // JSON.parse accepts duplicate keys. Tokenize JSON strings after syntax/type validation
  // to reject ambiguous envelopes, including escaped spellings of the same field.
  const keys = [...text.matchAll(/"(?:\\.|[^"\\])*"/g)]
    .filter(m => /^\s*:/.test(text.slice(m.index + m[0].length))).map(m => JSON.parse(m[0]));
  if (keys.length !== 3 || new Set(keys).size !== 3) invalid();
  if (reply.kind === 'change' && (!reply.source.trim() || reply.source.includes('\0') || bytes(reply.source) > LIMITS.source || /^\s*```/.test(reply.source))) invalid();
  return reply;
}

export async function requestAI(provider, config, system, messages, signal) {
  const request = contract(provider, config, system, messages);
  let res;
  try {
    res = await fetch(request.url, { method: 'POST', headers: { 'content-type': 'application/json', ...request.headers }, body: JSON.stringify(request.body), signal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
  } catch {
    if (signal.aborted) throw new Error('要求を中止しました');
    throw new Error('直接接続に失敗しました。ネットワーク・CORS・提供側の状態を確認してください（自動再送なし）');
  }
  if (!res.ok) {
    await res.body?.cancel(); // Never display raw provider errors, which can echo credentials.
    const reason = { 400: 'モデル・API方式・入力を確認', 401: 'APIキーを確認', 403: 'モデルの利用権限を確認', 404: 'モデルID・API方式を確認', 429: '利用上限・残高を確認' }[res.status] || '提供側の状態を確認';
    fail(`AI HTTP ${res.status}：${reason}してください。自動再送は行いません`);
  }
  const reader = res.body.getReader();
  const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length;
    if (size > LIMITS.response) { await reader.cancel(); fail('応答サイズが上限を超えています'); }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(buffer)); } catch { fail('応答JSONが不正です'); }
  return responseText(config.api, data);
}
