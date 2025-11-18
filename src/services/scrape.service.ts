import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

import { KnowledgeCategory } from "../types";
import { createTextSplitter } from "../utils/textSplitter";
import { generateEmbeddings } from "./embedding.service";
import { ScrapedSource } from "../database/models/scrape";
import { compareHashes, generateHash } from "../utils/hash";
import { Chunk } from "../database/models/chunk";

const SCRAPER_URL =
  process.env.SCRAPER_URL ||
  "https://lightsalmon-armadillo-700273.hostingersite.com/about-us/";

interface ScrapedPageData {
  url: string;
  title: string;
  content: string;
  links: string[];
}

async function scrapeSinglePage(
  url: string,
  retries: number = 3
): Promise<ScrapedPageData> {
  console.log(`🕷️  Scraping: ${url}`);

  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 30000, // Increased timeout to 30 seconds
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RAG-Bot/1.0)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept any status < 500
      });

      if (response.status >= 400) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText || "Request failed"}`
        );
      }

      const $ = cheerio.load(response.data);

      $("script, style, nav, footer, header, img").remove();
      $('a[href^="#"]').remove();

      const title = $("title").text().trim() || "No title";

      const mainContent = $("body").text();
      const cleanedText = mainContent
        .replace(/\s+/g, " ")
        .replace(/\n+/g, "\n")
        .trim();

      const links: string[] = [];
      $("a[href]").each((_, element) => {
        const href = $(element).attr("href");
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            links.push(absoluteUrl);
          } catch {}
        }
      });

      console.log(`✅ Successfully scraped: ${url}`);

      return {
        url: response.request?.res?.responseUrl || url,
        title,
        content: cleanedText,
        links,
      };
    } catch (error: any) {
      lastError = error;
      console.warn(
        `⚠️  Attempt ${attempt}/${retries} failed for ${url}: ${error.message}`
      );

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        const waitTime = 2000 * attempt;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to scrape ${url} after ${retries} attempts: ${lastError.message}`
  );
}

/**
 * Check if URL is from same domain
 */
function isSameDomain(baseUrl: string, targetUrl: string): boolean {
  try {
    const baseHost = new URL(baseUrl).hostname;
    const targetHost = new URL(targetUrl).hostname;
    return baseHost === targetHost;
  } catch {
    return false;
  }
}

/**
 * Process and store scraped content
 */
async function processAndStoreContent(
  content: string,
  sourceUrl: string,
  category: KnowledgeCategory = KnowledgeCategory.Others
): Promise<void> {
  // Generate content hash
  const contentHash = generateHash(content);

  // Check if content has changed
  const existingSource = await ScrapedSource.findOne({ url: sourceUrl });

  if (
    existingSource &&
    compareHashes(existingSource.content_hash, contentHash)
  ) {
    console.log("✅ Content unchanged. Skipping processing.");
    return;
  }

  console.log("🔄 Content changed or new. Processing...");

  // Delete old chunks for this URL
  if (existingSource) {
    await Chunk.deleteMany({
      "metadata.category": category,
      "metadata.url": sourceUrl,
    });
    console.log("✅ Deleted old chunks");
  }

  // Split text into chunks
  const textSplitter = createTextSplitter();
  const chunks = textSplitter.splitText(content);
  console.log(`✅ Split into ${chunks.length} chunks`);

  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks);
  console.log(`✅ Generated embeddings`);

  // Create file_id for this scraped content
  const fileId = `file_others_${Math.random().toString(36).substring(2, 15)}`;

  // Store chunks in database
  const chunkDocuments = chunks.map((chunkText, index) => ({
    text: chunkText,
    embedding: embeddings[index],
    metadata: {
      file_id: fileId,
      category: category,
      chunk_index: index,
      source: "web",
      url: sourceUrl,
    },
  }));

  await Chunk.insertMany(chunkDocuments);
  console.log(`✅ Stored ${chunks.length} chunks`);

  // Update or create scraped source record
  await ScrapedSource.findOneAndUpdate(
    { url: sourceUrl },
    {
      url: sourceUrl,
      category: category,
      content_hash: contentHash,
      last_scraped: new Date(),
      chunk_count: chunks.length,
      status: "active",
    },
    { upsert: true, new: true }
  );
}

/**
 * Main scraping function with redirect following
 */
export const scrapeOthersContent = async (
  followLinks: boolean = true,
  maxLinksToFollow: number = 10
): Promise<void> => {
  const visitedUrls = new Set<string>();

  try {
    console.log(`🕷️  Starting scraper for: ${SCRAPER_URL}`);

    // Scrape main page
    const mainPage = await scrapeSinglePage(SCRAPER_URL);

    if (!mainPage.content || mainPage.content.length < 100) {
      throw new Error("Insufficient content extracted from webpage");
    }

    console.log(
      `✅ Main page: Extracted ${mainPage.content.length} characters`
    );
    console.log(`✅ Found ${mainPage.links.length} links`);

    visitedUrls.add(mainPage.url);

    // Combine all content
    let allContent = `=== ${mainPage.title} ===\n${mainPage.content}\n\n`;

    // Process and store main page content
    await processAndStoreContent(mainPage.content, SCRAPER_URL);

    // Follow links if enabled
    if (followLinks) {
      // Filter links to same domain only
      const sameDomainLinks = mainPage.links.filter(
        (link) =>
          isSameDomain(SCRAPER_URL, link) &&
          !visitedUrls.has(link) &&
          link.startsWith("http")
      );

      const linksToScrape = sameDomainLinks.slice(0, maxLinksToFollow);

      console.log(`📄 Following ${linksToScrape.length} links...`);

      for (const link of linksToScrape) {
        try {
          // Add delay to avoid overwhelming server
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const linkedPage = await scrapeSinglePage(link);

          if (linkedPage.content && linkedPage.content.length >= 100) {
            visitedUrls.add(linkedPage.url);

            console.log(
              `✅ Linked page: ${linkedPage.title} (${linkedPage.content.length} chars)`
            );

            // Add to combined content
            allContent += `=== ${linkedPage.title} ===\n${linkedPage.content}\n\n`;

            // Process and store linked page content
            await processAndStoreContent(linkedPage.content, link);
          }
        } catch (error: any) {
          console.error(`⚠️  Error scraping ${link}:`, error.message);
        }
      }
    }

    console.log("✅ Scraping completed successfully");
    console.log(`📊 Total pages scraped: ${visitedUrls.size}`);
  } catch (error: any) {
    console.error("❌ Scraping error:", error);

    // Provide helpful error messages based on error type
    let errorMessage = error.message;

    if (error.code === "EAI_AGAIN" || error.code === "ENOTFOUND") {
      errorMessage = `DNS resolution failed for ${SCRAPER_URL}. Please check:
        1. Your internet connection
        2. The URL is correct and accessible
        3. DNS server is working (try: nslookup ${
          new URL(SCRAPER_URL).hostname
        })
        4. Try using a different DNS (like 8.8.8.8)`;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = `Connection refused. The server at ${SCRAPER_URL} is not responding.`;
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = `Request timed out. The server took too long to respond.`;
    }

    console.error(`💡 Error details: ${errorMessage}`);

    // Update source status as failed
    await ScrapedSource.findOneAndUpdate(
      { url: SCRAPER_URL },
      {
        status: "failed",
        error_message: errorMessage,
        last_scraped: new Date(),
      },
      { upsert: true }
    );

    throw error;
  }
};

/**
 * Get scraping status
 */
export const getScrapingStatus = async () => {
  const source = await ScrapedSource.findOne({ url: SCRAPER_URL });

  return {
    url: SCRAPER_URL,
    status: source?.status || "not_scraped",
    last_scraped: source?.last_scraped,
    chunk_count: source?.chunk_count || 0,
    error_message: source?.error_message,
  };
};
