# AgriConnect MR — النشر الذاتي (Docker / Coolify)

## البنية
- التطبيق: TanStack Start (React 19 مع العرض من جهة الخادم ووظائف الخادم) يُبنى بإعداد **node-server** ويعمل على **Node.js 22** داخل Docker.
- قاعدة البيانات والمصادقة والتخزين: مشروع Supabase الحالي دون تغيير.
- الذكاء الاصطناعي (محادثة Plant AI وتحليل صور النباتات): بوابة Lovable AI عبر المفتاح `LOVABLE_API_KEY` من جهة الخادم فقط.
- المنفذ الداخلي: **3000**. فحص الصحة: `GET /api/health`.

## المتطلبات
- خادم Linux مع Docker 24+ و Docker Compose v2 (أو Coolify v4).
- سجلات DNS من نوع `A` للنطاقين `agriconnect-mr.com` و `www` نحو الخادم.
- رابط Supabase والمفتاح العام، ومفتاح `LOVABLE_API_KEY`.

## متغيرات البيئة
| المتغير | التوقيت | إلزامي | الدور |
|---|---|---|---|
| `VITE_SUPABASE_URL` | البناء | نعم | رابط Supabase العام |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | البناء | نعم | المفتاح العام |
| `VITE_SUPABASE_PROJECT_ID` | البناء | لا | معرّف المشروع |
| `SUPABASE_URL` | التشغيل | نعم | رابط الخادم |
| `SUPABASE_PUBLISHABLE_KEY` | التشغيل | نعم | المفتاح العام للخادم |
| `SUPABASE_SERVICE_ROLE_KEY` | التشغيل | لا | غير مستخدم حاليًا |
| `LOVABLE_API_KEY` | التشغيل | للذكاء الاصطناعي | Plant AI وتحليل الصور |

يرفض الحاوي التشغيل إذا غابت المتغيرات الإلزامية. لا تُضمَّن الأسرار في الصورة.

## الاختبار المحلي
```bash
cp .env.example .env.production
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.local.yml up -d --build
curl http://localhost:3000/api/health
docker compose logs -f agriconnect
```

## Coolify
1. مورد جديد ← **Docker Compose** ← اختر المستودع والفرع، الملف `docker-compose.yml`.
2. أضف متغيرات البيئة، وفعّل خيار **Build Variable** لمتغيرات `VITE_*`.
3. النطاقات: `https://agriconnect-mr.com,https://www.agriconnect-mr.com` (المنفذ 3000).
4. انشر؛ يصدر Coolify شهادة HTTPS تلقائيًا بعد ضبط DNS.
5. في Supabase أضف `https://agriconnect-mr.com` إلى عناوين إعادة التوجيه للمصادقة.

## السجلات
```bash
docker compose logs -f --tail=200 agriconnect
```

## التحديث
```bash
git pull && docker compose --env-file .env.production up -d --build
```

## حل المشكلات
- `Missing required environment variable(s)`: أضف متغيرات التشغيل.
- صفحة بيضاء: متغيرات `VITE_*` كانت فارغة أثناء البناء، أعد البناء.
- فشل الذكاء الاصطناعي: تحقق من `LOVABLE_API_KEY` ورصيد البوابة.
- خطأ 502: الحاوي غير سليم، راجع السجلات وتأكد من المنفذ 3000.

## التبعيات الخارجية المتبقية
- Supabase (البيانات، المصادقة، التخزين).
- بوابة Lovable AI؛ البديل: أي واجهة متوافقة مع OpenAI بمفتاح خادم خاص.
