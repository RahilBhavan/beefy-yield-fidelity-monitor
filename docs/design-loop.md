# UI/UX improvement loop

Use this bounded workflow for a focused interface improvement. A request to use the loop does not authorize an endless redesign or a standing automation.

1. **Choose a task.** Read PRD.md, DIRECTION.md and project instructions. Identify one user decision and observable friction. Capture current head/base and protect unrelated work. Preserve financial logic and evidence gates.
2. **Define success.** Write falsifiable criteria for discovery, comprehension, interaction, failure states and narrow layouts. Preserve product identity; explain any departure. “100x” expresses ambition, not a measurable outcome.
3. **Implement one coherent revision.** Keep the primary action and its result together. Use existing semantics, keyboard controls, readable labels and explicit estimates. No fabricated data or unsupported financial claims.
4. **Prove it.** Run `npm run check` and `npm run test:e2e`. Inspect actual desktop and phone renders with deterministic, clearly identified fixtures. Exercise search, invalid input, rate switching, unavailable evidence and retry. Record exact paths/hashes and platform limits. Keep installs/builds under `~/scratch/beefy-yield-fidelity-monitor/`.
5. **Convene council.** Discover live provider/model/options. Request independent read-only reviews from flagship Claude, GPT Sol and Gemini at advertised high effort. Give all three the same pinned diff, brief, screenshots and check results. Ask for stable IDs, concrete triggers, severity, Standards/Spec separation, design critique, missing proof, dissent, verdict and score /10. No reviewer edits, delegation or external messages. Missing review is not approval.
6. **Adjudicate once.** Prove findings against code and observed behavior. Record fixed, declined-with-evidence or unresolved findings. One shared repair pass across council and CI is the default. After a repair, rerun affected checks and request fresh independent verification of changed artifacts/open findings. Never change the artifact while it is under review.
7. **Full send.** Commit only task scope, push and open a problem-first PR. Link it to T3 immediately. Watch through the native PR watcher if checks/reviews remain pending. Merge only when final-head proof, required CI/reviews, material findings and applicable visual gates all pass. Fetch live head/base/checks/mergeability immediately before merging; no bypasses. Confirm actual merged state.
8. **Stop.** Stop on satisfaction, unavailable review, exhausted repair allowance or unresolved material disagreement. Report the exact remaining gate. Clean scratch after evidence is saved. A later improvement begins a separately scoped task, not another attempt to force agreement.

## Current iteration

- Task: homepage/calculator decision flow; scope in DIRECTION.md.
- Base: `22b2c2f4e399785903885176574b262ea54b220d` (`origin/main` when work began).
- Kept: coral/charcoal identity, calculator formulas, API/ingestion behavior, observed-rate gating and provenance.
- Changed: shorter task introduction, earlier calculator, 5:7 desktop workspace, bounded phone picker, sentence-case form labels, selected-vault context and more readable explanations.
- Proof: lint, 54 unit tests (one integration test intentionally skipped without its opt-in), and production build pass. Firefox desktop/phone renders inspected at 1440px and 390px; deposit control starts at y=578px and y=702px respectively. Screenshots under docs/design-evidence/ use a synthetic $10 deposit, 12% APY and $0.13 total fees (42 days). Browser/council results recorded below.
- Limits: deterministic browser fixtures are synthetic, not live investment evidence. Firefox desktop/phone renders and automated accessibility checks; local Chromium screenshot capture hangs even for a standalone Hello page, so full Chromium verification remains unavailable; no human usability study or quantified improvement claim.
- Repair budget: 0 used / 1 available.

### Initial proof

- `npm run check`: lint, 54 unit tests and production build passed in the disk-backed validation copy.
- `npx playwright test --workers=2`: 20/20 passed using a validation-only config with Desktop Firefox and a 390×844 Firefox viewport. Repository Chromium projects remain unchanged for CI.
- Chromium local tests: partial interaction checks passed; screenshot and accessibility completion unavailable because capture hangs even for a standalone Hello page. Firefox provided completed visual/accessibility evidence.
- `git diff --check`: passed.

### Council round 1 — pinned head 7174954

Actual reviewers: Claude Opus 5.5 / high (claudeAgent), GPT-6.1 Sol / high (Codex), Gemini 4 Argon High (Antigravity). Code scores: 8.0, 8.5, 8.3 / 10 respectively; Claude design score 7.0. Usage was not exposed. Full independent responses and task IDs are retained in `design-evidence/council-round-1.json`.

| Finding | Source / severity | Disposition in shared repair |
| --- | --- | --- |
| Hidden phone sensitivity output | Claude D1 / medium; Gemini SPEC-01 / medium; Sol nonblocking | Fixed: remove forced minimum width; assert table has no inner horizontal overflow. |
| Daily yield rounds to $0.00 | Claude D2 / medium-low | Fixed: positive sub-cent earnings display as `<$0.01`; no formula change. |
| Invalid input contrast and disappearing announcement | Gemini STD-01 / medium; Claude S4 / low | Fixed: solid subdued text and persistent live region outside conditional results; invalid-state Axe check. |
| Focus on light selected rows | Gemini STD-02 / low | Fixed: use current text color for inset outline; restore global input focus outline. |
| Loading split/padding typo | Claude S1/S2; Gemini STD-03 / low | Fixed: same 5:7 geometry and padding as loaded state. |
| Desktop accessibility proof absent | Sol SPEC-01 / medium | Fixed: homepage Axe no longer resets the desktop project to phone width. Explicit 1440×900 and 390×844 projects. |
| Mobile input/result distance | Claude D3; Gemini design critique | Improved: shorter phone intro plus compact live result/source beside deposit, linked to detailed result. |
| Styling selectors in tests | Claude S3 / low | Fixed: named result region replaces animation-class selectors. |
| Order/icon inconsistency | Claude P2/D4 / low | Fixed: copy matches deposit-first form; consistent internal arrow. |
| Empty desktop list; long catalog proof | Claude D5/V1; Gemini critique; Sol missing proof | Improved: cap desktop picker at 480px; phone remains 180px; exercise 26 vaults and a long-name selection. |
| Reproduction and tablet evidence | Claude V3/V4; Gemini history-render gap | Fixed: committed Firefox switch and opt-in screenshot capture; render 768px and enabled historical-rate state. |
| Many keyboard tab stops in catalog | Gemini nonblocking critique | Deferred: native buttons remain keyboard-operable; roving selection needs a separately scoped interaction change. |
| Headline wording / quieter brand | Claude preference; Gemini tradeoff | Retained: planning language, source labels and caveats qualify estimates; task-first hierarchy is intentional. |

Disagreement remains recorded: Sol treated the inherited phone table clipping as nonblocking; Gemini requested changes and Claude recommended repair. We accepted the evidence and fixed it regardless of severity labels.

Repair budget: **1 used / 0 remaining**. Verification of this pass completed; see the final record below. No further repair loop is authorized by this workflow's default.

### Reproduce

From an ordinary checkout with local dependencies, run `npm ci`, `npm run check`, and `npm run test:e2e` for CI's default Chromium projects. For the alternate engine: `npx playwright install firefox` then `E2E_BROWSER=firefox npm run test:e2e`.

To regenerate the committed synthetic renders, run `E2E_BROWSER=firefox DESIGN_SCREENSHOTS_DIR="$PWD/docs/design-evidence" npx playwright test --project=desktop-firefox --grep 'sensitivity outputs|phone picker'`. Screenshots are opt-in; normal CI does not rewrite the committed evidence. Refresh SHA256SUMS after inspection. Build and install inside disk-backed scratch when following this machine's workspace instructions.

### Repair proof

- Lint, 54 unit tests and production build pass after the repair. Integration opt-in remains skipped.
- Firefox suite: 24/24 pass, including desktop and phone homepage Axe scans, invalid-deposit and API-error Axe scans, 26-vault/long-name behavior, table fit and adjacent phone feedback. Two targeted capture tests also pass after final copy normalization.
- Final synthetic renders inspected at 1440px, 768px and 390px; deposit field top is 578px, 526px and 666px respectively. Enabled historical rate is selected in the main renders. Phone summary updates from 42 days (headline) to 161 days (realized) in the interaction test.
- Sensitivity output stays inside its container at both tested project widths. The phone picker remains at most 180px with 26 vaults.
- Screenshot capture normalizes focus/scroll and waits for layout after resizing. Singular day labels were corrected during this same pass.
- Local Chromium capture remains unavailable; CI's default desktop/mobile Chromium run is a merge gate. No Safari, native touch-device or human screen-reader test is claimed.


### Final council verification and CI

Reviewed implementation: `22288735561088c2bd286fe1ba73aeaf93e25a97`. The second round is complete: Claude Opus 5.5 high **approve, 8.6/10**; GPT-6.1 Sol high **approve, 9.0/10**; Gemini 4 Argon High **approve, 9.5/10**. No material finding or substantive disagreement remains. Full reports, actual settings and task IDs are in `design-evidence/council-round-2.json`. Usage was not exposed.

The initial attempt to launch two verification tasks returned `parent_not_active`. Thread reconciliation confirmed they had not launched; the same stable request IDs were recovered, with no duplicate review round or additional repair.

CI run `40426613668` passed on the reviewed implementation: lint, production build, dependency audit, migration checks, **52 tracked unit tests** (one opt-in integration test skipped), and **24 desktop/mobile Chromium browser checks**. Both Vercel checks also passed. The earlier local 54-test count included two tests in an ignored scratch folder copied into validation; moving that validation-only copy outside the test root produced the same 52-test tracked suite as CI. The original workspace scratch folder was preserved.

Accepted nonblocking limits: native catalog buttons create multiple tab stops; sparse desktop selections leave unused panel space; invalid phone guidance is farther down than the input; the screenshot indicator/hover treatment is development tooling. No Safari, physical-device, human screen-reader or human-usability validation is claimed. Automated Axe scans support only their tested states.

This final record changes documentation only. Implementation and rendered artifact hashes remain those approved at `2228873`; no second repair was made. Merge still requires passing checks on the latest PR head and a fresh live head/base/review/mergeability inspection.
