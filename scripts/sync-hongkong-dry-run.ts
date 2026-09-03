import { config } from "dotenv";
config({ path: ".env" });

import { syncHongKong } from "../src/lib/sync/hongkong";

syncHongKong({ dryRun: true })
  .then((stats) => {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
