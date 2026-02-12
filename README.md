# سامانه تصمیم‌یار مدیریت رهاسازی آب (گلستان ← وشمگیر)

این پروژه یک نسخه نمایشی حرفه‌ای و قابل ارائه کارفرمایی برای پشتیبانی تصمیم در مدیریت رهاسازی آب سد است.  
سامانه با داده‌های بذر/ساختگی اجرا می‌شود و معماری آن در سطح نزدیک به تولید طراحی شده است. اتصال به OpenRouter برای چت‌بات **اختیاری** است.

## ویژگی‌های اصلی

### 1) تجربه کاربری و رابط
- طراحی کامل **RTL** با فونت فارسی `Vazirmatn`
- صفحه **معرفی** در ابتدا (`/`) و سپس **صفحه لاگین** (`/login`)
- داشبورد کاملاً ریسپانسیو:
  - دسکتاپ: سایدبار چندسطحی کامل
  - تبلت: چیدمان جمع‌وجور
  - موبایل: هدر چسبان + منوی کشویی راست‌چین
- حالت روشن/تیره
- تاریخ‌ها و انتخابگرهای تاریخ کاملاً شمسی
- چت‌بات پاپ‌آپ تخصصی پروژه با OpenRouter (دارای Scope Guard)
- فوتر حقوقی و مالکیت در تمام صفحات
- وضعیت‌های استاندارد `Loading / Empty / Error`
- منوها مطابق IA کامل و عملیاتی

### 2) ماژول‌های سامانه (رابط کاربری + API)
- نمای کلی (داشبورد)
- پایش زنده:
  - مخزن و دریچه‌ها
  - ورودی/خروجی
- مدیریت داده:
  - مجموعه‌داده‌ها
  - کیفیت داده
  - ورود داده (سی‌اس‌وی/اکسل)
- مرکز پیش‌بینی:
  - پیش‌بینی ورودی
  - پیش‌بینی تقاضای بخشی
  - رجیستری مدل‌ها
- برنامه‌ریز بهینه‌سازی:
  - اجرای جدید (گام‌به‌گام)
  - تاریخچه اجراها
  - برنامه‌های رهاسازی + خروجی پی‌دی‌اف/سی‌اس‌وی
- آزمایشگاه سناریو (چه-می‌شود-اگر)
- مرکز بحران (سیلاب/خشکسالی)
- گزارش‌ها (مدیریتی + فنی)
- نقشه GIS نمایشی منطقه سدها و گره‌های پایین‌دست
- مدیریت سامانه:
  - کاربران و نقش‌ها
  - گزارش‌های ممیزی
  - تنظیمات سیستم
- راهنما و آموزش

### 3) امنیت و کنترل دسترسی
- توکن‌های JWT (دسترسی + نوسازی)
- هش‌کردن رمز عبور (argon2/bcrypt)
- RBAC + ماتریس مجوزها
- محدودسازی نرخ درخواست (نسخه نمایشی)
- سیاست رمز عبور (نسخه نمایشی)
- مسیر ممیزی برای تغییرات مهم

### 4) داده، پیش‌بینی و بهینه‌سازی
- تولید 5 سال داده مصنوعی روزانه:
  - ورودی/خروجی
  - داده‌های هواشناسی
  - تراز/ذخیره مخزن
  - تقاضای بخشی آب
- نسخه نمایشی پیش‌بینی (ورودی/تقاضا/وضعیت) با ذخیره خروجی در پایگاه داده
- نسخه نمایشی بهینه‌سازی چندهدفه با قیود:
  - حداقل دبی محیط‌زیستی
  - کف/سقف رهاسازی
  - حدود ذخیره/تراز ایمن
  - وزن‌دهی اولویت تامین بخش‌ها
- ماژول توضیح تصمیم (LLM Stub) در مسیر `/llm/explain`
- ماژول چت تخصصی پروژه در مسیر `/chatbot/message`

## ساختار پروژه

```text
/apps/web                  # Next.js App Router + UI
/apps/api                  # FastAPI + SQLAlchemy + Auth/RBAC
/packages/ui               # بسته رابط کاربری مشترک
/packages/shared           # انواع داده و اعتبارسنجی مشترک
/infra/docker-compose.yml
/scripts/seed_data.py
/docker-compose.yml
```

## پیش‌نیاز
- Docker + Docker Compose
- (برای اجرای محلی خارج Docker) Node.js 20+ و Python 3.11+

---

## اجرای سریع با Docker

### 1) ساخت و اجرا
```bash
docker compose up --build
```

### 2) آدرس‌ها
- فرانت‌اند: `http://localhost:3000`
- مستندات API (Swagger): `http://localhost:8000/docs`
- سلامت API: `http://localhost:8000/health`

### 2.1) دسترسی از بیرون سرور با IP
- فرانت‌اند را با IP سرور باز کنید: `http://<SERVER_IP>:3000`
- API از طریق پروکسی داخلی Next روی مسیر `/backend/*` فراخوانی می‌شود؛ بنابراین درخواست‌ها از مرورگر کاربر به `localhost` خودش ارسال نمی‌شوند.
- پورت‌های `3000` و `8000` باید در فایروال/SG باز باشند.

### 3) توقف
```bash
docker compose down
```

> نسخه دوم Compose نیز در مسیر `infra/docker-compose.yml` موجود است.

---

## حساب‌های دمو
- `admin / admin123`
- `operator / op123`
- `analyst / an123`
- `viewer / vi123`
- `auditor / au123`

---

## اجرای محلی (بدون Docker)

### Backend
```bash
cd apps/api
python3 -m pip install -r requirements.txt
python3 -m pytest -q
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd apps/web
npm install
npm run test
npm run build
npm run dev
```

---

## Seed داده
- در startup بک‌اند (با `DEMO_AUTO_SEED=true`) به‌صورت خودکار انجام می‌شود.
- اجرای دستی:
```bash
python3 scripts/seed_data.py
```

Seed شامل:
- 5 سال داده روزانه مصنوعی
- سناریوهای تر/نرمال/خشک
- کاربران/نقش‌ها/مجوزها
- قیود ایمنی و قواعد هشدار
- اجرای اولیه پیش‌بینی/بهینه‌سازی/سناریو برای آماده بودن داشبوردها

---

## تنظیم OpenRouter (اختیاری)

برای فعال‌سازی چت‌بات واقعی OpenRouter، مقادیر زیر را در `apps/api/.env.docker` یا `apps/api/.env` تنظیم کنید:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=http://<SERVER_IP>:3000
OPENROUTER_APP_NAME=Golestan Water DSS Demo
```

رفتار چت‌بات:
- فقط به سوال‌های مرتبط با پروژه پاسخ می‌دهد.
- اگر کاربر درباره سازنده سامانه سوال بپرسد، پاسخ مالکیت برند را برمی‌گرداند.
- اگر کلید OpenRouter تنظیم نشده باشد، پاسخ fallback قواعدمحور برمی‌گرداند.

---

## مسیرهای مهم API

### Auth
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Users/RBAC
- `GET/POST /users`
- `GET/PATCH/DELETE /users/{id}`
- `GET/POST /roles`
- `GET /permissions`
- `GET /audit-logs`

### Data
- `GET/POST /datasets`
- `POST /datasets/{id}/upload`
- `GET /timeseries`
- `POST /timeseries/bulk`

### پیش‌بینی
- `POST /forecast/train`
- `POST /forecast/run`
- `GET /forecast/runs`
- `GET /forecast/runs/{id}`

### بهینه‌سازی
- `POST /optimization/run`
- `GET /optimization/runs`
- `GET /optimization/runs/{id}`
- `GET /release-plans/{id}`
- `GET /release-plans/{id}/export?format=pdf|csv`

### سناریو
- `POST /scenarios`
- `GET /scenarios`
- `POST /scenarios/{id}/simulate`
- `GET /scenarios/{id}/results`

### بحران/هشدار
- `POST /alerts/rules`
- `GET /alerts`
- `POST /alerts/evaluate`

### ماژول توضیح تصمیم (Stub)
- `POST /llm/explain`

### چت‌بات پروژه
- `POST /chatbot/message`

### سلامت سرویس
- `GET /health`
- `GET /ready`

---

## استاندارد پاسخ API
- تمام پاسخ‌ها شامل `request_id` هستند.
- خطاها با فرمت استاندارد `error.code / error.message / error.details` برمی‌گردند.
- لیست‌ها pagination دارند (`page`, `page_size`, `total`, ...).

---

## تست و اعتبارسنجی انجام‌شده

### بک‌اند
```bash
cd apps/api && python3 -m pytest -q
```
نتیجه: `2 passed`

### فرانت‌اند
```bash
cd apps/web && npm run test
cd apps/web && npm run build
```
نتیجه: تست و ساخت نسخه نهایی موفق.

### Docker
- `docker compose build` موفق
- `docker compose up` و بررسی Health موفق

---

## نکات مهم توسعه
- مسیر چت‌بات OpenRouter اختیاری است و در نبود کلید، fallback داخلی فعال می‌ماند.
- ماژول LLM توضیح تصمیم (`/llm/explain`) همچنان Stub قواعدمحور است و برای اتصال به Local LLM آماده توسعه است.
- زیرساخت Redis/Celery در معماری لحاظ شده و قابل ارتقاست.
