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
