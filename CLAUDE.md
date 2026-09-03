# Haraj Profit Opportunity Scraper - Claude Code Documentation

## مرحبا بك! 👋

هذا المشروع هو **أداة متقدمة لاستكشاف فرص الربح من حراج** باستخدام تقنية Firecrawl للاصطياد الذكي.

## ما يفعله المشروع ❓

تقوم الأداة بـ:
1. **اصطياد الإعلانات** من حراج.com.sa لعدة فئات
2. **تحليل الأسعار** بناءً على بيانات السوق
3. **كشف الفرص** حيث يمكن شراء شيء وإعادة بيعه برابح
4. **تتبع الأسعار** وحفظ السجل التاريخي
5. **توليد التقارير** عن أفضل الفرص الموجودة

## هيكل المشروع 📁

```
src/
├── index.ts          - البرنامج الرئيسي
├── config.ts         - إدارة الإعدادات من .env
├── logger.ts         - نظام التسجيل (Pino)
├── types.ts          - تعاريف TypeScript (Zod schemas)
├── database.ts       - SQLite database operations
├── scraper.ts        - اصطياد الويب باستخدام Firecrawl
└── analyzer.ts       - تحليل وكشف الفرص
```

## المعلومات الأساسية 🔧

- **اللغة**: TypeScript
- **البيئة**: Node.js >= 18
- **نظام البيانات**: SQLite (local)
- **المكتبات الأساسية**:
  - `@firecrawl/sdk` - لاصطياد الويب
  - `better-sqlite3` - قاعدة البيانات
  - `zod` - validation
  - `pino` - logging

## البدء السريع 🚀

```bash
# 1. تثبيت المتعلقات
npm install

# 2. إنشاء ملف .env
cp .env.example .env

# 3. إضافة مفتاح Firecrawl
# عدّل .env وأضف: FIRECRAWL_API_KEY=your_key_here

# 4. تشغيل الأداة
npm run dev          # تشغيل مستمر
npm run dev -- once  # تشغيل واحد
npm run dev -- report # عرض التقرير
```

## الإعدادات الهامة ⚙️

في ملف `.env`:

```env
# المفتاح والبيانات الأساسية
FIRECRAWL_API_KEY=your_key_here
NODE_ENV=development

# التحكم في الاصطياد
PROFIT_THRESHOLD=20          # النسبة المئوية للربح (مثال: 20%)
MIN_PRICE=50                 # السعر الأدنى بالريال
MAX_PRICE=5000              # السعر الأعلى بالريال
SCRAPE_INTERVAL=3600000     # الفترة الزمنية (الافتراضي: 1 ساعة)

# اختيار الفئات
MONITORED_CATEGORIES=electronics,furniture,cars,clothes,books
```

## الفئات المدعومة 📦

- `electronics` - الإلكترونيات
- `furniture` - الأثاث
- `cars` - السيارات
- `clothes` - الملابس
- `books` - الكتب
- `sports` - الرياضة
- `appliances` - الأجهزة الكهربائية
- `mobiles` - الهواتف النقالة

## كيف يعمل التحليل 🧠

### 1. حساب السعر المتوقع للبيع

كل فئة لها مضاعل بيع متوقع:
```
السعر_المتوقع = متوسط_السوق × مضاعل_الفئة

مثال: إلكترونيات
- متوسط السوق: 1000 ريال
- مضاعل: 0.65 (65%)
- السعر المتوقع: 650 ريال
```

### 2. حساب درجة الثقة (0-100)

تُحسب من:
- عدد العينات في السوق
- استقرار الأسعار
- مستوى الخصم من المتوسط
- هامش الربح
- جودة وصف الإعلان

### 3. المعادلة النهائية

```
الربح = السعر_المتوقع - سعر_الشراء
نسبة_الربح% = (الربح / سعر_الشراء) × 100
```

فقط الفرص بـ نسبة ربح > `PROFIT_THRESHOLD` تُعتبر فرصة حقيقية.

## قاعدة البيانات 🗄️

ثلاث جداول رئيسية:

### 1. `listings` - الإعلانات
- id, title, price, category, description
- location, seller, url, imageUrl
- postedAt, lastChecked

### 2. `opportunities` - فرص الربح
- listingId, title, buyPrice, estimatedSellPrice
- potentialProfit, profitMargin, confidenceScore
- status: 'new', 'notified', 'purchased', 'sold', 'expired'

### 3. `price_history` - سجل الأسعار
- listingId, category, price, recordedAt

## الأوامر المتاحة 💻

```bash
npm run build          # بناء المشروع
npm run dev            # تشغيل مستمر مع hot reload
npm run start          # تشغيل النسخة المترجمة
npm run scrape         # تشغيل دورة واحدة
npm run lint           # فحص الأخطاء

# أو مباشرة مع ts-node:
npx ts-node src/index.ts              # تشغيل مستمر
npx ts-node src/index.ts once         # دورة واحدة
npx ts-node src/index.ts report       # عرض التقرير
```

## ملاحظات مهمة ⚠️

1. **الأسعار تقريبية**: تُحسب بناءً على متوسط السوق فقط
2. **احترم السياسات**: استخدم فترات معقولة للاصطياد
3. **قد تتغير الأسعار**: البيانات لحظة الاصطياد فقط
4. **لا ضمانات**: استخدم الأداة بحذر للأغراض البحثية

## مسارات التطوير المستقبلية 🚀

- [ ] إشعارات بالفرص الجديدة
- [ ] واجهة ويب لعرض الفرص
- [ ] تنبيهات البريد الإلكتروني
- [ ] توقعات الأسعار بـ ML
- [ ] تحليل الاتجاهات التاريخية
- [ ] تطبيق موبايل

## استكشاف الأخطاء 🔍

### المشكلة: "FIRECRAWL_API_KEY is required"
**الحل**: تأكد من:
1. ملف `.env` موجود
2. `FIRECRAWL_API_KEY` معرّف فيه بقيمة صحيحة

### المشكلة: "Cannot find module"
**الحل**: شغّل `npm install`

### المشكلة: لا توجد نتائج
**الحل**:
1. اختبر اتصال الإنترنت
2. تحقق من مفتاح Firecrawl
3. جرّب فئة أخرى في الإعدادات

## للمزيد من المعلومات 📚

- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [حراج.com.sa](https://haraj.com.sa)
- [TypeScript Docs](https://www.typescriptlang.org)
- [SQLite Docs](https://www.sqlite.org/docs.html)

---

**آخر تحديث**: 2026-09-03  
**الإصدار**: 1.0.0
