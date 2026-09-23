# ربط موقع ملاذ مع Railway

الموقع الحالي يعمل كواجهة ثابتة، والملفات الموجودة فيه لا تحتوي على توكن Discord. ربط البيانات الحقيقي يحتاج API يعمل في مشروع Railway.

## تشغيل API في Railway

يجب أن يوفر مشروع Railway هذه المسارات:

- `GET /health`
- `GET /api/public/server`
- `GET /api/public/roles`
- `GET /api/public/members?q=...`
- `GET /api/public/member/:id`
- `GET /api/public/leaderboard`

ويجب أن يضع التوكن في Railway Variables فقط، وليس في هذا المستودع.

## ربط رابط Railway بالموقع

قبل تحميل `app.js` في `index.html` أضف:

```html
<script>
  window.MALAZ_API_URL = "https://YOUR-RAILWAY-DOMAIN.up.railway.app";
</script>
<script src="api-client.js"></script>
<script src="app.js"></script>
```

استبدل `YOUR-RAILWAY-DOMAIN` بالرابط الحقيقي من Railway. لا تضع التوكن هنا.

## اختبار الاتصال

افتح:

```text
https://YOUR-RAILWAY-DOMAIN.up.railway.app/health
```

ويجب أن يعيد الخادم JSON مثل:

```json
{"ok":true}
```

## ملاحظة

`app.js` الحالي يحتوي على بيانات تجريبية. بعد تجهيز API، يجب أن يستدعي كود الواجهة `MalazAPI.roles()` و`MalazAPI.members()` و`MalazAPI.member(id)` بدلاً من المصفوفات التجريبية. لا يمكن جلب إحصائيات الرسائل أو الفويس القديمة إلا إذا كان البوت قد سجلها في قاعدة بيانات.
