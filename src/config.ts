import dotenv from 'dotenv';
import { z } from 'zod';
import type { ScraperConfig } from './types.js';

dotenv.config();

const ConfigSchema = z.object({
  firecrawlApiKey: z.string().min(1, 'FIRECRAWL_API_KEY is required'),
  nodeEnv: z.enum(['development', 'production']).default('development'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  profitThreshold: z.number().int().positive().default(20),
  minPrice: z.number().positive().default(50),
  maxPrice: z.number().positive().default(5000),
  scrapeInterval: z.number().int().positive().default(3600000), // 1 hour
  monitoredCategories: z.string().transform((val) => val.split(',')).default('electronics,furniture'),
  dbPath: z.string().default('./haraj_listings.db'),
});

function loadConfig(): ScraperConfig {
  const rawConfig = {
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    profitThreshold: process.env.PROFIT_THRESHOLD ? parseInt(process.env.PROFIT_THRESHOLD) : undefined,
    minPrice: process.env.MIN_PRICE ? parseInt(process.env.MIN_PRICE) : undefined,
    maxPrice: process.env.MAX_PRICE ? parseInt(process.env.MAX_PRICE) : undefined,
    scrapeInterval: process.env.SCRAPE_INTERVAL ? parseInt(process.env.SCRAPE_INTERVAL) : undefined,
    monitoredCategories: process.env.MONITORED_CATEGORIES,
    dbPath: process.env.DB_PATH,
  };

  const validated = ConfigSchema.parse(rawConfig);

  return {
    firecrawlApiKey: validated.firecrawlApiKey,
    profitThreshold: validated.profitThreshold,
    minPrice: validated.minPrice,
    maxPrice: validated.maxPrice,
    monitoredCategories: validated.monitoredCategories,
    scrapeInterval: validated.scrapeInterval,
    logLevel: validated.logLevel,
    dbPath: validated.dbPath,
  };
}

export const config = loadConfig();
