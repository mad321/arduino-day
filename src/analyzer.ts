import { logger } from './logger.js';
import { HarajDatabase } from './database.js';
import { config } from './config.js';
import type { ProfitOpportunity } from './types.js';

/**
 * Market data for estimating resale values
 * These are rough estimates - in production, this would come from market analysis
 */
const MARKET_MULTIPLIERS: Record<string, { multiplier: number; confidence: number }> = {
  // Electronics: generally 60-70% resale value
  electronics: { multiplier: 0.65, confidence: 70 },
  // Furniture: 40-50% resale value
  furniture: { multiplier: 0.45, confidence: 60 },
  // Mobiles: 50-70% resale value
  mobiles: { multiplier: 0.60, confidence: 75 },
  // Books: 30-40% resale value
  books: { multiplier: 0.35, confidence: 50 },
  // Clothes: 30-50% resale value
  clothes: { multiplier: 0.40, confidence: 55 },
  // Sports: 50-60% resale value
  sports: { multiplier: 0.55, confidence: 65 },
  // Appliances: 50-70% resale value
  appliances: { multiplier: 0.60, confidence: 68 },
  // Cars: Highly variable, but used cars retain 50-70% value
  cars: { multiplier: 0.60, confidence: 45 },
};

/**
 * Price threshold patterns for different categories
 * Items below a certain price are often undervalued
 */
const PRICE_ANOMALY_THRESHOLDS: Record<string, number> = {
  electronics: 200,
  furniture: 100,
  mobiles: 300,
  books: 30,
  clothes: 50,
  sports: 75,
  appliances: 150,
  cars: 3000,
};

export class ProfitAnalyzer {
  private db: HarajDatabase;

  constructor(db: HarajDatabase) {
    this.db = db;
  }

  /**
   * Analyze all listings in database and find profit opportunities
   */
  async analyzeAllListings(): Promise<ProfitOpportunity[]> {
    const opportunities: ProfitOpportunity[] = [];

    for (const category of config.monitoredCategories) {
      logger.info(`Analyzing category: ${category}`);

      const categoryOpportunities = await this.analyzeCategory(category);
      opportunities.push(...categoryOpportunities);

      // Save opportunities to database
      for (const opp of categoryOpportunities) {
        this.db.insertOpportunity(opp);
      }
    }

    logger.info(`Found ${opportunities.length} profit opportunities`);
    return opportunities;
  }

  /**
   * Analyze listings in a specific category
   */
  private async analyzeCategory(category: string): Promise<ProfitOpportunity[]> {
    const opportunities: ProfitOpportunity[] = [];
    const listings = this.db.getListingsByCategory(
      category,
      config.minPrice,
      config.maxPrice,
      500
    );

    const priceStats = this.db.getPriceStats(category, 30);
    const multiplier = MARKET_MULTIPLIERS[category] || { multiplier: 0.5, confidence: 50 };

    logger.info(
      `Analyzing ${listings.length} listings in ${category}. ` +
        `Price stats - avg: ${priceStats.avgPrice}, min: ${priceStats.minPrice}, max: ${priceStats.maxPrice}`
    );

    for (const listing of listings) {
      const opportunity = this.evaluateListing(listing, priceStats, multiplier, category);

      if (opportunity && opportunity.profitMargin >= config.profitThreshold) {
        opportunities.push(opportunity);
      }
    }

    return opportunities;
  }

  /**
   * Evaluate a single listing for profit potential
   */
  private evaluateListing(
    listing: any,
    priceStats: Record<string, number>,
    marketData: { multiplier: number; confidence: number },
    category: string
  ): ProfitOpportunity | null {
    const buyPrice = listing.price;
    const averagePrice = priceStats.avgPrice || buyPrice * 1.2;

    // Estimate resale value based on market multiplier
    const estimatedSellPrice = averagePrice * marketData.multiplier;
    const potentialProfit = estimatedSellPrice - buyPrice;
    const profitMargin = (potentialProfit / buyPrice) * 100;

    // Only return positive profit opportunities
    if (potentialProfit <= 0) {
      return null;
    }

    // Calculate confidence score based on multiple factors
    let confidenceScore = marketData.confidence;
    let reason = '';

    // Factor 1: Price anomaly detection
    const threshold = PRICE_ANOMALY_THRESHOLDS[category] || 100;
    if (buyPrice < threshold && buyPrice < averagePrice * 0.6) {
      confidenceScore += 15;
      reason += 'Significantly underpriced. ';
    }

    // Factor 2: Sample size (more data = higher confidence)
    if (priceStats.sampleSize > 50) {
      confidenceScore += 10;
    } else if (priceStats.sampleSize < 10) {
      confidenceScore -= 10;
      reason += 'Limited price data. ';
    }

    // Factor 3: Price variance detection
    const priceRange = priceStats.maxPrice - priceStats.minPrice;
    const variance = priceRange / averagePrice;

    if (variance < 0.5) {
      confidenceScore += 5; // Stable prices = more predictable
      reason += 'Stable market prices. ';
    } else if (variance > 2) {
      confidenceScore -= 10;
      reason += 'Highly volatile market. ';
    }

    // Factor 4: Profit margin analysis
    if (profitMargin > 50) {
      confidenceScore += 10;
      reason += 'High profit margin. ';
    }

    // Factor 5: Description quality
    if (listing.description && listing.description.length > 100) {
      confidenceScore += 5;
    }

    // Clamp confidence score between 0-100
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));

    return {
      listingId: listing.id,
      title: listing.title,
      buyPrice,
      estimatedSellPrice: Math.round(estimatedSellPrice * 100) / 100,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      category,
      reason: reason || 'Good value for category.',
      confidenceScore: Math.round(confidenceScore),
      url: listing.url,
      foundAt: new Date(),
      status: 'new',
    };
  }

  /**
   * Get top opportunities by profit margin
   */
  getTopOpportunitiesByMargin(limit: number = 10): ProfitOpportunity[] {
    const opportunities = this.db.getNewOpportunities(limit * 2);
    return opportunities
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, limit);
  }

  /**
   * Get top opportunities by absolute profit
   */
  getTopOpportunitiesByProfit(limit: number = 10): ProfitOpportunity[] {
    const opportunities = this.db.getNewOpportunities(limit * 2);
    return opportunities
      .sort((a, b) => b.potentialProfit - a.potentialProfit)
      .slice(0, limit);
  }

  /**
   * Get opportunities by category
   */
  getOpportunitiesByCategory(category: string, limit: number = 10): ProfitOpportunity[] {
    const opportunities = this.db.getNewOpportunities(limit * 3);
    return opportunities
      .filter((opp) => opp.category === category)
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, limit);
  }

  /**
   * Get high-confidence opportunities (80+)
   */
  getHighConfidenceOpportunities(limit: number = 10): ProfitOpportunity[] {
    const opportunities = this.db.getNewOpportunities(limit * 3);
    return opportunities
      .filter((opp) => opp.confidenceScore >= 80)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, limit);
  }

  /**
   * Generate a report of opportunities
   */
  generateReport(): string {
    const stats = this.db.getStats();
    const topByMargin = this.getTopOpportunitiesByMargin(5);
    const topByProfit = this.getTopOpportunitiesByProfit(5);
    const highConfidence = this.getHighConfidenceOpportunities(5);

    let report = '='.repeat(80) + '\n';
    report += 'HARAJ PROFIT OPPORTUNITIES REPORT\n';
    report += '='.repeat(80) + '\n\n';

    report += 'DATABASE STATISTICS:\n';
    report += `-${'-'.repeat(78)}\n`;
    report += `Total Listings: ${stats.totalListings}\n`;
    report += `New Opportunities: ${stats.newOpportunities}\n`;
    report += `Price Records: ${stats.priceRecords}\n\n`;

    report += 'TOP 5 OPPORTUNITIES BY PROFIT MARGIN:\n';
    report += `-${'-'.repeat(78)}\n`;
    for (const opp of topByMargin) {
      report += `${opp.title} (${opp.category})\n`;
      report += `  Buy: ${opp.buyPrice}ر.س | Sell: ${opp.estimatedSellPrice}ر.س\n`;
      report += `  Profit: ${opp.potentialProfit}ر.س (${opp.profitMargin}%)\n`;
      report += `  Confidence: ${opp.confidenceScore}% | ${opp.reason}\n`;
      report += `  URL: ${opp.url}\n\n`;
    }

    report += 'TOP 5 OPPORTUNITIES BY ABSOLUTE PROFIT:\n';
    report += `-${'-'.repeat(78)}\n`;
    for (const opp of topByProfit) {
      report += `${opp.title} (${opp.category})\n`;
      report += `  Buy: ${opp.buyPrice}ر.س | Sell: ${opp.estimatedSellPrice}ر.س\n`;
      report += `  Profit: ${opp.potentialProfit}ر.س (${opp.profitMargin}%)\n`;
      report += `  Confidence: ${opp.confidenceScore}%\n`;
      report += `  URL: ${opp.url}\n\n`;
    }

    report += 'HIGH CONFIDENCE OPPORTUNITIES (80%+):\n';
    report += `-${'-'.repeat(78)}\n`;
    for (const opp of highConfidence) {
      report += `${opp.title} (${opp.category})\n`;
      report += `  Buy: ${opp.buyPrice}ر.س | Sell: ${opp.estimatedSellPrice}ر.س\n`;
      report += `  Confidence: ${opp.confidenceScore}% | Margin: ${opp.profitMargin}%\n\n`;
    }

    report += '='.repeat(80) + '\n';

    return report;
  }
}
