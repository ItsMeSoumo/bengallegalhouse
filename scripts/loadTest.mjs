import { argv } from "node:process";

// Simple command-line args parsing
const getArgValue = (flag, defaultValue) => {
  const index = argv.indexOf(flag);
  if (index !== -1 && index + 1 < argv.length) {
    return argv[index + 1];
  }
  return defaultValue;
};

const concurrency = parseInt(getArgValue("--concurrency", "5"), 10);
const totalRequests = parseInt(getArgValue("--requests", "10"), 10);
const targetUrl = getArgValue("--url", "http://localhost:3000");

console.log(`\n🚀 Starting CBT Concurrency Test`);
console.log(`---------------------------------`);
console.log(`Target URL:     ${targetUrl}`);
console.log(`Concurrency:    ${concurrency} virtual users`);
console.log(`Total Requests: ${totalRequests}`);
console.log(`---------------------------------\n`);

// Simulated candidate submission payload
const createPayload = (index) => {
  const mockAnswers = Array(100).fill(null).map(() => Math.floor(Math.random() * 4));
  return {
    examId: "culet-2026-mock-2",
    candidateName: `LoadTest Candidate ${index + 1}`,
    candidateEmail: `loadtest_candidate_${index + 1}@example.com`,
    answers: mockAnswers,
    timeTaken: Math.floor(Math.random() * 3600) + 1200,
  };
};

async function runTest() {
  const results = [];
  let requestCounter = 0;

  // Single request task
  const sendRequest = async (id) => {
    const payload = createPayload(id);
    const start = performance.now();
    try {
      const response = await fetch(`${targetUrl}/api/exam/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const end = performance.now();
      const latency = Math.round(end - start);

      return {
        id,
        status: response.status,
        success: data.success,
        latency,
        error: data.success ? null : data.error,
      };
    } catch (err) {
      const end = performance.now();
      const latency = Math.round(end - start);
      return {
        id,
        status: "NETWORK_ERROR",
        success: false,
        latency,
        error: err.message,
      };
    }
  };

  const pool = new Set();
  const queue = Array.from({ length: totalRequests }, (_, i) => i);

  const executeNext = async () => {
    if (queue.length === 0) return;
    const currentId = queue.shift();
    const promise = sendRequest(currentId).then((res) => {
      results.push(res);
      pool.delete(promise);
    });
    pool.add(promise);
    await promise;
    await executeNext();
  };

  const startTotal = performance.now();

  // Initialize concurrency pool
  const initialPromises = [];
  for (let i = 0; i < Math.min(concurrency, totalRequests); i++) {
    initialPromises.push(executeNext());
  }
  await Promise.all(initialPromises);

  // Wait for any remaining promises in pool
  while (pool.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const endTotal = performance.now();
  const totalDurationSec = ((endTotal - startTotal) / 1000).toFixed(2);

  // Calculate stats
  const successfulRequests = results.filter((r) => r.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const sumLatencies = latencies.reduce((sum, val) => sum + val, 0);
  const avgLatency = Math.round(sumLatencies / totalRequests);
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || maxLatency;

  console.log(`📊 Concurrency Test Results:`);
  console.log(`---------------------------------`);
  console.log(`Total Time Taken:      ${totalDurationSec} seconds`);
  console.log(`Requests Completed:    ${results.length}`);
  console.log(`  - Success count:     ${successfulRequests}`);
  console.log(`  - Failure count:     ${failedRequests}`);
  console.log(`Requests/Sec (RPS):    ${(results.length / totalDurationSec).toFixed(2)}`);
  console.log(`Latency Metrics:`);
  console.log(`  - Min Latency:       ${minLatency}ms`);
  console.log(`  - Avg Latency:       ${avgLatency}ms`);
  console.log(`  - 95th Percentile:   ${p95Latency}ms`);
  console.log(`  - Max Latency:       ${maxLatency}ms`);
  
  if (failedRequests > 0) {
    console.log(`\n❌ Error Breakdown:`);
    const errors = {};
    results.forEach((r) => {
      if (!r.success) {
        const key = `${r.status}: ${r.error || "Unknown error"}`;
        errors[key] = (errors[key] || 0) + 1;
      }
    });
    for (const [err, count] of Object.entries(errors)) {
      console.log(`  - [${count} occurrences]: ${err}`);
    }
  }
  console.log(`---------------------------------\n`);
}

runTest();
