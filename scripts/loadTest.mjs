import { argv } from "node:process";

// Command-line args helper
const getArgValue = (flag, defaultValue) => {
  const index = argv.indexOf(flag);
  if (index !== -1 && index + 1 < argv.length) {
    return argv[index + 1];
  }
  return defaultValue;
};

const concurrency = parseInt(getArgValue("--concurrency", "300"), 10);
const totalRequests = parseInt(getArgValue("--requests", "300"), 10);
const targetUrl = getArgValue("--url", "http://localhost:3000").replace(/\/$/, "");
const examId = getArgValue("--examId", "culet-2026-mock-2");
const phase = getArgValue("--phase", "all"); // 'all', 'questions', 'submit'

console.log(`\n=================================================`);
console.log(`🚀 CBT HIGH CONCURRENCY LOAD TEST SUITE`);
console.log(`=================================================`);
console.log(`Target Host:     ${targetUrl}`);
console.log(`Exam ID:         ${examId}`);
console.log(`Concurrency:    ${concurrency} Virtual Users (VUs)`);
console.log(`Total Requests: ${totalRequests}`);
console.log(`Phase Mode:     ${phase.toUpperCase()}`);
console.log(`Environment:     Free Vercel / Free Firebase Target`);
console.log(`=================================================\n`);

// Helper to compute percentile latency
const getPercentile = (sortedArray, p) => {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
};

const runId = Date.now();
// Simulated submission payload
const createPayload = (index) => {
  const mockAnswers = Array(100).fill(null).map(() => Math.floor(Math.random() * 4));
  return {
    examId,
    candidateName: `LoadTest Student ${index + 1} (${runId})`,
    candidateEmail: `loadtest_student_${index + 1}_${runId}@example.com`,
    answers: mockAnswers,
    timeTaken: Math.floor(Math.random() * 3600) + 1200,
    tabSwitchCount: Math.floor(Math.random() * 3),
    autoSubmitted: Math.random() > 0.8,
  };
};

// Generic worker pool runner
async function runWorkerPool(taskFn, totalCount, concurrentLimit) {
  const results = [];
  const queue = Array.from({ length: totalCount }, (_, i) => i);
  const activePool = new Set();

  const worker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      const promise = taskFn(id).then((res) => {
        results.push(res);
        activePool.delete(promise);
      });
      activePool.add(promise);
      await promise;
    }
  };

  const initialWorkers = [];
  for (let i = 0; i < Math.min(concurrentLimit, totalCount); i++) {
    initialWorkers.push(worker());
  }
  await Promise.all(initialWorkers);

  while (activePool.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  return results;
}

// Print phase statistics table
function printStats(phaseName, results, totalTimeSec) {
  const total = results.length;
  const successList = results.filter((r) => r.success);
  const successCount = successList.length;
  const failCount = total - successCount;
  const rps = (total / totalTimeSec).toFixed(2);

  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const avgLatency = Math.round(latencies.reduce((sum, v) => sum + v, 0) / (total || 1));
  const p50 = getPercentile(latencies, 50);
  const p90 = getPercentile(latencies, 90);
  const p95 = getPercentile(latencies, 95);
  const p99 = getPercentile(latencies, 99);

  console.log(`\n📊 PHASE RESULTS: [${phaseName}]`);
  console.log(`-------------------------------------------------`);
  console.log(`Duration:              ${totalTimeSec} seconds`);
  console.log(`Total Requests:        ${total}`);
  console.log(`  - Successful (2xx):  ${successCount} (${((successCount / total) * 100).toFixed(1)}%)`);
  console.log(`  - Failed / Errors:   ${failCount} (${((failCount / total) * 100).toFixed(1)}%)`);
  console.log(`Throughput:            ${rps} req/sec (RPS)`);
  console.log(`Latency Breakdown:`);
  console.log(`  - Min Latency:       ${minLatency} ms`);
  console.log(`  - Avg Latency:       ${avgLatency} ms`);
  console.log(`  - 50th Percentile (p50): ${p50} ms`);
  console.log(`  - 90th Percentile (p90): ${p90} ms`);
  console.log(`  - 95th Percentile (p95): ${p95} ms 🔥`);
  console.log(`  - 99th Percentile (p99): ${p99} ms`);
  console.log(`  - Max Latency:       ${maxLatency} ms`);

  if (failCount > 0) {
    console.log(`\n❌ Error Summary:`);
    const errMap = {};
    results.forEach((r) => {
      if (!r.success) {
        const key = `Status ${r.status}: ${r.error || "Unknown"}`;
        errMap[key] = (errMap[key] || 0) + 1;
      }
    });
    Object.entries(errMap).forEach(([err, count]) => {
      console.log(`  - [${count}x]: ${err}`);
    });
  }
  console.log(`-------------------------------------------------\n`);

  return { successCount, failCount, p95, rps: parseFloat(rps) };
}

async function main() {
  let overallSuccess = true;

  // ── PHASE 1: Fetch Questions (Exam Start Spike) ──────────────────────────
  if (phase === "all" || phase === "questions") {
    console.log(`⏳ [PHASE 1] Simulating ${concurrency} Candidates Fetching Exam Paper (GET /api/exam/questions)...`);
    const start1 = performance.now();

    const fetchQuestionTask = async (id) => {
      const reqStart = performance.now();
      try {
        const res = await fetch(`${targetUrl}/api/exam/questions?examId=${encodeURIComponent(examId)}`);
        const data = await res.json();
        const latency = Math.round(performance.now() - reqStart);
        return {
          id,
          status: res.status,
          success: res.ok && data.success,
          latency,
          error: data.error || (res.ok ? null : `HTTP ${res.status}`),
        };
      } catch (err) {
        return {
          id,
          status: "NETWORK_ERR",
          success: false,
          latency: Math.round(performance.now() - reqStart),
          error: err.message,
        };
      }
    };

    const phase1Results = await runWorkerPool(fetchQuestionTask, totalRequests, concurrency);
    const duration1Sec = ((performance.now() - start1) / 1000).toFixed(2);
    const stats1 = printStats("PHASE 1: Fetch Questions", phase1Results, duration1Sec);

    if (stats1.failCount > 0 || stats1.p95 > 2000) {
      overallSuccess = false;
    }
  }

  // ── PHASE 2: Submit Answers (Exam End Burst) ─────────────────────────────
  if (phase === "all" || phase === "submit") {
    console.log(`⏳ [PHASE 2] Simulating ${concurrency} Candidates Submitting Answers (POST /api/exam/submit)...`);
    const start2 = performance.now();

    const submitTask = async (id) => {
      const payload = createPayload(id);
      const reqStart = performance.now();
      try {
        const res = await fetch(`${targetUrl}/api/exam/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const latency = Math.round(performance.now() - reqStart);
        return {
          id,
          status: res.status,
          success: res.ok && data.success,
          latency,
          error: data.error || (res.ok ? null : `HTTP ${res.status}`),
        };
      } catch (err) {
        return {
          id,
          status: "NETWORK_ERR",
          success: false,
          latency: Math.round(performance.now() - reqStart),
          error: err.message,
        };
      }
    };

    const phase2Results = await runWorkerPool(submitTask, totalRequests, concurrency);
    const duration2Sec = ((performance.now() - start2) / 1000).toFixed(2);
    const stats2 = printStats("PHASE 2: Exam Submissions", phase2Results, duration2Sec);

    if (stats2.failCount > 0 || stats2.p95 > 3000) {
      overallSuccess = false;
    }
  }

  // ── FINAL SLA VERDICT ──────────────────────────────────────────────────────
  console.log(`=================================================`);
  if (overallSuccess) {
    console.log(`✅ LOAD TEST PASSED FOR ${concurrency} CONCURRENT STUDENTS!`);
    console.log(`Your system is READY to handle 300 candidates on Free Vercel / Firebase.`);
  } else {
    console.log(`⚠️ LOAD TEST FINISHED WITH WARNINGS / FAILURES.`);
    console.log(`Check error summaries and latencies above.`);
  }
  console.log(`=================================================\n`);
}

main().catch((err) => {
  console.error("Fatal Load Test Error:", err);
  process.exit(1);
});
