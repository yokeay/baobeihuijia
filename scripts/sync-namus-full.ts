import { config } from "dotenv";
config({ path: ".env" });

import { syncNamus, NamusSyncStats } from "../src/lib/sync/namus";

syncNamus()
  .then((stats: NamusSyncStats) => {
    console.log(JSON.stringify(stats));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal:", JSON.stringify({ error: err.message }));
    process.exit(1);
  });
