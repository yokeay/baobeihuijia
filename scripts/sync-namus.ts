import { config } from "dotenv";
import { join } from "path";

// Load .env before anything else
config({ path: join(process.cwd(), ".env") });

import { syncNamus } from "../src/lib/sync/namus";

syncNamus()
  .then((stats) => {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
