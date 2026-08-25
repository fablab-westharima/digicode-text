# Rule: State Machine — Flag Base over String Match, setState Bailout Antipattern

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★
**Scope:** common
**Last reviewed:** 2026-04-26
**Related memory:** `setstate_bailout_flag_stuck_antipattern`, `shared_store_sideeffect`
**Related cases:** BUG-009/009b (compileLog HC string match → flag base refactor), BUG-038 (`languageChangeSavedRef` stuck via duplicate event)

---

## TL;DR

1. **State machine predicates must not match user-visible strings.** `arr.some(x => x.includes('日本語タグ'))` breaks on i18n. Use a flag state alongside the array.
2. **setState bailout (same-value no-op) breaks state machines that depend on `useEffect` re-fire.** Add an explicit `if (newValue === oldValue) return;` guard before any flag set.
3. **Treat duplicate events as the norm**, not the exception. `i18n.languageChanged`, `WebSocket.onmessage`, `matchMedia.change`, store subscriptions can all fire when nothing changed.
4. **Refs as state machine flags are debug-hostile** (not visible in React DevTools). Prefer `useState` if possible; if `useRef` is necessary, wrap reads/writes with logging during dev.

---

## Why this exists

### BUG-009 → 009b (Phase 7 → 8): String-match state breaks i18n

`EditorPage.tsx` had:

```typescript
{compileLog.some(log => log.includes('[接続確認]')) && !compileLog.some(log => log.includes('コード解析')) && (
  <ConnectionCheckPanel />
)}
{!isCompiling && compileLog.some(log => log.includes('✗')) && <ErrorPanel />}
```

When Phase 7 i18n'd compile log messages, the predicates broke for non-JA languages. The English log had `[Connection Check]`, the predicate looked for `[接続確認]`, no match, panel hidden.

**Fix:** flag-base refactor in Phase 8 (`424ce31`):

```typescript
const [compileLogMeta, setCompileLogMeta] = useState({
  hasConnectionCheck: false,
  hasCodeAnalysis: false,
  hasError: false,
});
const addLog = (msg: string, opts?: { phase?: 'connection-check' | 'code-analysis'; isError?: boolean }) => {
  setCompileLog(prev => [...prev, msg]);
  if (opts?.phase === 'connection-check') setCompileLogMeta(m => ({ ...m, hasConnectionCheck: true }));
  // ...
};
{compileLogMeta.hasConnectionCheck && !compileLogMeta.hasCodeAnalysis && <ConnectionCheckPanel />}
```

State predicate decoupled from the visible string. i18n is free to vary the string.

### BUG-038 (Phase 9 verification): setState bailout + ref-as-flag-machine

Code under inspection:

```typescript
useEffect(() => {
  const handleLanguageChange = (lang: string) => {
    languageChangeSavedRef.current = true;          // (1) flag SET unconditionally
    savedXmlRef.current = workspaceXml;
    setUiLanguage(lang);                             // (2) triggers main useEffect
  };
  i18n.on('languageChanged', handleLanguageChange);
  return () => i18n.off('languageChanged', handleLanguageChange);
}, [i18n]);

useEffect(() => {                                     // main effect
  // workspace rebuild
  // ...
  languageChangeSavedRef.current = false;             // (3) flag RESET
}, [currentToolbox, robotMode, isMobile, uiLanguage]);
```

Login fires a duplicate `languageChanged` event (preferred-language re-apply, SP3 feature) when `lang === uiLanguage`:
- (1) ref set to `true`
- (2) `setUiLanguage(lang)` is **a no-op** (React bail-out, same value) → main effect doesn't re-fire
- (3) the reset path never runs
- → ref **stuck at `true`** forever
- → `changeListener` checks the flag at the top of every workspace event → returns early → `handleWorkspaceChange()` never called → `generateCode()` never called → `generatedCode` stays empty
- → user clicks compile → "no code to compile" alert.

User had been hitting this for days; was thought to be a Phase 9 regression but turned out pre-existing. Diagnostic revert cycle proved it.

**Fix** (`1fdf1a1`, +13 / -1):

```typescript
const handleLanguageChange = (lang: string) => {
  // Guard: i18n fires duplicate 'languageChanged' on same-value (e.g., login preferred-lang re-apply).
  // Without this, setUiLanguage(lang) is a no-op, main effect doesn't re-fire,
  // languageChangeSavedRef stays true, changeListener early-returns forever. (BUG-038)
  if (lang === uiLanguage) return;
  // ...rest as before
};
// useEffect deps include uiLanguage so closure stays current
}, [i18n, uiLanguage]);
```

### `feedback_shared_store_sideeffect` (older case, 2026-03-26)

Always-mounted dialogs putting a shared store's status in their `useEffect` deps fired side-effects when *other* dialogs changed that store. Closed dialog reacted to wifi-setup dialog → connection hijack.

---

## When to apply

- Designing a state machine with multiple flags / phases.
- Writing predicates against an array of log messages, events, etc.
- Adding `useEffect` listeners to event sources that may fire duplicates.
- Reviewing PRs that include `if (arr.some(x => x.includes('foo')))`.
- Touching `useRef`-based flags in any code path that depends on `useEffect` re-fire.

---

## How to apply

### Predicate design — flag base, not string match

```typescript
// Bad: string-match predicate, i18n-fragile
function showConnectionPanel(logs: string[]): boolean {
  return logs.some(l => l.includes('[接続確認]')) && !logs.some(l => l.includes('コード解析'));
}

// Good: flag state, language-agnostic
type LogMeta = { hasConnectionCheck: boolean; hasCodeAnalysis: boolean; hasError: boolean; };
function showConnectionPanel(meta: LogMeta): boolean {
  return meta.hasConnectionCheck && !meta.hasCodeAnalysis;
}
```

When you write `addLog`, expose phase metadata:

```typescript
type LogPhase = 'connection-check' | 'code-analysis';
const addLog = (msg: string, opts?: { phase?: LogPhase; isError?: boolean }) => {
  setLogs(prev => [...prev, msg]);
  if (opts?.phase === 'connection-check') setMeta(m => ({ ...m, hasConnectionCheck: true }));
  if (opts?.phase === 'code-analysis')    setMeta(m => ({ ...m, hasCodeAnalysis: true }));
  if (opts?.isError)                      setMeta(m => ({ ...m, hasError: true }));
};
const resetLogs = () => {
  setLogs([]);
  setMeta({ hasConnectionCheck: false, hasCodeAnalysis: false, hasError: false });
};
```

### setState bailout — guard against duplicate-event no-ops

For *any* listener on a duplicate-prone event source, guard the handler:

```typescript
useEffect(() => {
  const handler = (newValue: string) => {
    if (newValue === currentValue) return; // ← bailout guard
    setState(newValue);
    // any flag updates that depend on the main effect re-firing
  };
  source.on('change', handler);
  return () => source.off('change', handler);
}, [currentValue]); // ← deps must include currentValue for closure freshness
```

Duplicate-event-prone sources to watch:
- i18next `languageChanged` (fires on same-value re-apply, BUG-038)
- Blockly workspace `change` events (UI-typed events fire constantly)
- `matchMedia` `change` (re-fires on layout-thrash, sometimes same-value)
- `WebSocket.onmessage` (server may resend)
- Redux/Zustand subscriptions (action without state change still fires subscribers)

### Reset path must always be reachable

```typescript
// Bad: reset only happens via main useEffect, which depends on a value that may not change
useEffect(() => {
  /* setup */
  resetFlag();
}, [valueThatMayNotChange]);

// Good: reset on the mirror condition explicitly
const handler = (newValue: string) => {
  if (newValue === currentValue) return;
  setFlag(true);
  // schedule the reset by some other path that always runs
};
```

If a flag's reset depends on `useEffect` re-firing, prove the deps array always changes. If not — the flag will stuck.

### Ref-vs-state choice for flags

|   | `useRef` | `useState` |
|---|---|---|
| Visible in React DevTools | ❌ | ✅ |
| Triggers re-render | ❌ | ✅ |
| Survives re-render | ✅ | ✅ |
| Good for | sync barriers, "saw this value already" | UI state, derived display |

If the flag affects what's rendered → `useState`. If purely a synchronization barrier → `useRef`, but log writes in dev:

```typescript
const flagRef = useRef(false);
// dev-only logging
useEffect(() => {
  const orig = flagRef;
  // ...
});
```

Or wrap:

```typescript
function setFlag(value: boolean) {
  console.log(`[BlocklyEditor] flag = ${value}`);
  flagRef.current = value;
}
```

(BUG-038 was much faster to diagnose because Phase 9 ref-flag was being logged.)

### Shared-store side-effect avoidance

When an always-mounted dialog needs a shared store's status:

```typescript
// Bad: reacts to status changes from other dialogs
useEffect(() => {
  if (sharedStore.status === 'idle') {
    cleanup();
  }
}, [sharedStore.status]);

// Good: only react to *open* transitions of THIS dialog
const wasOpenRef = useRef(open);
useEffect(() => {
  if (wasOpenRef.current && !open) {
    cleanup(); // dialog just closed
  }
  wasOpenRef.current = open;
}, [open]); // depends only on this dialog's open state
```

---

## Anti-patterns

### ❌ String-match predicate

```tsx
{logs.some(l => l.includes('[接続確認]')) && <Panel />}
```

### ❌ `useEffect` with shared-store status in deps for an always-mounted dialog

```typescript
useEffect(() => {
  if (sharedStore.status !== 'connected') disconnect();
}, [sharedStore.status]); // fires for OTHER dialog's actions too
```

### ❌ Flag set without bailout guard

```typescript
const handler = (lang: string) => {
  flagRef.current = true;
  setLang(lang); // bails out if lang === currentLang — flag stays stuck
};
```

### ❌ "Just resetting flags in cleanup" that depends on dep change

```typescript
useEffect(() => {
  return () => { flagRef.current = false; };
}, [valueThatMayNotChange]); // cleanup never runs if dep doesn't change
```

---

## Related rules

- `common/03-coding.md` — narrowing types, no `any` (helpful for log-meta typing)
- `common/07-i18n.md` — why string-match predicates are i18n-fragile
- `digicode/10-frontend-state.md` — concrete DigiCode patterns (compileLogMeta, languageChangeSavedRef)
- `reference/known-pitfalls.md` — duplicate-event source registry
