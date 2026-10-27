# Yield/Fidelity: decision first

The primary task is to select a Base vault and deposit, then understand how long estimated yield takes to recover entry and exit costs. Preserve the established coral/charcoal identity and evidence gates.

Ratio      1.2 for information; display deliberately separate
Body       16px / 1.6 / measure 65ch; monospace for data and short labels
Display    clamp(3rem, 6vw, 5.5rem) / 0.98 / weight 700 / -0.055em
Grid       12 columns; 24px gutter; 24–48px page margins; calculator 5+7
Unit       8px
Paper      #EBEBEB; ink #1E1E1E; dark surface #2A2A2A; subdued text #AFAFAF on dark
Accent     #FE5238 for surfaces, #FF765F for small dark-surface text, #A82A18 on light
Signature  A short result entrance, once; input feedback remains immediate
Motion off Final result remains visible; animation and transition reduced

## Decisions

- Compress the marketing hero into a task introduction. The calculator is the product, not a CTA below a poster.
- Retain one primary heading and the existing Break-Even Analyzer heading for orientation.
- Use sentence case and plain instructions in the form; keep technical IDs secondary.
- Keep the result, selected vault, APY basis and uncertainty together. Never imply that headline APY is realized yield.
- Bound the vault picker so a large catalog cannot bury the result on mobile.
- Keep sensitivity, fee provenance and methodology available. No new yield claims, sample results, network changes or investment recommendations.
- Preserve keyboard-native radio controls, visible focus, live result announcements and all unavailable/loading/error states.

## Scope

Homepage and calculator first. Shared navigation keeps existing routes. Existing dashboard, chart, evidence gate, ingestion and calculation algorithms retain their behavior.

## Acceptance criteria

1. Desktop calculator controls begin within the first 900px at 1440px wide; mobile within 720px at 390px wide.
2. Deposit, vault search/selection and APY basis remain keyboard accessible and update the displayed estimate.
3. Selected vault and rate basis are visible beside the result. Invalid deposits explain the next step.
4. Historical rates remain disabled without sufficient observations; API failures have a working retry.
5. No page-level horizontal overflow at 390px; automated WCAG A/AA checks pass at desktop and phone widths in an available browser. Record engine-specific failures separately.
6. Existing model tests, lint and production build pass; no backend or financial logic changes.

## Verification limits

Record exact checks and render paths in docs/design-loop.md. Automated accessibility checks do not establish complete WCAG conformance. Do not claim Safari, Windows or user testing unless actually exercised.
