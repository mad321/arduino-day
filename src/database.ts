import Database from 'better-sqlite3';
import path from 'path';
import { logger } from './logger.js';
import type { HarajListing, ProfitOpportunity } from './types.js';

export class HarajDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
    logger.info(`Database initialized at ${dbPath}`);
  }

  private initializeTables(): void {
    // Listings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        location TEXT,
        seller TEXT,
        url TEXT UNIQUE NOT NULL,
        imageUrl TEXT,
        postedAt DATETIME NOT NULL,
        lastChecked DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
      CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
      CREATE INDEX IF NOT EXISTS idx_listings_lastChecked ON listings(lastChecked);
    `);

    // Opportunities table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        listingId TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        buyPrice REAL NOT NULL,
        estimatedSellPrice REAL NOT NULL,
        potentialProfit REAL NOT NULL,
        profitMargin REAL NOT NULL,
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        confidenceScore INTEGER NOT NULL,
        url TEXT NOT NULL,
        foundAt DATETIME NOT NULL,
        status TEXT CHECK(status IN ('new', 'notified', 'purchased', 'sold', 'expired')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listingId) REFERENCES listings(id)
      );

      CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
      CREATE INDEX IF NOT EXISTS idx_opportunities_confidence ON opportunities(confidenceScore);
      CREATE INDEX IF NOT EXISTS idx_opportunities_foundAt ON opportunities(foundAt);
    `);

    // Price history for trend analysis
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listingId TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        recordedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listingId) REFERENCES listings(id)
      );

      CREATE INDEX IF NOT EXISTS idx_price_history_category ON price_history(category);
      CREATE INDEX IF NOT EXISTS idx_price_history_recordedAt ON price_history(recordedAt);
    `);
  }

  /**
   * Insert or update a listing
   */
  insertOrUpdateListing(listing: HarajListing): void {
    const stmt = this.db.prepare(`
      INSERT INTO listings (
        id, title, price, category, description, location, seller, url, imageUrl, postedAt, lastChecked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        lastChecked = excluded.lastChecked,
        price = excluded.price
    `);

    stmt.run(
      listing.id,
      listing.title,
      listing.price,
      listing.category,
      listing.description || null,
      listing.location || null,
      listing.seller || null,
      listing.url,
      listing.imageUrl || null,
      listing.postedAt.toISOString(),
      listing.lastChecked.toISOString()
    );
  }

  /**
   * Get listings by category with price range
   */
  getListingsByCategory(
    category: string,
    minPrice: number,
    maxPrice: number,
    limit: number = 100
  ): HarajListing[] {
    const stmt = this.db.prepare(`
      SELECT * FROM listings
      WHERE category = ? AND price >= ? AND price <= ?
      ORDER BY postedAt DESC
      LIMIT ?
    `);

    const rows = stmt.all(category, minPrice, maxPrice, limit) as any[];
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      category: row.category,
      description: row.description,
      location: row.location,
      seller: row.seller,
      url: row.url,
      imageUrl: row.imageUrl,
      postedAt: new Date(row.postedAt),
      lastChecked: new Date(row.lastChecked),
    }));
  }

  /**
   * Insert a profit opportunity
   */
  insertOpportunity(opportunity: ProfitOpportunity): void {
    const stmt = this.db.prepare(`
      INSERT INTO opportunities (
        id, listingId, title, buyPrice, estimatedSellPrice, potentialProfit,
        profitMargin, category, reason, confidenceScore, url, foundAt, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(listingId) DO UPDATE SET
        estimatedSellPrice = excluded.estimatedSellPrice,
        potentialProfit = excluded.potentialProfit,
        profitMargin = excluded.profitMargin,
        confidenceScore = excluded.confidenceScore,
        updatedAt = CURRENT_TIMESTAMP
    `);

    stmt.run(
      opportunity.listingId,
      opportunity.listingId,
      opportunity.title,
      opportunity.buyPrice,
      opportunity.estimatedSellPrice,
      opportunity.potentialProfit,
      opportunity.profitMargin,
      opportunity.category,
      opportunity.reason,
      opportunity.confidenceScore,
      opportunity.url,
      opportunity.foundAt.toISOString(),
      opportunity.status
    );
  }

  /**
   * Get all new opportunities
   */
  getNewOpportunities(limit: number = 50): ProfitOpportunity[] {
    const stmt = this.db.prepare(`
      SELECT * FROM opportunities
      WHERE status = 'new'
      ORDER BY profitMargin DESC, confidenceScore DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map((row) => ({
      listingId: row.listingId,
      title: row.title,
      buyPrice: row.buyPrice,
      estimatedSellPrice: row.estimatedSellPrice,
      potentialProfit: row.potentialProfit,
      profitMargin: row.profitMargin,
      category: row.category,
      reason: row.reason,
      confidenceScore: row.confidenceScore,
      url: row.url,
      foundAt: new Date(row.foundAt),
      status: row.status,
    }));
  }

  /**
   * Update opportunity status
   */
  updateOpportunityStatus(listingId: string, status: string): void {
    const stmt = this.db.prepare(`
      UPDATE opportunities
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE listingId = ?
    `);

    stmt.run(status, listingId);
  }

  /**
   * Get price statistics for a category
   */
  getPriceStats(category: string, days: number = 7): Record<string, number> {
    const stmt = this.db.prepare(`
      SELECT
        AVG(price) as avgPrice,
        MIN(price) as minPrice,
        MAX(price) as maxPrice,
        COUNT(*) as sampleSize
      FROM listings
      WHERE category = ? AND postedAt > datetime('now', '-' || ? || ' days')
    `);

    const row = stmt.get(category, days) as any;
    return {
      avgPrice: row?.avgPrice || 0,
      minPrice: row?.minPrice || 0,
      maxPrice: row?.maxPrice || 0,
      sampleSize: row?.sampleSize || 0,
    };
  }

  /**
   * Record price for historical analysis
   */
  recordPriceHistory(listingId: string, category: string, price: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO price_history (listingId, category, price)
      VALUES (?, ?, ?)
    `);

    stmt.run(listingId, category, price);
  }

  /**
   * Clean up old listings (older than 30 days)
   */
  cleanupOldListings(days: number = 30): number {
    const stmt = this.db.prepare(`
      DELETE FROM listings
      WHERE postedAt < datetime('now', '-' || ? || ' days')
      AND id NOT IN (SELECT listingId FROM opportunities WHERE status != 'expired')
    `);

    const result = stmt.run(days);
    return result.changes;
  }

  /**
   * Get statistics about the database
   */
  getStats(): Record<string, number> {
    const listings = this.db.prepare('SELECT COUNT(*) as count FROM listings').get() as any;
    const opportunities = this.db.prepare('SELECT COUNT(*) as count FROM opportunities WHERE status = "new"')
      .get() as any;
    const priceHistory = this.db.prepare('SELECT COUNT(*) as count FROM price_history').get() as any;

    return {
      totalListings: listings.count,
      newOpportunities: opportunities.count,
      priceRecords: priceHistory.count,
    };
  }

  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }
}
