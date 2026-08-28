# Rule: Attacker-Perspective Defense — Minimize Attack Surface in Docs, Terms, and Design

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★ (a single over-disclosed clause / endpoint / detail can become the lever an adversary uses to dismantle a defense the team thought was sound)
**Scope:** common
**Last reviewed:** 2026-05-15 (Session 120 — added §「Adversary parity in the AI era」, recognizing that attackers also use AI to enumerate exploitable surface and that defender-side audits must match the cadence and rigor)
**Related memory:** `quality_over_tokens`, `investigation_incomplete_assumption`
**Related cases:** DigiCode legal-docs drafting (Session 116); Arduino T&C audit (12-month liability cap = "here's the maximum you can extract" signal); past Public-化 leaks where over-disclosure of internals (LAN topology, service IDs) was the lever for Phase 6.0 security cleanup; DigiCode Session 117-120 (4-session 連続「cluster 完成」誤報 trauma → 機械的網羅性担保 + 攻撃者 AI parity 認識)

---

## TL;DR

1. **Whenever you write, deploy, or disclose something, ask: "If I were the plaintiff / attacker / regulator looking for leverage, where would I attack?"** Then close the holes by *not writing them in the first place* whenever possible.
2. **Surface area minimization is a defense.** Every clause, endpoint, error message, secret, or piece of internal detail you publish is a potential lever. What is not published cannot be attacked.
3. **In legal documents, "writing more = stronger defense" is wrong.** Detailed liability caps signal "this is how much you can extract." Detailed law citations create disputable interpretation surface. Simple disclaimers ("as-is, at your own risk, no liability") attack-surface-minimize while the underlying law applies regardless.
4. **In security and product design, every disclosed internal detail is a potential lever.** Server location, framework version, service IDs, internal hostnames, employee names — disclose only what is operationally or legally required, not what is merely "transparent."
5. **Adversary parity in the AI era.** Attackers also use AI (LLMs, automated audit tooling, large-scale grep / static-analysis pipelines) to enumerate exploitable surface. Manual eyeball review of "I think this looks fine" is structurally insufficient. The defender must establish *mechanical exhaustiveness* (programmatic classifiers + post-fix re-run = 0 residuals) and *periodic re-audit cadence* (re-run audits at every AI capability upgrade), or the defense rots while the attack side automatically upgrades.

---

## Why this exists

A recurring failure pattern across legal drafting, security posture, and API surface design: contributors believe they are being thorough / professional / transparent by writing more, citing more, exposing more. The unintended consequence is that the additional disclosure becomes the lever an adversary uses.

Concrete past failures of this shape:

- **Liability cap self-disclosure (legal).** Drafts that include "total liability capped at 12 months of fees" tell every prospective plaintiff exactly how much they can sue for. Without the cap clause, statutory and case-law defaults apply, and the actual recoverable amount is determined case-by-case by counsel — typically far less than 12 months and bounded by causation, not by the contract's own self-declared ceiling. *Writing the cap converts a fuzzy upper bound into a concrete target.*
- **Consumer-protection-law carve-out paragraphs (legal).** Inserting explicit "except in cases of gross negligence per Consumer Contract Act Article 8" language educates the counterparty about which legal lever to pull. The law applies regardless; quoting its structure in the contract turns a private-side defense into a public-side instruction manual.
- **Architecture / topology over-disclosure (security).** Past DigiCode `prompt/maintenance/` files documented internal LAN subnets, internal hostnames, and service UUIDs at a level of detail useful for incident archeology but harmful if leaked publicly. Phase 6.0 (Public-化 prep, 2026-05-08) had to redact ~50+ such hits, including LAN topology a competent attacker could have used for reconnaissance. The defense was *not writing the topology in publicly-visible docs in the first place.*
- **Error-message internal-detail leakage (API).** Returning `Database query failed at /var/app/src/users.ts:142` to an external caller hands an attacker the file layout, the table name, the language, and the line of the SQL. Returning `Internal error` reveals only that something failed. The shorter response is the better defense.
- **README / docs over-specification (open source).** Listing every framework, library, version, and CI tool in a public README simplifies the attacker's task of identifying known-CVE entry points. The team's pride in transparency converts into the attacker's reconnaissance.

The common root: **disclosure feels professional but attack-surface-expands.** The defense is to ask "would not writing this be acceptable?" before writing — and to default to "yes, omit" unless there is a clear operational, legal, or trust reason to publish.

---

## When to apply

- **Drafting legal docs:** terms of service, privacy policy, refund policy, EULA, license terms, specified-commercial-transaction-act page.
- **Drafting security policy / incident response / status pages:** anything user-visible that describes how you operate or respond.
- **Designing API error responses:** especially for external / unauthenticated endpoints.
- **Writing public READMEs / changelogs / blog posts about internals.**
- **Reviewing handover or session logs that may become public** (post-Public-化 monorepos in particular).
- **Choosing what to expose in HTTP headers, OG meta tags, sitemap, robots.txt.**
- **Setting up a contact surface** (whether to expose phone / email directly vs route through a contact form).
- **Whenever a contributor says "for transparency, let's add ..."** — that's the trigger to apply this rule.

---

## How to apply

### Step 1 — Adversarial role-play before writing

Before adding any clause, endpoint, error message, or disclosure, ask in order:

1. **"If I were the plaintiff suing this company, would this clause give me leverage?"** (legal docs)
2. **"If I were an attacker / penetration tester, would this disclosure narrow my reconnaissance?"** (security / architecture)
3. **"If I were a competitor scraping intel, would this give me a free strategy briefing?"** (business-sensitive)
4. **"If I were a regulator looking for non-compliance, does this admission widen scope?"** (compliance)

If any answer is yes, default to *not writing it* and look for a minimal alternative.

### Step 2 — Confirm "not writing" is actually safe

The default-to-omit rule has exceptions. Don't omit when:

- **A law mandates disclosure.** Example: Specified Commercial Transactions Act (Japan) Article 11 requires certain merchant identity items to be disclosed for a remote-sales business. Omit at your peril. *But* even then, look for the minimum-disclosure form the law allows (e.g., "address and phone disclosed upon request" — Article 11 施行規則 8 条 7 号 — instead of the full address and phone published on the page).
- **Operational trust would collapse without it.** Example: a status page during an active incident — withholding the incident's existence is worse than minimal disclosure.
- **Users genuinely cannot make informed consent without it.** Example: that user data is sent to a third-party processor (privacy policy). But you still write the *fact* of the transfer, not the internal architecture.

For each piece of content, name the *specific reason* you are not omitting it. If you cannot, omit.

### Step 3 — Minimize what survives the omit-test

For content that must be written, minimize:

- **Legal: omit specific numeric caps.** Don't write "12 months of fees." Don't write "5,000 USD maximum." Don't write "30-day refund window only" unless a law requires it. Default-rules apply silently and case-by-case; self-declaring them educates the counterparty.
- **Legal: omit law-section recitations in the body.** "Except in cases of gross negligence" suffices. Do not write "per Consumer Contract Act Article 8 Paragraph 1." The carve-out applies regardless; the citation invites disputants to argue *which subsection* applies, expanding the dispute.
- **Security: omit version / commit / hostname / path detail in error responses.** Stack traces are for logs (private), not responses (public).
- **Architecture disclosure: omit physical / regional / vendor specifics unless trust-relevant.** "Our database" is usually enough; "Cloudflare D1 in Tokyo region, replicated to ap-northeast" is reconnaissance bait. The user's actual decision (will my data leave my country?) can be answered with "data is stored on infrastructure operated by [vendor], region: Japan / EU" without naming the SKU.
- **Contact surface: route to a form, not a direct email / phone.** A form is a controlled funnel; a published email is a spam target and a social-engineering target. If the law requires "request-based disclosure," that's typically met by a contact form.

### Step 4 — Match scale to peer reality

Every domain has a peer baseline. Discover it before deciding how much to write:

- **Legal docs:** check what comparable-scale operators write. An indie SaaS / personal-developer / open-source freeware terms-of-service is typically 1-2 pages, 5-8 sections, plain language, simple "as-is" disclaimer. A large vendor's T&C (Arduino, Google, Microsoft) runs 15,000+ words and 20+ sections — *that scale is wrong for a small operator* and copying it both wastes drafting effort and signals "we have detailed liability you can dispute clause-by-clause."
- **Security disclosures:** indie projects don't need a SOC 2 disclosure; an over-detailed public security policy actually advertises that you have not yet earned a SOC 2.
- **Architecture posts:** "we use Postgres" is normal; "we use Postgres 14.7 with pgvector 0.5.0 on Hetzner CCX23" is reconnaissance.

When in doubt, *write less than the peer baseline*, not more. Future-you (or a faster competitor) can always add detail; you cannot easily un-publish.

---

## Adversary parity in the AI era

This section formalizes the discipline that emerged from repeated "cluster completion claim disproven in the next session" incidents (DigiCode Sessions 115-120: five consecutive `cluster 完成` claims, each disproven by the next session's cold-start re-audit). The structural insight is that **attackers and defenders are now both AI-equipped**, and a manual-review-only defense rots faster than the attack side upgrades.

### What changed

Pre-LLM era:
- Defenders did manual security review at release-pre milestones.
- Attackers did manual reconnaissance plus per-CVE scanners.
- Defender wins if reviewer attention exceeds attacker patience.

Post-LLM era:
- Attackers point an LLM at the public surface (source tree, public docs, error messages, HTTP responses) and ask "find me exploitable patterns." The LLM enumerates with no patience constraint.
- Defenders doing only manual review fall behind structurally — the asymmetry has flipped.
- The only sustainable defender posture is *mechanical exhaustiveness at parity-or-above to the attacker's tooling*, refreshed every time AI capability upgrades.

### Principles

1. **Manual eyeball review of grep output is structurally insufficient.** If a defender reads grep output and says "looks like 4 sites of pattern X, all fine," the attacker's LLM run finds 14 sites and exploits the 10 the defender missed. This was not theoretical — it is DigiCode Sessions 115-119's exact pattern (5 consecutive `cluster 完成` claims, each disproven the next session by a more rigorous classifier).

2. **Mechanical-exhaustiveness audits are non-negotiable for security-class clusters.** Build a programmatic classifier (grep + AST parser + tokenizer + statement-boundary aware logic) that enumerates *all* candidate sites. Iterate until known-true-positives are captured and known-false-positives excluded. Post-fix, re-run the classifier and confirm zero residuals. *The post-fix re-run is the proof of closure* — without it, claim-of-completeness has no evidentiary basis.

3. **Periodic re-audit at AI capability upgrades is mandatory, not optional.** Where an orchestration setup exists (rule 22), a re-audit may additionally use a **different model lineage** as an extra finder — different lineages find different hole classes, which is the same diversity the attacker side already enjoys. Whenever a new LLM version, audit tool, or pipeline lands:
   - Re-run the cluster classifiers against the new tooling.
   - Diff new findings against the prior baseline. New findings are either (a) prior-tool misses now caught (defender catch-up) or (b) new-tool hallucinations (investigate and discard).
   - Treat this cadence as normal maintenance, not as "extra polish." The attacker side does this automatically; the defender must match.

4. **The boundary between "release blocker" and "polish defer" must be defended adversarially.** When labeling a finding "post-release polish," ask: *would an attacker's current AI tooling find this and weaponize it before our next release?* If yes, it is not polish. The DigiCode case 19 axis 2 cluster (Sessions 110-120) showed this in action: items first labeled "polish defer" turned out to be exploitable in the next audit pass and were re-classified as release blockers.

5. **Save audit classifiers as project artifacts.** Mechanical classifiers built for one audit are reusable for re-audits. Persist them (script + intermediate TSV / JSON outputs) so the next session can diff against the baseline without rebuilding from scratch. DigiCode Session 120 produced `/tmp/case19-axis2-v5.tsv` and the classifier script; future sessions re-run them as the regression check.

### When to apply

- Drafting any release-pre security audit plan.
- Labeling any finding as "release blocker" vs "polish defer" — apply the adversary-parity test.
- After every meaningful LLM model release / audit-tool upgrade — schedule a fresh classifier re-run against the current codebase.
- When the project enters a quiet period (no active feature work) — use the idle window for a re-audit, not for adding features.

### Anti-pattern — "we already audited that cluster"

```
Bad pattern (DigiCode Sessions 115-119, 5 consecutive iterations):

  Session N: "Cluster X audited at default effort, manual eyeball review
              of grep output, 4 sites fixed. Cluster X complete."
  Session N+1 (cold-start re-audit at higher effort): "Found 10 more sites
                in cluster X. Session N's audit missed them."

Why bad:
  "Audited" without mechanical exhaustiveness + post-fix re-run is a
  social-contract claim, not a technical guarantee. The attacker side
  does not care about our social contract.

Good pattern (DigiCode Session 120):
  "Cluster X audited at max effort with mechanical classifier v5
   (statement-boundary aware tokenizer). 749 candidate assignments
   enumerated, 34 literal-key UNGUARDED + value field-dep confirmed,
   all 34 fixed with first-wins guard. Re-ran classifier post-fix:
   zero residuals for this pattern class. Other pattern classes (67
   fieldDep-key) explicitly labeled out-of-scope with rationale.
   Classifier saved as /tmp/case19-axis2-v5.{tsv,sh} for future
   regression check."
```

### Sync with rule 02

This section's principle is the content-side complement to `rule 02-design-principles.md`'s process-side discipline:

- **Rule 02**: Process — when / how to run maximum-effort audits, mechanical exhaustiveness, periodic re-audit at AI upgrades.
- **Rule 16 (this rule)**: Why — adversary parity in the AI era, structural insufficiency of manual review, asymmetry flip post-LLM.

When the work touches a release-pre security-class cluster, read both rules. They cross-reference each other.

---

## Anti-patterns

### ❌ Self-declared liability cap (legal)

```
Bad:
  "Our total liability shall not exceed the fees paid by the user
   in the 12 months preceding the claim."

Why bad:
  - Tells every plaintiff their target number.
  - Without this clause, statutory defaults + causation apply,
    typically yielding a far smaller realistic exposure.
  - Cannot be enforced if courts strike it under consumer-protection law,
    so it provides no downside protection — only upside risk disclosure.

Good:
  "The service is provided as-is. Users assume responsibility for
   their use of the service."
  (Underlying law applies; the actual recoverable amount in any dispute
   is decided case-by-case by counsel.)
```

### ❌ Law-citation in the contract body (legal)

```
Bad:
  "Except in cases of intentional misconduct or gross negligence
   (Consumer Contract Act Article 8 Paragraph 1 (i))…"

Why bad:
  - Invites dispute over which subsection applies.
  - Educates the counterparty about the structure of the law
    they would use against you.
  - Hands them the citation they otherwise would have had to look up.

Good:
  "Except in cases of intentional misconduct or gross negligence
   on our part."
  (Court applies the statute regardless of whether you cited it.)
```

### ❌ Verbose error response (API security)

```
Bad:
  HTTP/1.1 500 Internal Server Error
  {
    "error": "Database query failed",
    "stack": "at queryUsers (/var/app/src/db/users.ts:142:5)",
    "framework": "Express 4.18.2 / Node 18.17.0",
    "dbHost": "internal-db-01.prod.example.com:5432"
  }

Why bad:
  - File layout, ORM, framework version, hostname — all gifts to an attacker.

Good:
  HTTP/1.1 500 Internal Server Error
  { "error": "Internal error", "requestId": "abc-123" }
```

### ❌ Architecture over-disclosure (public docs)

```
Bad:
  "Our infrastructure runs on Cloudflare Workers + D1 (Tokyo region),
   R2 object storage (auto-replicated), KV for session state,
   with origin servers at 192.168.50.X behind Cloudflare Tunnel."

Why bad:
  - Region + service IDs + private subnets — reconnaissance complete.

Good:
  "Application data is processed on cloud infrastructure operated
   by Cloudflare (Japan region)."
  (Or omit entirely unless users need this to consent.)
```

### ❌ Direct contact channels published (anti-spam / social engineering)

```
Bad:
  <p>Email: info@example.com  |  Phone: +81 80 1234 5678</p>

Why bad:
  - Email harvesting → spam, phishing targeting.
  - Phone harvesting → social-engineering pretexts ("hi, I'm calling from
    your support team and need your account ID...").

Good:
  <a href="/contact">Contact us</a>
  (Form-mediated, rate-limited, captcha-able, audit-loggable.)

For legal-disclosure obligations (specified-commercial-transactions, etc.):
  Use "address and phone number disclosed upon request" — typically
  permitted by small-business carve-outs (e.g., Japan's 特商法施行規則 8 条 7 号).
```

### ❌ "For transparency, let's add..." reflex

```
Bad team dynamic:
  Eng: "Let's document our migration history in the public changelog
        so users see how we evolved."
  Outcome: every past architecture decision is now public; every CVE
           ever patched is a confirmed past vulnerability; every removed
           feature is a hint about reduced surface area.

Good team dynamic:
  Eng: "What's the user-visible benefit of publishing this?"
  Lead: "Users don't ask for this; we'd be publishing for our own
         engineering pride."
  Outcome: published only the changes that affect user-facing behavior.
```

---

## Authority and scope: AI assistant proposes, user / counsel decides

This rule frames the *defensive principles* for what gets published. It does **not** authorize the AI assistant to make the final disclosure decision. That authority belongs to the project lead and (for legal docs) qualified counsel.

### What the AI assistant may do

- **Surface options.** "Here are three ways to handle the merchant-identity disclosure: (A) full publication, (B) on-request disclosure under small-business exemption, (C) omit entirely."
- **Present information.** "Specified Commercial Transactions Act Article 11 lists phone number among required items. Some exemption may apply at small-business scale; verification is counsel's call."
- **Flag tension.** "The current draft omits the phone number. If a law mandates publication, omission would be non-compliant. Counsel should confirm whether an exemption applies."
- **Apply the rule's defensive lens** to draft alternatives that minimize attack surface within the option set.

### What the AI assistant must NOT do

- **Decide whether to publish based on the assistant's own reading of a statute.** Statutory interpretation is reserved to qualified counsel. "Article X requires Y, so we should publish Y" is *not* a valid line of reasoning for the assistant to act on unilaterally.
- **Recommend a specific publish-vs-omit outcome as "the right call."** Frame it as "options for the project lead and counsel to choose between," not as a verdict the assistant has reached.
- **Add a personal-information field (phone, address, email, employee name, server location, etc.) on the grounds that a law "requires" it.** Even when a law does require disclosure, the chosen *form* of compliance (direct publication vs request-based vs exemption-based) is a judgment for the project lead and counsel.
- **Treat "compliance gap" or "regulatory risk" as authorization to publish.** Those are flags to surface; they are not decisions to make.

### Why this matters

Disclosure decisions involve trade-offs the assistant cannot fully weigh:

- Personal safety of the operator (phone numbers and addresses enable harassment, doxxing, social engineering).
- Business posture and risk tolerance (some operators prefer regulatory friction over exposure; some prefer the opposite).
- Counsel's familiarity with applicable exemptions, case law, and enforcement practice in the relevant jurisdiction.
- The user's strategic timing (a disclosure shape that is fine for v2 may be wrong for v1 launch).

The assistant has visibility into none of these. Defaulting to "the law says X, so write X" overrides the user's authority over their own surface.

### Triggers requiring user / counsel decision (do not act unilaterally)

- Adding or removing **any** personal-information field on a public page (name / phone / email / address / employee identity).
- Adding or removing **any** legal-effect clause (liability limit, jurisdiction, governing law, dispute resolution).
- Citing **any** specific statute in body text of a published document.
- Restructuring **any** existing legal section in a way that changes which information is published.
- Interpreting **any** "shall" / "must" / "required" language in a statute to derive a publish-or-omit decision.

For each of these, the protocol is: gather facts → present options → wait for the project lead and counsel to choose.

### Anti-pattern — citing law to justify a publication recommendation

```
Bad assistant behavior:
  "Article 11 of the Specified Commercial Transactions Act requires
   disclosure of a phone number. The current page is missing this row,
   which is a compliance gap. Recommendation: add a phone-number row."

Why bad:
  - Statutory interpretation reserved to counsel.
  - "Compliance gap" framing presupposes the assistant's reading is correct.
  - "Recommendation: add" overrides the operator's authority over their
    own personal surface.
  - Small-business exemptions, request-based disclosure, and other
    alternative compliance forms are not weighed.

Good assistant behavior:
  "Observation: the page does not include a phone-number row. Specified
   Commercial Transactions Act Article 11 lists phone number among
   merchant-identity items. Whether and how to comply is a question
   for counsel: full publication, request-based disclosure under a
   possible small-business exemption, or another form may apply.
   Options for the project lead:
     (A) Add a phone-number row with the number published directly.
     (B) Add a row stating 'disclosed upon request' (if counsel
         confirms an exemption applies).
     (C) Defer entirely until counsel reviews the page.
   No assistant recommendation."
```

The shift is from *verdict* to *option set*. The assistant's job ends at "here are the options"; the project lead and counsel pick.

---

## Related rules

- `common/02-design-principles.md` §「Maximum-effort hole closure + mechanical exhaustiveness + periodic re-audit」 — process-side complement to this rule's content-side principle; both rules cover the audit + release discipline against AI-equipped adversaries.
- `common/13-session-recovery.md` — cold-start review of any docs about to be republished should re-apply this rule (handover docs are a recurring source of inadvertent over-disclosure).
- `common/14-decision-framework.md` — when balancing "transparency" vs "attack surface," the project-lead anchor is the deciding voice; this rule provides the framing question ("would the plaintiff / attacker use this?").
- `digicode/06-secrets.md` — strict subset for credentials; this rule generalizes the principle to non-secret disclosures.
- `digicode/14-security-pre-commit.md` — the scan catches accidental secret leaks; this rule prevents the broader category of "non-secret-but-still-useful-to-an-attacker" leaks that scanners won't flag.
- `common/15-docs-organization.md` — placement discipline is the structural pair to this rule's content discipline; together they answer "where does it go" and "should it exist at all."
- `common/judgment-mistakes-history.md` case 18 / case 19 cluster — concrete failure history showing why "manual eyeball cluster audit" structurally fails; motivated the adversary-parity principle.

---

## Sync protocol with project memory

When this rule is applied to produce a meaningful project-level decision (e.g., "DigiCode legal docs adopt the no-cap, no-citation, contact-form-only approach"), record the decision as a memory entry pointing back to this rule. The rule defines the *principle*; the memory records the *applied outcome*, so future sessions can re-confirm without re-deriving.

When the rule itself changes (new anti-pattern observed, new domain), update `Last reviewed` and add the case to `Related cases`. Cross-project applicability: this rule's spirit transfers to any project that publishes legal terms, public APIs, security posture, or open-source internals.
