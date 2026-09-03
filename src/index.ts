import { logger } from './logger.js';
import { HarajDatabase } from './database.js';
import { HarajScraper } from './scraper.js';
import { ProfitAnalyzer } from './analyzer.js';
import { config } from './config.js';

/**
 * Main application for Haraj profit opportunity scraper
 */
class HarajOpportunityScraper {
  private db: HarajDatabase;
  private scraper: HarajScraper;
  private analyzer: ProfitAnalyzer;
  private running: boolean = false;

  constructor() {
    this.db = new HarajDatabase(config.dbPath);
    this.scraper = new HarajScraper(this.db);
    this.analyzer = new ProfitAnalyzer(this.db);
  }

  /**
   * Run a single scraping and analysis cycle
   */
  async runOnce(): Promise<void> {
    try {
      logger.info('Starting scraping cycle...');

      // Step 1: Scrape listings
      logger.info('Scraping Haraj listings...');
      const scrapedData = await this.scraper.scrapeMultipleCategories(
        config.monitoredCategories,
        2 // 2 pages per category
      );

      logger.info(`Scraped ${scrapedData.listings.length} listings`);

      // Step 2: Analyze for profit opportunities
      logger.info('Analyzing listings for profit opportunities...');
      const opportunities = await this.analyzer.analyzeAllListings();

      logger.info(`Found ${opportunities.length} profit opportunities`);

      // Step 3: Generate and display report
      const report = this.analyzer.generateReport();
      logger.info('\n' + report);

      // Step 4: Cleanup old data
      const deleted = this.db.cleanupOldListings(30);
      logger.info(`Cleaned up ${deleted} old listings`);

      // Step 5: Get statistics
      const stats = this.db.getStats();
      logger.info(`Database stats: ${JSON.stringify(stats)}`);
    } catch (error) {
      logger.error('Error in scraping cycle:', error);
      throw error;
    }
  }

  /**
   * Start continuous scraping with interval
   */
  async startContinuous(): Promise<void> {
    if (this.running) {
      logger.warn('Scraper is already running');
      return;
    }

    this.running = true;
    logger.info(`Starting continuous scraping with interval ${config.scrapeInterval}ms`);

    try {
      // Run immediately on start
      await this.runOnce();

      // Then run on interval
      const interval = setInterval(async () => {
        try {
          await this.runOnce();
        } catch (error) {
          logger.error('Error in scheduled scraping cycle:', error);
        }
      }, config.scrapeInterval);

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        logger.info('Shutting down gracefully...');
        clearInterval(interval);
        this.stop();
      });

      process.on('SIGTERM', () => {
        logger.info('Shutting down gracefully (SIGTERM)...');
        clearInterval(interval);
        this.stop();
      });
    } catch (error) {
      this.running = false;
      throw error;
    }
  }

  /**
   * Stop scraping
   */
  stop(): void {
    this.running = false;
    this.db.close();
    logger.info('Scraper stopped');
    process.exit(0);
  }

  /**
   * Get a specific opportunity by category
   */
  getOpportunitiesByCategory(category: string, limit: number = 10) {
    return this.analyzer.getOpportunitiesByCategory(category, limit);
  }

  /**
   * Get top opportunities
   */
  getTopOpportunities(limit: number = 10) {
    return this.analyzer.getTopOpportunitiesByMargin(limit);
  }

  /**
   * Generate full report
   */
  generateReport(): string {
    return this.analyzer.generateReport();
  }
}

/**
 * Main entry point
 */
async function main() {
  logger.info('Haraj Profit Opportunity Scraper starting...');

  const scraper = new HarajOpportunityScraper();

  // Check if command line argument is provided
  const command = process.argv[2] || 'continuous';

  if (command === 'once') {
    // Run once and exit
    logger.info('Running single scraping cycle...');
    await scraper.runOnce();
    scraper.stop();
  } else if (command === 'report') {
    // Generate report from existing data
    const report = scraper.generateReport();
    console.log(report);
    scraper.stop();
  } else {
    // Run continuously (default)
    await scraper.startContinuous();
  }
}

// Run main
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
