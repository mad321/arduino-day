# API Documentation 📚

دليل شامل لـ API والمكتبات المتاحة في Haraj Profit Opportunity Scraper.

## جدول المحتويات

1. [HarajDatabase](#harajdatabase)
2. [HarajScraper](#harajscraper)
3. [ProfitAnalyzer](#profitanalyzer)
4. [Types & Schemas](#types--schemas)
5. [Configuration](#configuration)

---

## HarajDatabase

فئة إدارة قاعدة البيانات SQLite.

### الإنشاء

```typescript
import { HarajDatabase } from './database.js';

const db = new HarajDatabase('./haraj_listings.db');
```

### الوظائف

#### `insertOrUpdateListing(listing: HarajListing): void`

إدراج أو تحديث إعلان.

```typescript
const listing: HarajListing = {
  id: 'haraj-12345',
  title: 'iPhone 11 64GB',
  price: 450,
  category: 'mobiles',
  description: 'كحال الجديد',
  location: 'الرياض',
  seller: 'محمد علي',
  url: 'https://haraj.com.sa/12345',
  imageUrl: 'https://...',
  postedAt: new Date(),
  lastChecked: new Date(),
};

db.insertOrUpdateListing(listing);
```

#### `getListingsByCategory(category: string, minPrice: number, maxPrice: number, limit: number = 100): HarajListing[]`

الحصول على إعلانات بحسب الفئة والسعر.

```typescript
// الحصول على إلكترونيات بين 100-1000 ريال
const listings = db.getListingsByCategory('electronics', 100, 1000, 50);

listings.forEach(listing => {
  console.log(`${listing.title} - ${listing.price}ر.س`);
});
```

#### `insertOpportunity(opportunity: ProfitOpportunity): void`

إدراج فرصة ربح جديدة.

```typescript
const opportunity: ProfitOpportunity = {
  listingId: 'haraj-12345',
  title: 'iPhone 11 64GB',
  buyPrice: 450,
  estimatedSellPrice: 480,
  potentialProfit: 30,
  profitMargin: 6.67,
  category: 'mobiles',
  reason: 'Slightly underpriced',
  confidenceScore: 75,
  url: 'https://haraj.com.sa/12345',
  foundAt: new Date(),
  status: 'new',
};

db.insertOpportunity(opportunity);
```

#### `getNewOpportunities(limit: number = 50): ProfitOpportunity[]`

الحصول على الفرص الجديدة.

```typescript
const opportunities = db.getNewOpportunities(20);

opportunities.forEach(opp => {
  console.log(`${opp.title}`);
  console.log(`  Profit: ${opp.potentialProfit}ر.س (${opp.profitMargin}%)`);
  console.log(`  Confidence: ${opp.confidenceScore}%`);
});
```

#### `updateOpportunityStatus(listingId: string, status: string): void`

تحديث حالة الفرصة.

```typescript
// العلامات المتاحة: 'new', 'notified', 'purchased', 'sold', 'expired'
db.updateOpportunityStatus('haraj-12345', 'notified');
```

#### `getPriceStats(category: string, days: number = 7): Record<string, number>`

الحصول على إحصائيات الأسعار.

```typescript
const stats = db.getPriceStats('electronics', 30); // آخر 30 يوم

console.log(`متوسط: ${stats.avgPrice}`);
console.log(`أدنى: ${stats.minPrice}`);
console.log(`أعلى: ${stats.maxPrice}`);
console.log(`عدد العينات: ${stats.sampleSize}`);
```

#### `recordPriceHistory(listingId: string, category: string, price: number): void`

حفظ سجل سعري.

```typescript
db.recordPriceHistory('haraj-12345', 'mobiles', 450);
```

#### `cleanupOldListings(days: number = 30): number`

حذف الإعلانات القديمة.

```typescript
const deleted = db.cleanupOldListings(30);
console.log(`تم حذف ${deleted} إعلان قديم`);
```

#### `getStats(): Record<string, number>`

الحصول على إحصائيات قاعدة البيانات.

```typescript
const stats = db.getStats();

console.log(`إجمالي الإعلانات: ${stats.totalListings}`);
console.log(`الفرص الجديدة: ${stats.newOpportunities}`);
console.log(`سجلات الأسعار: ${stats.priceRecords}`);
```

#### `close(): void`

إغلاق الاتصال بقاعدة البيانات.

```typescript
db.close();
```

---

## HarajScraper

فئة الاصطياد الذكي لحراج.

### الإنشاء

```typescript
import { HarajScraper } from './scraper.js';
import { HarajDatabase } from './database.js';

const db = new HarajDatabase('./haraj_listings.db');
const scraper = new HarajScraper(db);
```

### الوظائف

#### `async scrapeCategory(category: string, page: number = 1): Promise<HarajListing[]>`

اصطياد فئة محددة من صفحة معينة.

```typescript
// اصطياد الإلكترونيات من الصفحة الأولى
const listings = await scraper.scrapeCategory('electronics', 1);

console.log(`تم اصطياد ${listings.length} إعلان`);
```

#### `async scrapeMultipleCategories(categories: string[], pagesPerCategory: number = 3): Promise<ScrapedData>`

اصطياد عدة فئات مع عدة صفحات.

```typescript
const scrapedData = await scraper.scrapeMultipleCategories(
  ['electronics', 'furniture', 'mobiles'],
  2 // صفحتين لكل فئة
);

console.log(`تم اصطياد ${scrapedData.listings.length} إعلان`);
console.log(`الوقت: ${scrapedData.timestamp}`);
```

---

## ProfitAnalyzer

فئة تحليل فرص الربح.

### الإنشاء

```typescript
import { ProfitAnalyzer } from './analyzer.js';

const analyzer = new ProfitAnalyzer(db);
```

### الوظائف

#### `async analyzeAllListings(): Promise<ProfitOpportunity[]>`

تحليل جميع الإعلانات الموجودة.

```typescript
const opportunities = await analyzer.analyzeAllListings();

console.log(`وجدت ${opportunities.length} فرصة ربح`);
```

#### `getTopOpportunitiesByMargin(limit: number = 10): ProfitOpportunity[]`

أفضل الفرص حسب نسبة الربح.

```typescript
const top = analyzer.getTopOpportunitiesByMargin(5);

top.forEach((opp, index) => {
  console.log(`${index + 1}. ${opp.title} - ${opp.profitMargin}% ربح`);
});
```

#### `getTopOpportunitiesByProfit(limit: number = 10): ProfitOpportunity[]`

أفضل الفرص حسب الربح المطلق.

```typescript
const top = analyzer.getTopOpportunitiesByProfit(5);

top.forEach((opp) => {
  console.log(`${opp.title} - ربح ${opp.potentialProfit}ر.س`);
});
```

#### `getOpportunitiesByCategory(category: string, limit: number = 10): ProfitOpportunity[]`

فرص من فئة محددة.

```typescript
const chances = analyzer.getOpportunitiesByCategory('electronics', 10);

console.log(`فرص الإلكترونيات: ${chances.length}`);
```

#### `getHighConfidenceOpportunities(limit: number = 10): ProfitOpportunity[]`

الفرص الموثوقة جداً (80%+ ثقة).

```typescript
const reliable = analyzer.getHighConfidenceOpportunities(10);

reliable.forEach((opp) => {
  console.log(`${opp.title} - ثقة ${opp.confidenceScore}%`);
});
```

#### `generateReport(): string`

توليد تقرير شامل.

```typescript
const report = analyzer.generateReport();
console.log(report);

// أو حفظ في ملف
import fs from 'fs';
fs.writeFileSync('report.txt', report);
```

---

## Types & Schemas

### HarajListing

```typescript
interface HarajListing {
  id: string;                    // معرّف فريد
  title: string;                 // عنوان الإعلان
  price: number;                 // السعر بالريال
  category: string;              // فئة المنتج
  description?: string;          // الوصف
  location?: string;             // الموقع
  seller?: string;               // اسم البائع
  url: string;                   // رابط الإعلان
  imageUrl?: string;             // رابط الصورة
  postedAt: Date;                // تاريخ النشر
  lastChecked: Date;             // آخر تحقق
}
```

### ProfitOpportunity

```typescript
interface ProfitOpportunity {
  listingId: string;             // معرّف الإعلان
  title: string;                 // عنوان الفرصة
  buyPrice: number;              // سعر الشراء
  estimatedSellPrice: number;    // السعر المتوقع للبيع
  potentialProfit: number;       // الربح المحتمل
  profitMargin: number;          // نسبة الربح (%)
  category: string;              // الفئة
  reason: string;                // سبب الفرصة
  confidenceScore: number;       // درجة الثقة (0-100)
  url: string;                   // رابط الإعلان
  foundAt: Date;                 // وقت الاكتشاف
  status: 'new' | 'notified' | 'purchased' | 'sold' | 'expired';
}
```

### ScrapedData

```typescript
interface ScrapedData {
  listings: HarajListing[];      // الإعلانات المصطادة
  timestamp: Date;               // وقت الاصطياد
  pageUrl: string;               // عنوان الصفحة
}
```

---

## Configuration

### الملف: `src/config.ts`

```typescript
interface ScraperConfig {
  firecrawlApiKey: string;       // مفتاح Firecrawl API
  profitThreshold: number;       // الحد الأدنى لنسبة الربح (%)
  minPrice: number;              // السعر الأدنى بالريال
  maxPrice: number;              // السعر الأعلى بالريال
  monitoredCategories: string[]; // الفئات المراد مراقبتها
  scrapeInterval: number;        // الفترة الزمنية بالميلي ثانية
  logLevel: string;              // مستوى التسجيل
  dbPath: string;                // مسار قاعدة البيانات
}
```

### الإعدادات من `.env`

```bash
# Required
FIRECRAWL_API_KEY=your_key_here

# Optional with defaults
NODE_ENV=development
LOG_LEVEL=info
PROFIT_THRESHOLD=20
MIN_PRICE=50
MAX_PRICE=5000
SCRAPE_INTERVAL=3600000
MONITORED_CATEGORIES=electronics,furniture,cars,clothes,books
DB_PATH=./haraj_listings.db
```

---

## أمثلة متقدمة

### مثال 1: حلقة اصطياد كاملة

```typescript
import { HarajDatabase } from './database.js';
import { HarajScraper } from './scraper.js';
import { ProfitAnalyzer } from './analyzer.js';

async function fullScrapeAndAnalyze() {
  const db = new HarajDatabase('./haraj.db');
  const scraper = new HarajScraper(db);
  const analyzer = new ProfitAnalyzer(db);

  try {
    // اصطياد الإعلانات
    const scrapedData = await scraper.scrapeMultipleCategories(
      ['electronics', 'mobiles'],
      2
    );
    console.log(`Scraped ${scrapedData.listings.length} listings`);

    // تحليل الفرص
    const opportunities = await analyzer.analyzeAllListings();
    console.log(`Found ${opportunities.length} opportunities`);

    // عرض أفضل 5 فرص
    const topOpps = analyzer.getTopOpportunitiesByMargin(5);
    topOpps.forEach((opp, i) => {
      console.log(`${i + 1}. ${opp.title} - ${opp.profitMargin}%`);
    });
  } finally {
    db.close();
  }
}

fullScrapeAndAnalyze();
```

### مثال 2: مراقبة فرص محددة

```typescript
async function monitorSpecificCategory() {
  const db = new HarajDatabase('./haraj.db');
  const analyzer = new ProfitAnalyzer(db);

  // الحصول على فرص الهواتف
  const mobileOpps = analyzer.getOpportunitiesByCategory('mobiles', 10);

  // فلترة الفرص الموثوقة
  const reliable = mobileOpps.filter(opp => opp.confidenceScore >= 80);

  // ترتيب حسب الربح
  reliable.sort((a, b) => b.potentialProfit - a.potentialProfit);

  console.log('Top mobile opportunities:');
  reliable.slice(0, 3).forEach(opp => {
    console.log(`- ${opp.title}: ${opp.potentialProfit}ر.س profit`);
    console.log(`  Confidence: ${opp.confidenceScore}%`);
  });

  db.close();
}

monitorSpecificCategory();
```

### مثال 3: تصدير البيانات

```typescript
import fs from 'fs';
import csv from 'csv-stringify/sync';

async function exportOpportunitiesToCSV() {
  const db = new HarajDatabase('./haraj.db');
  const opportunities = db.getNewOpportunities(1000);

  // تحويل إلى CSV
  const csvContent = csv.stringify(opportunities.map(opp => ({
    title: opp.title,
    category: opp.category,
    buyPrice: opp.buyPrice,
    sellPrice: opp.estimatedSellPrice,
    profit: opp.potentialProfit,
    margin: opp.profitMargin,
    confidence: opp.confidenceScore,
    url: opp.url,
  })), {
    header: true,
  });

  fs.writeFileSync('opportunities.csv', csvContent);
  console.log('Exported to opportunities.csv');

  db.close();
}

exportOpportunitiesToCSV();
```

---

## الأخطاء الشائعة

### خطأ 1: "FIRECRAWL_API_KEY is required"

**السبب**: لم يتم تعيين المفتاح في `.env`

**الحل**:
```bash
# تأكد من وجود .env
cp .env.example .env

# أضف المفتاح
echo "FIRECRAWL_API_KEY=your_key" >> .env
```

### خطأ 2: "Cannot find module"

**السبب**: المتعلقات غير مثبتة

**الحل**:
```bash
npm install
npm run build
```

### خطأ 3: Database is locked

**السبب**: عملية أخرى تستخدم قاعدة البيانات

**الحل**:
```bash
# انتظر أو أغلق العملية الأخرى
rm haraj_listings.db-shm
rm haraj_listings.db-wal
```

---

**آخر تحديث**: 2026-09-03  
**الإصدار**: 1.0.0
