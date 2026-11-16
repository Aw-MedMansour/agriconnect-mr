# AgriConnect MR — النشر الذاتي (Docker / Coolify و PostgreSQL 18.7)

## 1. البنية
| الخدمة | الدور |
|---|---|
| `db` | قاعدة PostgreSQL 18.7. المجلد الدائم `pgdata` مركّب على `/var/lib/postgresql` (تخطيط الإصدار 18). المنفذ 5432 غير منشور. |
| `migrate` | مهمة لمرة واحدة في كل نشر: تنتظر القاعدة، تأخذ نسخة احتياطية مُتحقَّقًا منها إن وُجدت ترحيلات معلّقة، ثم تطبّق الترحيلات بقفل يمنع التشغيل المتزامن. |
| `app` | خادم Node 22 بمستخدم غير جذري على المنفذ 3000، لا يبدأ إلا بعد نجاح `migrate`. الوسائط في المجلد `media`. الفحص: `/api/ready`. |
| `backup` | نسخ احتياطي دوري بـ `pg_dump` مع تحقق وسياسة احتفاظ، في مجلد `backups` منفصل عن بيانات القاعدة. |

لا توجد أي خدمة بيانات خارجية. المفتاح `LOVABLE_API_KEY` مطلوب فقط لميزتي الذكاء الاصطناعي.

## 2. متغيرات البيئة
```bash
cp .env.example .env.production
openssl rand -base64 48   # مرتين: SESSION_SECRET و MEDIA_SIGNING_SECRET
```
الإلزامية: `POSTGRES_DB`، `POSTGRES_USER`، `POSTGRES_PASSWORD`، `DATABASE_URL` بصيغة `postgres://USER:PASSWORD@db:5432/DB`، `SESSION_SECRET`، `MEDIA_SIGNING_SECRET` (32 حرفًا على الأقل). الاختيارية: `LOVABLE_API_KEY`، `BACKUP_INTERVAL_HOURS` (24)، `BACKUP_RETENTION_DAYS` (14).

## 3. الاختبار المحلي
```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.local.yml up -d --build
docker compose logs migrate
curl http://localhost:3000/api/ready
```

## 4. Coolify
1. مورد جديد ← **Docker Compose** ← المستودع والفرع والملف `docker-compose.yml`.
2. أضف متغيرات القسم 2.
3. النطاقات على الخدمة `app` والمنفذ 3000: `https://agriconnect-mr.com,https://www.agriconnect-mr.com`.
4. انشر. إذا فشل الترحيل يبقى الإصدار السابق يعمل ولا يُعتبر الجديد سليمًا.
5. لا تفعّل حذف المجلدات عند إعادة النشر.

## 5. تعديل قاعدة البيانات (للمطورين)
```bash
bun run db:generate --name add_x
# راجع ملف SQL وأضف قسم "## NNNN_add_x" إلى db/RECOVERY.md
bun run test && bun run db:check
```
القواعد: لا تعدّل ترحيلًا مطبّقًا، لا تستخدم `drizzle-kit push` في الإنتاج، والتغييرات الهدّامة تمر بمراحل (إضافة ← نقل البيانات ← حذف في إصدار لاحق بموافقة ونسخة احتياطية).

## 6. النسخ الاحتياطي
```bash
docker compose exec backup /scripts/backup-db.sh manual
docker compose exec backup /scripts/verify-backup.sh /backups/<file>.dump
```

## 7. الاستعادة (تتطلب تأكيدًا صريحًا)
```bash
docker compose stop app
docker compose run --rm -e CONFIRM_RESTORE=agriconnect migrate /scripts/restore-db.sh /backups/<file>.dump
docker compose start app
```
يرفض السكربت العمل دون `CONFIRM_RESTORE=<اسم القاعدة>` ويأخذ نسخة أمان قبل الاستعادة.

## 8. بعد فشل ترحيل
- أُلغي الترحيل الفاشل تلقائيًا وبقيت القاعدة على الإصدار السابق.
- اقرأ الخطأ في `docker compose logs migrate`.
- أصلح بترحيل **جديد** ثم أعد النشر، أو استعد نسخة `pre-migration` عند تلف البيانات.

## 9. نقل البيانات من القاعدة القديمة (اختياري، مرة واحدة)
`bun scripts/supabase-import/import.ts --dry-run` ثم بدون `--dry-run`، مع `SOURCE_DATABASE_URL` و `SOURCE_STORAGE_URL` و `SOURCE_SERVICE_KEY`. يحافظ على المعرّفات والتواريخ، ويمكن إعادة تشغيله بأمان، وينقل الملفات ويحدّث روابطها، وينتج تقريرًا. كلمات المرور القديمة تُتحقق عند أول دخول ثم تُحوَّل إلى Argon2id؛ الحسابات دون كلمة مرور صالحة تُضبط بـ `scripts/set-password.ts`. لا تُحذف البيانات القديمة.

## 10. حل المشكلات
- التطبيق لا يبدأ: راجع `docker compose logs migrate`.
- `/api/ready` يعيد 503: القاعدة متوقفة أو `DATABASE_URL` خاطئ.
- فشل رفع الملفات: المجلد `media` غير قابل للكتابة.
- لا تركّب مجلد PostgreSQL 16 القديم مباشرة: انقل البيانات بالنسخ والاستعادة.
