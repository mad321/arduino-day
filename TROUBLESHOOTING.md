# استكشاف الأخطاء والإصلاح 🔧

دليل شامل لحل المشاكل الشائعة في Haraj Profit Opportunity Scraper.

## جدول المحتويات

1. [مشاكل التثبيت](#مشاكل-التثبيت)
2. [مشاكل الإعدادات](#مشاكل-الإعدادات)
3. [مشاكل الاصطياد](#مشاكل-الاصطياد)
4. [مشاكل قاعدة البيانات](#مشاكل-قاعدة-البيانات)
5. [مشاكل التحليل](#مشاكل-التحليل)
6. [مشاكل الأداء](#مشاكل-الأداء)
7. [مشاكل شائعة أخرى](#مشاكل-شائعة-أخرى)

---

## مشاكل التثبيت

### ❌ خطأ: "Cannot find module 'typescript'"

**الأعراض**:
```
Error: Cannot find module 'typescript'
```

**الأسباب المحتملة**:
- المتعلقات غير مثبتة
- Node.js قديم جداً

**الحل**:
```bash
# 1. تأكد من استخدام Node 18+
node --version  # يجب أن تكون >= v18.0.0

# 2. حذف node_modules
rm -rf node_modules package-lock.json

# 3. إعادة التثبيت
npm install

# 4. البناء
npm run build
```

### ❌ خطأ: "npm ERR! 404 Not Found"

**الأسباب المحتملة**:
- اتصال إنترنت ضعيف
- اسم الحزمة خاطئ

**الحل**:
```bash
# 1. التحقق من الاتصال
ping npmjs.com

# 2. مسح الكاش
npm cache clean --force

# 3. إعادة المحاولة
npm install
```

### ❌ خطأ: "ERR! code EACCES"

**الأسباب المحتملة**:
- مشاكل الأذونات

**الحل**:
```bash
# الخيار 1: استخدام sudo (غير موصى به)
sudo npm install

# الخيار 2: إصلاح الأذونات
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# ثم إعادة التثبيت
npm install
```

---

## مشاكل الإعدادات

### ❌ خطأ: "FIRECRAWL_API_KEY is required"

**الأعراض**:
```
Error: FIRECRAWL_API_KEY is required
```

**الأسباب المحتملة**:
- ملف `.env` غير موجود
- المفتاح غير معرّف
- اسم المتغير خاطئ

**الحل**:
```bash
# 1. التحقق من وجود .env
ls -la .env

# 2. إذا لم يكن موجوداً، أنشئه
cp .env.example .env

# 3. افتح الملف وأضف المفتاح
nano .env
# أضف:
# FIRECRAWL_API_KEY=your_actual_key_here

# 4. احفظ واخرج (Ctrl+X ثم Y)

# 5. تحقق من القيمة
cat .env | grep FIRECRAWL
```

### ❌ خطأ: "Invalid configuration"

**الأعراض**:
```
Error: Invalid configuration
```

**الحل**:
```bash
# 1. تحقق من صيغة .env
cat .env

# 2. تأكد من الصيغة الصحيحة:
KEY=value        # صحيح
KEY = value      # خطأ (مسافات)
KEY="value"      # صحيح
KEY=value#comment # صحيح

# 3. تحقق من القيم الرقمية
PROFIT_THRESHOLD=20      # صحيح (رقم)
MIN_PRICE=50            # صحيح (رقم)
PROFIT_THRESHOLD=twenty # خطأ (نص)
```

### ❌ خطأ: "Categories not recognized"

**الحل**:
```bash
# الفئات الصحيحة هي:
# electronics, furniture, cars, clothes, books, sports, appliances, mobiles

# في .env:
MONITORED_CATEGORIES=electronics,furniture,mobiles

# ليس:
MONITORED_CATEGORIES=الكترونيات,أثاث  # خطأ (عربي)
MONITORED_CATEGORIES=Electronics      # خطأ (كبيرة)
```

---

## مشاكل الاصطياد

### ❌ خطأ: "Failed to scrape"

**الأعراض**:
```
Error: Failed to scrape electronics: ...
```

**الأسباب المحتملة**:
- مشاكل الإنترنت
- مفتاح Firecrawl غير صحيح
- الموقع غير متاح
- IP مُحظور

**الحل**:
```bash
# 1. اختبر الاتصال
curl -I https://haraj.com.sa

# 2. تحقق من مفتاح Firecrawl
curl -X POST https://api.firecrawl.dev/v0/scrape \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{"url": "https://haraj.com.sa"}'

# 3. انتظر قليلاً قبل إعادة المحاولة
# (قد يكون IP مُحظور مؤقتاً)

# 4. جرّب فئة أخرى
npm run dev -- once  # سيحاول فئة واحدة فقط
```

### ❌ خطأ: "Timeout exceeded"

**الأسباب المحتملة**:
- إنترنت بطيء
- الموقع بطيء
- عدد الطلبات كثير

**الحل**:
```bash
# 1. زيادة timeout في config.ts
// تغيير من 30000 إلى 60000
timeout: 60000

# 2. تقليل عدد الصفحات
# في example.ts أو index.ts
scrapeMultipleCategories(categories, 1)  // صفحة واحدة بدلاً من 2-3

# 3. تقليل الفئات
MONITORED_CATEGORIES=electronics,mobiles
```

### ❌ النتائج فارغة (No results)

**الأسباب المحتملة**:
- الموقع تغيّر
- مشاكل في Parsing

**الحل**:
```bash
# 1. فعّل debug logging
LOG_LEVEL=debug npm run dev

# 2. تحقق من HTML structure
# اذهب إلى الموقع وفحص الـ elements

# 3. أصلح patterns في scraper.ts
// تحديث regex patterns

# 4. اختبر يدوياً
curl https://haraj.com.sa/for-sale/electronics?page=1
```

---

## مشاكل قاعدة البيانات

### ❌ خطأ: "Database is locked"

**الأعراض**:
```
Error: database is locked
```

**الأسباب المحتملة**:
- عمليات متعددة تستخدم نفس الملف
- ملفات WAL لم تُحذف

**الحل**:
```bash
# 1. أغلق جميع العمليات
pkill -f "node"

# 2. احذف ملفات WAL
rm haraj_listings.db-shm
rm haraj_listings.db-wal
rm haraj_listings.db-wal

# 3. جرّب مجدداً
npm run dev
```

### ❌ خطأ: "Cannot find database"

**الحل**:
```bash
# 1. التحقق من المسار
echo $DB_PATH

# 2. تأكد من وجود المجلد
mkdir -p $(dirname $DB_PATH)

# 3. تحقق من الأذونات
ls -la haraj_listings.db

# 4. إذا لم تكن موجودة، ستُنشأ تلقائياً عند التشغيل
npm run dev  # سينشئ الملف
```

### ❌ خطأ: "Disk space full"

**الحل**:
```bash
# 1. تحقق من المساحة
df -h

# 2. احذف البيانات القديمة يدوياً
# عدّل CLAUDE.md لاستدعاء cleanupOldListings

# 3. أو احذف الملف تماماً (سيُنشأ جديد)
rm haraj_listings.db*

# 4. إذا كانت مساحة النظام ممتلئة
# تحقق من /tmp و ~/
rm -rf /tmp/*
```

### ❌ البيانات القديمة تراكمت

**الحل**:
```typescript
// في index.ts أو مباشرة:
import { HarajDatabase } from './database.js';

const db = new HarajDatabase('./haraj_listings.db');
const deleted = db.cleanupOldListings(30);  // احذف > 30 يوم
console.log(`حذفت ${deleted} إعلان`);
db.close();
```

---

## مشاكل التحليل

### ❌ لا توجد فرص مكتشفة

**الأسباب المحتملة**:
- threshold عالي جداً
- قاعدة البيانات فارغة
- الأسعار عادية جداً

**الحل**:
```bash
# 1. قلل الـ threshold مؤقتاً
PROFIT_THRESHOLD=5 npm run dev

# 2. تحقق من عدد الإعلانات
# من خلال getStats()

# 3. أضف logs
LOG_LEVEL=debug npm run dev
```

### ❌ درجة الثقة منخفضة

**الحل**:
```typescript
// في analyzer.ts، اضبط weights:

// زيادة تأثير anomaly detection
if (isAnomalous) confidence += 25;  // من 15

// تقليل عقوبة البيانات القليلة
if (sampleSize < 10) confidence -= 5;  // من 10
```

### ❌ الأسعار غير دقيقة

**الحل**:
```typescript
// في MARKET_MULTIPLIERS، حدّث القيم:
electronics: { multiplier: 0.65, confidence: 70 },
// استناداً إلى ملاحظاتك الشخصية
```

---

## مشاكل الأداء

### ❌ البرنامج بطيء جداً

**الحل**:
```bash
# 1. قلل عدد الصفحات
# في index.ts
pagesPerCategory: 1  // بدلاً من 3

# 2. قلل الفئات
MONITORED_CATEGORIES=electronics,mobiles

# 3. فعّل caching
// سيُضاف في الإصدار التالي

# 4. فحص الأداء
time npm run scrape
```

### ❌ استهلاك الذاكرة عالي

**الحل**:
```bash
# 1. قلل حجم البيانات المحمّلة
// في getListingsByCategory
limit: 100  // بدلاً من 500

# 2. معالجة الدفعات (Batching)
// سيُضاف في الإصدار التالي

# 3. مراقبة الذاكرة
node --max-old-space-size=512 dist/index.js
```

---

## مشاكل شائعة أخرى

### ❌ TypeScript Compilation Error

**الحل**:
```bash
# 1. تحقق من الأخطاء بالتفصيل
npm run build

# 2. تأكد من tsconfig.json صحيح
cat tsconfig.json

# 3. تحديث TypeScript
npm install -D typescript@latest

# 4. إعادة البناء
npm run build
```

### ❌ ESLint Errors

**الحل**:
```bash
# 1. عرض الأخطاء
npm run lint

# 2. إصلاح تلقائي
npx eslint src --fix

# 3. إذا لم تنجح، اصلح يدوياً
nano src/file.ts
```

### ❌ Git Conflicts

**الحل**:
```bash
# 1. شاهد الملفات المتضاربة
git status

# 2. حل اليدوي أو اختر نسخة
git checkout --ours src/file.ts   # نسختك
git checkout --theirs src/file.ts # نسختهم

# 3. أكمل الدمج
git add .
git commit -m "Resolve conflicts"
```

### ❌ Docker Build Error

**الحل**:
```bash
# 1. احذف الـ cache
docker system prune

# 2. أعد البناء
docker-compose build --no-cache

# 3. تحقق من Dockerfile
cat Dockerfile

# 4. شغّل مع debugging
docker-compose up --build
```

### ❌ البرنامج يتوقف مفاجئة

**الحل**:
```bash
# 1. فعّل core dumps
ulimit -c unlimited

# 2. شغّل مع logging كامل
LOG_LEVEL=debug npm run dev

# 3. استخدم process manager
npm install -g pm2
pm2 start dist/index.js --name "haraj-scraper"
pm2 logs haraj-scraper
```

---

## الحصول على الدعم 💬

### إذا لم تجد الحل:

1. **تحقق من GitHub Issues**
   ```
   https://github.com/mad321/arduino-day/issues
   ```

2. **اجمع المعلومات**
   ```bash
   # شغّل هذا واحفظ النتيجة
   node --version
   npm --version
   cat .env | grep -v API_KEY
   npm run build 2>&1 | head -50
   ```

3. **افتح Issue جديد**
   - عنوان واضح
   - أعراض دقيقة
   - الخطوات لإعادة الخطأ
   - البيئة (OS, Node version, etc)
   - السجلات (logs)

4. **شارك سجل الأخطاء**
   ```bash
   npm run dev 2>&1 | tee error.log
   # ثم شارك error.log في Issue
   ```

---

## قائمة فحص التشخيص ✅

قبل طلب الدعم، جرّب:

- [ ] تحديث Node.js إلى أحدث إصدار
- [ ] حذف node_modules وإعادة التثبيت
- [ ] حذف haraj_listings.db* وإعادة التشغيل
- [ ] التحقق من .env والمتغيرات
- [ ] تشغيل مع LOG_LEVEL=debug
- [ ] اختبار الاتصال بالإنترنت
- [ ] التحقق من مفتاح Firecrawl
- [ ] قراءة CLAUDE.md و API.md

---

**آخر تحديث**: 2026-09-03  
**الإصدار**: 1.0.0
