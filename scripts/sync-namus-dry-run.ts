import { config } from "dotenv";
config({ path: ".env" });

import { syncNamus } from "../src/lib/sync/namus";

syncNamus({ dryRun: true })
  .then((stats) => {
    console.log(JSON.stringify(stats));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
