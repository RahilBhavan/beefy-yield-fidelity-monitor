const target = process.env.LOAD_TEST_URL || 'http://127.0.0.1:3000/api/data';
const requests = Number(process.env.LOAD_TEST_REQUESTS || 40);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 8);
const maximumP95Ms = Number(process.env.LOAD_TEST_MAX_P95_MS || 2_500);

const durations = [];
let failures = 0;
let nextRequest = 0;

async function worker() {
    while (nextRequest < requests) {
        nextRequest += 1;
        const started = performance.now();
        try {
            const response = await fetch(target);
            if (!response.ok) failures += 1;
            await response.arrayBuffer();
        } catch {
            failures += 1;
        } finally {
            durations.push(performance.now() - started);
        }
    }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
durations.sort((a, b) => a - b);
const percentile = (value) => durations[Math.min(durations.length - 1, Math.ceil(durations.length * value) - 1)];
const summary = {
    target,
    requests,
    concurrency,
    failures,
    p50Ms: Math.round(percentile(0.5)),
    p95Ms: Math.round(percentile(0.95)),
};
console.log(JSON.stringify(summary));

if (failures > 0 || summary.p95Ms > maximumP95Ms) process.exitCode = 1;
