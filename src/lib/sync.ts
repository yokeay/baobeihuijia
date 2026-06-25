import { crawlFromApi, type CrawlOptions } from "@/lib/crawler";

export { type CrawlOptions };

/**
 * Wrapper for backwards compatibility - delegates to the full crawler.
 */
export async function syncFromApi(options?: CrawlOptions) {
  return crawlFromApi(options);
}
