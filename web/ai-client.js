// Browser-only adapters. Never accept an endpoint from settings or retry a request.
export const MODELS = {
  openai: [
    { id: 'gpt-5-mini', api: 'responses', effort: 'low' },
    { id: 'gpt-5.3-codex', api: 'responses', effort: 'low' },
    { id: 'gpt-4.1-mini', api: 'chat' },
  ],
  claude: [{ id: 'claude-sonnet-5', api: 'messages' }, { id: 'claude-haiku-4-5', api: 'messages' }],
  gemini: [{ id: 'gemini-3.1-flash-lite', api: 'generatecontent' }, { id: 'gemini-3.8-flash', api: 'generatecontent' }],
};
export const LIMITS = { source: 256 * 1024, output: 256 * 1024, envelope: 1024 * 1024, response: 2 * 1024 * 1024, prompt: 16000, history: 32000, turns: 12, tokens: 16384, timeout: 180000 };
export const bytes = text => new TextEncoder().encode(text).length;
const fail = message => { throw new Error(message); };

// The reply envelope as a JSON schema, mirroring parseReply's required fields and types.
// All four APIs are handed this same shape so the provider itself rejects any other one;
// the contract's meaning is unchanged and parseReply stays the sole validator of kind/source
// pairing, sizes and duplicate keys. Only constructs every provider documents as
// supported are used: an object with every field required, additionalProperties:false,
// and an enum.
const replySchema = source => ({
  type: 'object',
  properties: { kind: { type: 'string', enum: ['answer', 'change'] }, message: { type: 'string' }, source },
  required: ['kind', 'message', 'source'],
  additionalProperties: false,
});
// The two spellings differ in one place only: how the nullable source is written. Messages
// takes anyOf with a null branch. OpenAI's strict subset does not list null among its
// supported types and documents a union type array as the way to express a nullable field,
// so the strict copy writes type: ['string', 'null'] instead.
export const REPLY_SCHEMA = replySchema({ anyOf: [{ type: 'string' }, { type: 'null' }] });
export const REPLY_SCHEMA_STRICT = replySchema({ type: ['string', 'null'] });
// Gemini's structured output documents the same union type array for a nullable field, so it is
// handed the same object; there is no third spelling to keep in step.
export const REPLY_SCHEMA_GEMINI = REPLY_SCHEMA_STRICT;
export const REPLY_SCHEMA_NAME = 'digicode_reply';

export function contract(provider, config, system, messages) {
  if (!MODELS[provider] || !config.model?.trim() || config.model.length > 200) fail('プロバイダー・モデル設定を確認してください');
  const profile = MODELS[provider].find(p => p.id === config.model);
  if (profile && profile.api !== config.api) fail('候補モデルのAPI方式が一致しません');
  const body = { model: config.model, stream: false };
  if (provider === 'claude') {
    if (config.api !== 'messages') fail('ClaudeはMessages APIを選択してください');
    // output_config.format is GA on Messages (no beta header); the reply comes back as a
    // single text block holding schema-valid JSON, so the normalize/parse stage is unchanged.
    return { url: 'https://api.anthropic.com/v1/messages', headers: { 'x-api-key': config.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: { ...body, system, messages, max_tokens: LIMITS.tokens, output_config: { format: { type: 'json_schema', schema: REPLY_SCHEMA } } } };
  }
  if (provider === 'gemini') {
    if (config.api !== 'generatecontent') fail('GeminiはGenerate Content APIを選択してください');
    // generateContent names the model in the path and takes no model or stream field in the body;
    // the key goes in a header, never in a query string, so it stays out of URLs and logs.
    // The same system string and the same history feed systemInstruction and contents; the
    // assistant role is spelled 'model' here and a message becomes one text part.
    return { url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`, headers: { 'x-goog-api-key': config.key }, body: { systemInstruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: LIMITS.tokens, responseFormat: { text: { mimeType: 'APPLICATION_JSON', schema: REPLY_SCHEMA_GEMINI } } } } };
  }
  const headers = { Authorization: `Bearer ${config.key}` };
  // Responses takes the schema at text.format, Chat Completions at response_format.json_schema;
  // both in strict mode. The reply still arrives as ordinary output text, so the normalize/parse
  // stage is unchanged and a refusal still surfaces as a refusal content part.
  if (config.api === 'responses') return { url: 'https://api.openai.com/v1/responses', headers, body: { ...body, store: false, instructions: system, input: messages, max_output_tokens: LIMITS.tokens, text: { format: { type: 'json_schema', name: REPLY_SCHEMA_NAME, schema: REPLY_SCHEMA_STRICT, strict: true } }, ...(profile?.effort ? { reasoning: { effort: profile.effort } } : {}) } };
  if (config.api === 'chat') return { url: 'https://api.openai.com/v1/chat/completions', headers, body: { ...body, store: false, messages: [{ role: 'system', content: system }, ...messages], max_completion_tokens: LIMITS.tokens, response_format: { type: 'json_schema', json_schema: { name: REPLY_SCHEMA_NAME, schema: REPLY_SCHEMA_STRICT, strict: true } } } };
  fail('API方式を選択してください');
}

export function responseText(api, data, meta = {}) {
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
    // Join every text block; other block types (thinking, etc.) are ignored.
    if (!Array.isArray(data.content) || !data.content.length) fail('応答形式が不正です');
    const texts = data.content.filter(x => x?.type === 'text').map(x => x.text);
    if (!texts.length || texts.some(x => typeof x !== 'string')) fail('テキスト応答がありません');
    meta.blocks = texts.length;
    text = texts.join('\n');
  } else if (api === 'generatecontent') {
    // No candidate at all means the prompt itself was blocked; promptFeedback names the kind.
    // A candidate that stopped for any reason other than STOP is reported with that reason and
    // never retried. Every text part of the single candidate is joined; other part kinds are ignored.
    const blocked = reason => fail(`Geminiが応答を返しませんでした（理由: ${reason || '不明'}）`);
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    if (!candidates.length) blocked(data.promptFeedback?.blockReason);
    if (candidates.length !== 1) fail('応答候補が単一ではありません');
    const candidate = candidates[0];
    if (candidate?.finishReason !== 'STOP') {
      if (candidate?.finishReason === 'MAX_TOKENS') fail('出力が上限で打ち切られました');
      blocked(candidate?.finishReason);
    }
    const parts = candidate.content?.parts;
    if (!Array.isArray(parts) || !parts.length) fail('応答形式が不正です');
    const texts = parts.filter(x => typeof x?.text === 'string').map(x => x.text);
    if (!texts.length) fail('テキスト応答がありません');
    meta.blocks = texts.length;
    text = texts.join('\n');
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

// Shared normalization for all three APIs: strip surrounding whitespace, ``` / ```json fences and
// any prose before or after the envelope, keeping the first '{' through its matching '}'.
// Only the wrapping is relaxed; the envelope contract itself is unchanged.
export function normalizeReply(raw) {
  const notes = [];
  let text = raw.trim();
  if (/^```/.test(text) || /```\s*$/.test(text)) { notes.push('フェンス'); text = text.replace(/^```[^\n]*\n?/, '').replace(/\n?```\s*$/, '').trim(); }
  const start = text.indexOf('{');
  if (start < 0) return { text, notes };
  let depth = 0, end = -1, quoted = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) { if (ch === '\\') i++; else if (ch === '"') quoted = false; continue; }
    if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) { end = i; break; }
  }
  const body = end < 0 ? text.slice(start) : text.slice(start, end + 1);
  if (body !== text) notes.push('前後の文');
  return { text: body, notes };
}

// The sole validator of the envelope. Every request pins the schema at the API, but a custom
// model ID may ignore or reject it, so the reply is parsed here regardless of provider.
// On failure the error names the failure type and the first 200 characters of the raw reply.
export function parseReply(raw, meta = {}) {
  const invalid = kind => {
    const parts = [kind, ...(meta.blocks > 1 ? [`textブロック${meta.blocks}個`] : []), ...notes];
    const head = typeof raw === 'string' ? raw.trim().slice(0, 200) : '';
    fail(`回答形式を確認できませんでした（${parts.join('、')}）。コードは適用していません（自動再送なし）` + (head ? `\n先頭200文字: ${head}` : ''));
  };
  let notes = [];
  if (typeof raw !== 'string' || bytes(raw) > LIMITS.envelope) invalid('応答不正');
  const norm = normalizeReply(raw); const text = norm.text; notes = norm.notes;
  let reply;
  try { reply = JSON.parse(text); } catch { invalid('JSON不正'); }
  if (!reply || Array.isArray(reply) || typeof reply !== 'object') invalid('JSON不正');
  const invalidField = () => invalid('必須項目欠落');
  const fields = Object.keys(reply);
  if (fields.length !== 3 || !['kind', 'message', 'source'].every(k => fields.includes(k))) invalidField();
  if (!['answer', 'change'].includes(reply.kind) || typeof reply.message !== 'string' || !reply.message.trim() || bytes(reply.message) > LIMITS.output) invalidField();
  if (reply.kind === 'answer' ? reply.source !== null : typeof reply.source !== 'string') invalidField();
  // JSON.parse accepts duplicate keys. Tokenize JSON strings after syntax/type validation
  // to reject ambiguous envelopes, including escaped spellings of the same field.
  const keys = [...text.matchAll(/"(?:\\.|[^"\\])*"/g)]
    .filter(m => /^\s*:/.test(text.slice(m.index + m[0].length))).map(m => JSON.parse(m[0]));
  if (keys.length !== 3 || new Set(keys).size !== 3) invalidField();
  if (reply.kind === 'change' && (!reply.source.trim() || reply.source.includes('\0') || bytes(reply.source) > LIMITS.source || /^\s*```/.test(reply.source))) invalidField();
  return reply;
}

// Reads a response body under the same size cap for both outcomes. `over` reports that the cap
// was reached: a successful reply is rejected then, an error body is simply cut off there.
async function readBody(body) {
  const reader = body.getReader();
  const chunks = []; let size = 0, over = false;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.length; chunks.push(value);
    if (size > LIMITS.response) { over = true; await reader.cancel(); break; }
  }
  const buffer = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  return { text: new TextDecoder().decode(buffer), over };
}

export async function requestAI(provider, config, system, messages, signal, meta = {}) {
  const request = contract(provider, config, system, messages);
  let res;
  try {
    res = await fetch(request.url, { method: 'POST', headers: { 'content-type': 'application/json', ...request.headers }, body: JSON.stringify(request.body), signal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
  } catch {
    if (signal.aborted) throw new Error('要求を中止しました');
    throw new Error('直接接続に失敗しました。ネットワーク・CORS・提供側の状態を確認してください（自動再送なし）');
  }
  if (!res.ok) {
    // The provider's own error text is the only thing that says why a request was rejected, so it
    // travels to the caller on err.body instead of being dropped. It can echo a credential, so it
    // is never formatted here: the caller, which alone knows the saved keys, decides what to show.
    let raw = '';
    try { if (res.body) raw = (await readBody(res.body)).text; } catch { raw = ''; }
    const reason = { 400: 'モデル・API方式・入力を確認', 401: 'APIキーを確認', 403: 'モデルの利用権限を確認', 404: 'モデルID・API方式を確認', 429: '利用上限・残高を確認' }[res.status] || '提供側の状態を確認';
    const error = new Error(`AI HTTP ${res.status}：${reason}してください。自動再送は行いません`);
    if (raw.trim()) error.body = raw;
    throw error;
  }
  const { text: decoded, over } = await readBody(res.body);
  if (over) fail('応答サイズが上限を超えています');
  let data;
  try { data = JSON.parse(decoded); } catch { fail('応答JSONが不正です'); }
  return responseText(config.api, data, meta);
}
