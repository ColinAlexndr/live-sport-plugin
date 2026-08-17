const { parseTimezone } = require('./src/timezone');

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName} | Expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  }
}

// Target correct moment: August 16, 2026, 20:00:00 UTC
// 1786910400000 milliseconds
const EXPECTED_MS = 1786910400000;

console.log("=== Running Timezone Tests ===\n");

// 1. UTC timestamp string
assertEqual(
  parseTimezone("2026-08-16 20:00", "UTC"),
  EXPECTED_MS,
  "1. UTC timestamp without offset but mapped to UTC"
);

// 2. IST timestamp
// 20:00 UTC is 01:30 IST on August 17
assertEqual(
  parseTimezone("2026-08-17 01:30", "Asia/Kolkata"),
  EXPECTED_MS,
  "2. IST timestamp mapped to Asia/Kolkata"
);

// 3. US Eastern Time during daylight-saving time (EDT: UTC-4)
// 20:00 UTC is 16:00 EDT on August 16
assertEqual(
  parseTimezone("2026-08-16 16:00", "America/New_York"),
  EXPECTED_MS,
  "4. US Eastern Time during daylight-saving time (EDT)"
);

// 4. US Eastern Time during standard time (EST: UTC-5)
// Let's test a January date
// January 15, 2026, 20:00:00 UTC = 1768507200000
const EXPECTED_MS_WINTER = 1768507200000;
// 20:00 UTC is 15:00 EST on January 15
assertEqual(
  parseTimezone("2026-01-15 15:00", "America/New_York"),
  EXPECTED_MS_WINTER,
  "3. US Eastern Time during standard time (EST)"
);

// 5. European timezone with DST (CEST: UTC+2)
// 20:00 UTC is 22:00 CEST on August 16
assertEqual(
  parseTimezone("2026-08-16 22:00", "Europe/Paris"),
  EXPECTED_MS,
  "5. European timezone with DST (CEST)"
);

// European timezone standard time (CET: UTC+1)
// 20:00 UTC is 21:00 CET on January 15
assertEqual(
  parseTimezone("2026-01-15 21:00", "Europe/Paris"),
  EXPECTED_MS_WINTER,
  "5b. European timezone standard time (CET)"
);

// 6. Unix timestamp (seconds)
assertEqual(
  parseTimezone(1786910400),
  EXPECTED_MS,
  "6. Unix timestamp (seconds)"
);

// 6b. Unix timestamp (milliseconds)
assertEqual(
  parseTimezone(1786910400000),
  EXPECTED_MS,
  "6b. Unix timestamp (milliseconds)"
);

// 7. ISO 8601 timestamp containing an explicit offset (+05:30)
assertEqual(
  parseTimezone("2026-08-17T01:30:00+05:30"),
  EXPECTED_MS,
  "7. ISO 8601 timestamp containing an explicit offset"
);

// 8. ISO 8601 timestamp containing Z
assertEqual(
  parseTimezone("2026-08-16T20:00:00Z"),
  EXPECTED_MS,
  "8. ISO 8601 timestamp containing Z"
);

// 9. Timestamp with no timezone information (defaulting to UTC via second param)
assertEqual(
  parseTimezone("2026-08-16T20:00:00", "UTC"),
  EXPECTED_MS,
  "9. Timestamp with no timezone information"
);

// 10. Two different sources providing the same event in different timezone formats
const cdnLiveSource = parseTimezone("2026-08-16 20:00", "UTC"); // CdnLive gives UTC
const timStreamsSource = parseTimezone("2026-08-16 16:00", "America/New_York"); // TimStreams gives US Eastern

if (cdnLiveSource === timStreamsSource && cdnLiveSource === EXPECTED_MS) {
  console.log("✅ PASS: 10. Two different sources providing the same event in different timezone formats match perfectly.");
} else {
  console.error("❌ FAIL: 10. Sources did not match.");
  process.exitCode = 1;
}

// Edge case: Events around midnight (Crossing midnight due to offset)
// CdnLive: 2026-08-17 01:00 UTC (Next day)
// TimStreams: 2026-08-16 21:00 EDT (Previous day)
const midnightExpectedMs = 1786928400000;
assertEqual(
  parseTimezone("2026-08-17 01:00", "UTC"),
  midnightExpectedMs,
  "11a. Event around midnight in UTC"
);
assertEqual(
  parseTimezone("2026-08-16 21:00", "America/New_York"),
  midnightExpectedMs,
  "11b. Event around midnight in EDT"
);

console.log("\nTesting completed.");
