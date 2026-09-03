/**
 * مثال على استخدام Haraj Opportunity Scraper
 * يوضح كيفية استخدام الأداة برمجياً
 */

import { logger } from './logger.js';
import { HarajDatabase } from './database.js';
import { HarajScraper } from './scraper.js';
import { ProfitAnalyzer } from './analyzer.js';
import { config } from './config.js';

async function example() {
  // إنشاء instances من الفئات
  const db = new HarajDatabase(config.dbPath);
  const scraper = new HarajScraper(db);
  const analyzer = new ProfitAnalyzer(db);

  try {
    // مثال 1: اصطياد إعلانات من فئة واحدة
    logger.info('=== مثال 1: اصطياد الإلكترونيات ===');
    const electronics = await scraper.scrapeCategory('electronics', 1);
    logger.info(`تم اصطياد ${electronics.length} إعلان من الإلكترونيات`);

    // مثال 2: اصطياد عدة فئات
    logger.info('\n=== مثال 2: اصطياد عدة فئات ===');
    const multipleCategories = await scraper.scrapeMultipleCategories(
      ['electronics', 'furniture', 'mobiles'],
      1 // صفحة واحدة لكل فئة
    );
    logger.info(`تم اصطياد ${multipleCategories.listings.length} إعلان من الفئات المتعددة`);

    // مثال 3: الحصول على إحصائيات السوق لفئة
    logger.info('\n=== مثال 3: إحصائيات السوق ===');
    const stats = db.getPriceStats('electronics', 7); // آخر 7 أيام
    logger.info(`إحصائيات الإلكترونيات:`);
    logger.info(`  - المتوسط: ${stats.avgPrice} ريال`);
    logger.info(`  - الأدنى: ${stats.minPrice} ريال`);
    logger.info(`  - الأعلى: ${stats.maxPrice} ريال`);
    logger.info(`  - عدد العينات: ${stats.sampleSize}`);

    // مثال 4: تحليل الفرص
    logger.info('\n=== مثال 4: تحليل الفرص ===');
    const opportunities = await analyzer.analyzeAllListings();
    logger.info(`تم كشف ${opportunities.length} فرصة ربح`);

    // مثال 5: الحصول على أفضل الفرص حسب نسبة الربح
    logger.info('\n=== مثال 5: أفضل 5 فرص حسب نسبة الربح ===');
    const topByMargin = analyzer.getTopOpportunitiesByMargin(5);
    topByMargin.forEach((opp, index) => {
      logger.info(`\n${index + 1}. ${opp.title}`);
      logger.info(`   السعر: ${opp.buyPrice} ريال`);
      logger.info(`   السعر المتوقع: ${opp.estimatedSellPrice} ريال`);
      logger.info(`   الربح: ${opp.potentialProfit} ريال (${opp.profitMargin}%)`);
      logger.info(`   الثقة: ${opp.confidenceScore}%`);
      logger.info(`   السبب: ${opp.reason}`);
    });

    // مثال 6: الحصول على أفضل الفرص حسب الربح المطلق
    logger.info('\n=== مثال 6: أفضل 5 فرص حسب الربح المطلق ===');
    const topByProfit = analyzer.getTopOpportunitiesByProfit(5);
    topByProfit.forEach((opp, index) => {
      logger.info(
        `${index + 1}. ${opp.title} - ربح ${opp.potentialProfit} ريال (${opp.profitMargin}%)`
      );
    });

    // مثال 7: الحصول على فرص من فئة محددة
    logger.info('\n=== مثال 7: أفضل فرص الأثاث ===');
    const furnitureOpportunities = analyzer.getOpportunitiesByCategory('furniture', 3);
    logger.info(`الفرص المتاحة في الأثاث:`);
    furnitureOpportunities.forEach((opp) => {
      logger.info(`- ${opp.title}: ربح ${opp.potentialProfit} ريال`);
    });

    // مثال 8: الحصول على الفرص الموثوقة جداً
    logger.info('\n=== مثال 8: الفرص الموثوقة جداً (80%+ ثقة) ===');
    const highConfidence = analyzer.getHighConfidenceOpportunities(5);
    logger.info(`عدد الفرص الموثوقة: ${highConfidence.length}`);
    highConfidence.forEach((opp) => {
      logger.info(
        `- ${opp.title}: ثقة ${opp.confidenceScore}% | ربح ${opp.profitMargin}%`
      );
    });

    // مثال 9: عرض التقرير الكامل
    logger.info('\n=== مثال 9: التقرير الكامل ===');
    const report = analyzer.generateReport();
    console.log(report);

    // مثال 10: إدارة حالة الفرصة
    logger.info('\n=== مثال 10: تحديث حالة الفرصة ===');
    if (topByMargin.length > 0) {
      const firstOpp = topByMargin[0];
      logger.info(`تحديث حالة "${firstOpp.title}" إلى "notified"`);
      db.updateOpportunityStatus(firstOpp.listingId, 'notified');
      logger.info('تم التحديث بنجاح');
    }

    // مثال 11: الحصول على إحصائيات قاعدة البيانات
    logger.info('\n=== مثال 11: إحصائيات قاعدة البيانات ===');
    const dbStats = db.getStats();
    logger.info(`إجمالي الإعلانات: ${dbStats.totalListings}`);
    logger.info(`الفرص الجديدة: ${dbStats.newOpportunities}`);
    logger.info(`سجلات الأسعار: ${dbStats.priceRecords}`);

    // مثال 12: تنظيف البيانات القديمة
    logger.info('\n=== مثال 12: تنظيف الإعلانات القديمة (أكثر من 30 يوم) ===');
    const deleted = db.cleanupOldListings(30);
    logger.info(`تم حذف ${deleted} إعلان قديم`);
  } catch (error) {
    logger.error('خطأ في المثال:', error);
  } finally {
    // إغلاق قاعدة البيانات
    db.close();
    logger.info('\nانتهى المثال');
  }
}

// تشغيل المثال
example().catch((error) => {
  logger.error('خطأ حرج:', error);
  process.exit(1);
});
