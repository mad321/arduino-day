import { z } from 'zod';

export const HarajListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  category: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  seller: z.string().optional(),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  postedAt: z.date(),
  lastChecked: z.date(),
});

export type HarajListing = z.infer<typeof HarajListingSchema>;

export const ProfitOpportunitySchema = z.object({
  listingId: z.string(),
  title: z.string(),
  buyPrice: z.number(),
  estimatedSellPrice: z.number(),
  potentialProfit: z.number(),
  profitMargin: z.number(),
  category: z.string(),
  reason: z.string(),
  confidenceScore: z.number().min(0).max(100),
  url: z.string().url(),
  foundAt: z.date(),
  status: z.enum(['new', 'notified', 'purchased', 'sold', 'expired']),
});

export type ProfitOpportunity = z.infer<typeof ProfitOpportunitySchema>;

export interface ScraperConfig {
  firecrawlApiKey: string;
  profitThreshold: number;
  minPrice: number;
  maxPrice: number;
  monitoredCategories: string[];
  scrapeInterval: number;
  logLevel: string;
  dbPath: string;
}

export interface ScrapedData {
  listings: HarajListing[];
  timestamp: Date;
  pageUrl: string;
}

export interface PricingData {
  category: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
}
