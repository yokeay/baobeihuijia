import { config } from "dotenv";
config({ path: ".env" });

// Dynamic import to ensure dotenv runs before module-level constants are evaluated
import("../src/lib/crawler").then(({ crawlFromApi }) => {
  return crawlFromApi({
    maxRequests: 50,
    delayMs: 1500,
    consecutiveSkipLimit: 50,
  });
}).then((stats) => {
  console.log(JSON.stringify(stats));
  process.exit(0);
}).catch((err) => {
  console.error("Fatal:", JSON.stringify({ error: err.message }));
  process.exit(1);
});
