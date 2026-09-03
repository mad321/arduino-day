import FirecrawlApp from '@firecrawl/sdk';
import { logger } from './logger.js';
import { HarajDatabase } from './database.js';
import { config } from './config.js';
import type { HarajListing, ScrapedData } from './types.js';

export class HarajScraper {
  private firecrawl: FirecrawlApp;
  private db: HarajDatabase;

  constructor(db: HarajDatabase) {
    this.firecrawl = new FirecrawlApp({ apiKey: config.firecrawlApiKey });
    this.db = db;
  }

  /**
   * Scrape listings from Haraj for a specific category
   */
  async scrapeCategory(category: string, page: number = 1): Promise<HarajListing[]> {
    try {
      const url = this.buildHarajUrl(category, page);
      logger.info(`Scraping ${category} from ${url}`);

      const result = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        timeout: 30000,
      });

      if (!result.success) {
        logger.error(`Failed to scrape ${category}: ${result.error}`);
        return [];
      }

      return this.parseListingsFromHtml(result.html || '', category, url);
    } catch (error) {
      logger.error(`Error scraping category ${category}:`, error);
      return [];
    }
  }

  /**
   * Build Haraj search URL
   */
  private buildHarajUrl(category: string, page: number = 1): string {
    const baseUrl = 'https://haraj.com.sa';
    const categoryMap: Record<string, string> = {
      electronics: 'for-sale/electronics',
      furniture: 'for-sale/home-and-furniture',
      cars: 'for-sale/cars',
      clothes: 'for-sale/clothes-and-fashion',
      books: 'for-sale/books',
      sports: 'for-sale/sports-and-outdoors',
      mobiles: 'for-sale/mobile-phones',
      appliances: 'for-sale/home-appliances',
    };

    const path = categoryMap[category] || `for-sale/${category}`;
    return `${baseUrl}/${path}?page=${page}`;
  }

  /**
   * Parse listings from HTML content
   */
  private parseListingsFromHtml(html: string, category: string, pageUrl: string): HarajListing[] {
    const listings: HarajListing[] = [];

    try {
      // Parse HTML to extract listings
      // Using regex patterns to find listing elements
      const listingPattern = /<div[^>]*class="[^"]*listing[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      const matches = html.matchAll(listingPattern);

      let listingIndex = 0;
      for (const match of matches) {
        if (listingIndex >= 30) break; // Limit to 30 listings per page

        const listingHtml = match[1];
        const listing = this.extractListingData(listingHtml, category, pageUrl, listingIndex);

        if (listing) {
          listings.push(listing);
          this.db.insertOrUpdateListing(listing);
          this.db.recordPriceHistory(listing.id, category, listing.price);
          listingIndex++;
        }
      }

      logger.info(`Parsed ${listings.length} listings from ${category}`);
    } catch (error) {
      logger.error(`Error parsing HTML for ${category}:`, error);
    }

    return listings;
  }

  /**
   * Extract individual listing data from HTML
   */
  private extractListingData(
    html: string,
    category: string,
    pageUrl: string,
    index: number
  ): HarajListing | null {
    try {
      // Extract title
      const titleMatch = html.match(/<h\d[^>]*>(.*?)<\/h\d>/i);
      const title = titleMatch ? this.cleanText(titleMatch[1]) : `${category}-${index}`;

      // Extract price
      const priceMatch = html.match(/ر\.س\s*([\d,]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      // Skip if price is outside range
      if (price < config.minPrice || price > config.maxPrice) {
        return null;
      }

      // Extract description
      const descMatch = html.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/p>/i);
      const description = descMatch ? this.cleanText(descMatch[1]) : undefined;

      // Extract location
      const locationMatch = html.match(/المدينة[:\s]*([^<,\n]+)/i);
      const location = locationMatch ? this.cleanText(locationMatch[1]) : undefined;

      // Extract seller
      const sellerMatch = html.match(/البائع[:\s]*([^<,\n]+)/i);
      const seller = sellerMatch ? this.cleanText(sellerMatch[1]) : undefined;

      // Extract URL and ID
      const urlMatch = html.match(/href="([^"]*)/);
      const url = urlMatch ? this.resolveUrl(urlMatch[1]) : `${pageUrl}#${index}`;
      const id = this.generateListingId(url);

      // Extract image
      const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*>/);
      const imageUrl = imgMatch ? this.resolveUrl(imgMatch[1]) : undefined;

      return {
        id,
        title,
        price,
        category,
        description,
        location,
        seller,
        url,
        imageUrl,
        postedAt: new Date(),
        lastChecked: new Date(),
      };
    } catch (error) {
      logger.debug(`Error extracting listing data:`, error);
      return null;
    }
  }

  /**
   * Scrape multiple categories and pages
   */
  async scrapeMultipleCategories(
    categories: string[] = config.monitoredCategories,
    pagesPerCategory: number = 3
  ): Promise<ScrapedData> {
    const allListings: HarajListing[] = [];

    for (const category of categories) {
      logger.info(`Starting to scrape category: ${category}`);

      for (let page = 1; page <= pagesPerCategory; page++) {
        const listings = await this.scrapeCategory(category, page);
        allListings.push(...listings);

        // Add delay between requests to be respectful
        await this.delay(2000);
      }
    }

    logger.info(`Total listings scraped: ${allListings.length}`);

    return {
      listings: allListings,
      timestamp: new Date(),
      pageUrl: 'https://haraj.com.sa',
    };
  }

  /**
   * Utility: Clean text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Utility: Resolve relative URLs
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `https://haraj.com.sa${url}`;
    return `https://haraj.com.sa/${url}`;
  }

  /**
   * Utility: Generate listing ID
   */
  private generateListingId(url: string): string {
    const match = url.match(/(\d+)/);
    return match ? `haraj-${match[1]}` : `haraj-${Date.now()}`;
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
