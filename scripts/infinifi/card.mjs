// Builds the 1080x1080 chart card from a collected report: Rahil Design tokens, charcoal canvas, light figure.
// Usage: node scripts/infinifi/card.mjs REPORT.json OUT.html [FONTS_DIR]
// FONTS_DIR holds Anton-Regular.ttf, IBMPlexSans-Regular.ttf and IBMPlexSans-SemiBold.ttf (the rahil-design bundle
// ships them under assets/fonts); the card embeds them so the render does not depend on installed fonts.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Rahil Design tokens (assets/tokens.json): canvas, ink, secondary, figure-surface, figure-ink, figure-secondary,
// chart series-1, series-3 and highlight.
const COLOR = {
    canvas: '#111214', ink: '#F5F5EF', secondary: '#B7B8B1',
    figure: '#F5F5EF', figureInk: '#111214', figureSecondary: '#52545A',
    series1: '#111214', series3: '#76787D', highlight: '#FFE500',
};
const SIZE = 1080;
const AXIS_MAX_PERCENT = 8;
const TRACK_WIDTH = 372;

const need = (value, field) => {
    if (value === null || value === undefined || Number.isNaN(value)) throw new Error(`report is missing ${field}; the card does not estimate`);
    return value;
};
const percent = (fraction, digits = 2) => `${(fraction * 100).toFixed(digits)}%`;
const signed = (value) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}`;
const points = (value) => `${signed(value)} pts`;
const grouped = (value) => value.toLocaleString('en-US');
const dollars = (value) => `$${(value / 1e6).toFixed(2)}M`;
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (timestamp) => new Date(timestamp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayYear = (timestamp) => new Date(timestamp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const clock = (timestamp) => new Date(timestamp * 1000).toISOString().slice(11, 16);

/** The text the card shows, taken from the report. Exported so tests can check every number. */
export function cardText(report) {
    const window = report.siUSD.windows[30];
    const reserves = report.reserves;
    const earned = need(window.realizedApy, 'siUSD 30-day realised APY');
    const published = need(window.advertisedApy, 'siUSD 30-day published APY');
    const gap = need(window.gapPoints, 'siUSD 30-day gap');
    need(reserves.readable ? reserves.reserveRatio : null, 'the reserve ratio');
    const lockedGaps = report.locked
        .filter((bucket) => bucket.evaluated && bucket.windows[30]?.gapPoints != null)
        .map((bucket) => bucket.windows[30].gapPoints);
    const startTimestamp = window.startTimestamp;
    const endTimestamp = report.endBlock.timestamp;
    return {
        title: `siUSD earned ${percent(earned)} vs ${percent(published)} published`,
        kicker: `siUSD APY, 30 days to ${day(endTimestamp)}`,
        earned: percent(earned),
        published: percent(published),
        gap: points(gap),
        lockedNote: lockedGaps.length
            ? `${lockedGaps.length} liUSD buckets: gaps ${signed(Math.max(...lockedGaps))} to ${signed(Math.min(...lockedGaps))} pts`
            : null,
        reserveKicker: 'Reserve ratio, liquid share of deposits',
        reserve: percent(reserves.reserveRatio, 1),
        reserveDetail: `${dollars(reserves.liquidReserves)} of ${dollars(reserves.totalDeposits)}`,
        footer: [
            `Blocks ${grouped(window.startBlock)} to ${grouped(report.endBlock.number)} · ${day(startTimestamp)} to ${dayYear(endTimestamp)}, ${clock(endTimestamp)} UTC`,
            `Reserves read at block ${grouped(reserves.block)} · Ethereum mainnet`,
            'Source: infiniFi docs, infiniFi API, Ethereum RPC · Yield/Fidelity',
        ],
        earnedWidth: (earned * 100) / AXIS_MAX_PERCENT,
        publishedWidth: (published * 100) / AXIS_MAX_PERCENT,
        reserveFraction: reserves.reserveRatio,
    };
}

export function buildCardHtml(report, fonts) {
    const text = cardText(report);
    const row = (label, value, bars) => `<div class="row"><span class="label">${label}</span><span class="track">${bars}<span class="value">${value}</span></span></div>`;
    const bar = (fraction, className) => `<span class="bar ${className}" style="width:${Math.round(TRACK_WIDTH * fraction)}px"></span>`;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(text.title)}</title><style>
@font-face{font-family:'Rahil Display';font-weight:400;src:url(data:font/ttf;base64,${fonts.display})}
@font-face{font-family:'Rahil Plex';font-weight:400;src:url(data:font/ttf;base64,${fonts.body})}
@font-face{font-family:'Rahil Plex';font-weight:600;src:url(data:font/ttf;base64,${fonts.bodyBold})}
*{box-sizing:border-box}html,body{margin:0}
body{width:${SIZE}px;height:${SIZE}px;background:${COLOR.canvas};color:${COLOR.ink};font-family:'Rahil Plex',sans-serif}
article{width:${SIZE}px;height:${SIZE}px;padding:48px;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;gap:28px}
h1{font:96px/1.02 'Rahil Display',sans-serif;margin:0;text-transform:uppercase}
.figure{background:${COLOR.figure};color:${COLOR.figureInk};border-radius:12px;padding:24px 36px;display:flex;flex-direction:column;justify-content:space-between;font-variant-numeric:tabular-nums}
.kicker{font-size:48px;line-height:1.1;color:${COLOR.figureSecondary};margin:0 0 8px}
.row{display:grid;grid-template-columns:276px 1fr;align-items:center;gap:8px;margin:6px 0}
.label{font-size:60px;line-height:1.1;white-space:nowrap}
.track{display:flex;align-items:center;gap:0}
.bar{display:block;height:54px;flex:none}
.bar.context{background:${COLOR.series3}}
.bar.hi{background:${COLOR.highlight};outline:3px solid ${COLOR.series1};outline-offset:-3px}
.share{display:flex;align-items:baseline;gap:20px}
.share .value{margin-left:0}
.detail{font-size:44px;line-height:1.1;color:${COLOR.figureSecondary}}
.split{display:flex;height:36px;margin-top:6px}
.split .liquid{background:${COLOR.series1}}
.split .rest{flex:1;background:${COLOR.series3}}
.value{font:600 72px/1 'Rahil Plex',sans-serif;white-space:nowrap;margin-left:16px}
.gap{font-size:60px;line-height:1.1;margin:6px 0 0}
.note{font-size:44px;line-height:1.1;color:${COLOR.figureSecondary};margin:8px 0 0}
.rule{height:3px;background:${COLOR.series3};margin:16px 0}
.source{font-size:28px;line-height:1.25;color:${COLOR.secondary};margin:0}
</style></head><body><article><h1>${escapeHtml(text.title)}</h1>
<div class="figure"><div>
<p class="kicker">${escapeHtml(text.kicker)}</p>
${row('Published', text.published, bar(text.publishedWidth, 'context'))}
${row('Earned', text.earned, bar(text.earnedWidth, 'hi'))}
<p class="gap">Gap ${text.gap}</p>
${text.lockedNote ? `<p class="note">${escapeHtml(text.lockedNote)}</p>` : ''}
</div><div class="rule"></div><div>
<p class="kicker">${escapeHtml(text.reserveKicker)}</p>
<div class="share"><span class="value">${text.reserve}</span><span class="detail">${escapeHtml(text.reserveDetail)}</span></div>
<div class="split"><span class="liquid" style="width:${(text.reserveFraction * 100).toFixed(2)}%"></span><span class="rest"></span></div>
</div></div>
<p class="source">${text.footer.map(escapeHtml).join('<br>')}</p></article></body></html>`;
}

async function loadFonts(directory) {
    const read = async (name) => (await readFile(path.join(directory, name))).toString('base64');
    return {
        display: await read('Anton-Regular.ttf'),
        body: await read('IBMPlexSans-Regular.ttf'),
        bodyBold: await read('IBMPlexSans-SemiBold.ttf'),
    };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const [reportPath, outPath, fontsDirectory = process.env.RAHIL_DESIGN_FONTS] = process.argv.slice(2);
    if (!reportPath || !outPath || !fontsDirectory) {
        console.error('usage: node scripts/infinifi/card.mjs REPORT.json OUT.html FONTS_DIR');
        process.exit(2);
    }
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    await writeFile(outPath, buildCardHtml(report, await loadFonts(fontsDirectory)));
    console.log(`wrote ${outPath}`);
}
