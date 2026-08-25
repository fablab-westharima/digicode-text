# Rule: Metered-API Cost — Estimate on the Heaviest Real Class, and Assume Disconnect ≠ Stop

> **Origin: LaserEditor Session 003 (2026-07-30).** Preserved as a reference lesson: this rule exists because a real project lost real money. Substitute the origin's provider and stack with your own; append your cases below, never delete the original.

**Severity:** ★★★★ (a wrong cost model is not discovered by any test — it is discovered on the invoice, after the spend)
**Scope:** common
**Last reviewed:** 2026-08-14 (established — LaserEditor case 66 harvested into the template)
**Related memory:** —
**Related cases:** LaserEditor case 66 (metered API overrun); `judgment-mistakes-history.md` 初期1 / case 21 (sampling treated as whole-population; inferred claim reported as verified)

---

## TL;DR

1. **Estimate cost from the heaviest *real* input class, measured once — never from the lightest.** A sample of the cheap class is a sample, not an estimate (pattern C).
2. **Disconnecting the client does not stop the work or the meter.** Server-side agentic loops run to completion and bill for it; the SDK's default retry then duplicates the heaviest request.
3. **Set `timeout` and `max_retries` explicitly before the first paid call**, and make sure a retry cannot duplicate a long/expensive request.
4. **Before adopting a metered API, surface balance / spend cap / auto-reload to the user.** These are the user's decisions, not implementation details.

---

## Why this exists

LaserEditor S003 built AI image pre-processing on a metered code-execution API. The proof of concept ran two synthetic white-background images ($0.65 / $0.27) and the cost was reported to the user as "roughly ¥40–100 per run."

Real photographs behaved differently in kind, not degree: the sandbox loop iterated, context grew, and a single run reached tens of dollars. During verification a 10-minute client timeout cut the connection — **the server-side loop kept running and kept billing** — and the SDK's default `max_retries=2` re-issued the same heavy request. The user found the result on the provider console: **$24 of balance gone and $56 unpaid.**

Three independent errors, each individually plausible:

| Error | Why it looked fine at the time |
|---|---|
| Estimated from the lightest class (n=2, synthetic) | The measurement was real — it just measured the wrong population |
| Assumed client disconnect stops the work | True of most request/response APIs; false of server-side agentic loops |
| Left `timeout` / `max_retries` at defaults | Defaults are tuned for short, cheap calls |

None of these is caught by a functional test. The system worked correctly the entire time.

---

## When to apply

- Adopting or first calling any **metered** API (per-token, per-second, per-execution) — before the first paid call, not after the prototype.
- Quoting a per-run or per-month cost to the user.
- Any API whose work continues server-side after the response stream is abandoned (agentic loops, batch jobs, code execution, long-running generation).
- Changing input size, model, or the number of steps in an existing metered path — the old estimate does not carry over.

---

## How to apply

1. **Enumerate the input classes** the founding use case actually contains (see `17-no-self-imposed-scope.md` for what "actually contains" means, and `04-testing-strategy.md` for class-axis verification). Rank them by expected cost.
2. **Measure the heaviest class once, end to end**, and quote from that. State the sample size and the class in the quote: "measured n=1 on <heaviest class>: $X" — never a bare range.
3. **Read the provider's doc on cancellation semantics** before relying on a timeout as a cost control (`09-runtime-research.md`). Assume billing continues unless the doc says otherwise.
4. **Pin `timeout` and `max_retries` explicitly.** For expensive calls prefer `max_retries=0` plus an explicit, logged retry decision.
5. **Report the spend controls to the user before the first paid run**: current balance, spend cap, auto-reload state. Ask them to set the cap.
6. **Watch the first real runs against the console**, not against your own log. The meter is the instrument; your log is a proxy.

---

## Anti-patterns

### ❌ Extrapolating a price from the cheap class

```
PoC: 2 synthetic images, $0.65 and $0.27
Report: "roughly ¥40–100 per run"
Reality: the founding use case's real class cost tens of dollars per run
```

The measurement was honest. The population was wrong. (Same shape as 初期1: n=4 partial treated as whole-population.)

### ❌ Treating a client timeout as a kill switch

```
Client: 10-minute timeout fires, connection closed, "run aborted"
Server: agentic loop continues to completion — and bills
SDK:    max_retries=2 re-issues the same heavy request
```

"Aborted" described the client's state, not the system's.

### ❌ Discovering the spend controls after the spend

Balance, cap and auto-reload are user decisions. Surfacing them after the invoice converts a configuration choice into a loss.

---

## Related rules

- `09-runtime-research.md` — verify runtime/provider semantics before depending on them (cancellation is exactly such a semantic).
- `11-dependency-upgrade.md` — SDK defaults change; a retry policy is part of the dependency's behavior.
- `04-testing-strategy.md` — input-class coverage; a class you never ran is a class you never priced.
- `12-collaboration.md` — spend limits are user decisions; do not decide them silently.
- `17-no-self-imposed-scope.md` — the founding use case defines which classes must be priced.
