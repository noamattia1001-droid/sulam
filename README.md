# סולם · אתר + דשבורד פניות

## מה יש בתיקייה

| קובץ | מה זה |
|---|---|
| `index.html` | האתר עצמו (הסקרול, הטלפון, המחירון, הטופס) |
| `admin/index.html` | דשבורד הניהול: כל הפניות, סטטוס, הערות, כפתור וואטסאפ, ייצוא לאקסל |
| `api/lead.js` | מקבל את הטופס מהאתר, שומר ב-Supabase ושולח לך התראה |
| `api/config.js` | מעביר לדשבורד את הכתובת והמפתח הציבורי של Supabase |
| `supabase/schema.sql` | יוצר את טבלת הפניות ואת ההרשאות. מריצים פעם אחת |
| `assets/` | לוגואים ואייקון |
| `.env.example` | רשימת המשתנים שצריך להכניס ל-Vercel |

## איך זה עובד

מבקר ממלא טופס באתר ← `/api/lead` שומר את הפנייה ב-Supabase ← אתה מקבל וואטסאפ או מייל ← הפנייה מופיעה מיד ב-`/admin`.

---

## שלב 1 · Supabase (בערך 5 דקות)

1. נכנסים ל-supabase.com ← **New project** ← שם: `sulam`, אזור: Frankfurt (eu-central-1).
2. **SQL Editor ← New query** ← מדביקים את כל `supabase/schema.sql` ← **Run**.
   - בשורה האחרונה רשום המייל שלך כמנהל. רוצים להוסיף שותף? מוסיפים שורה עם המייל שלו.
3. **Authentication ← Users ← Add user ← Create new user**: המייל שלך + סיסמה. לסמן Auto Confirm.
4. **Authentication ← Sign In / Providers**: לכבות את **Allow new users to sign up**. ככה אף אחד אחר לא יכול לפתוח משתמש.
5. **Project Settings ← API** (או Data API): להעתיק שלושה דברים:
   - Project URL
   - `anon` `public` key
   - `service_role` key ← **סודי**. רק ל-Vercel. לא לשלוח בצ'אט ולא לשים בקוד.

## שלב 2 · GitHub + Vercel

**הדרך הקלה (GitHub Desktop):**
1. GitHub Desktop ← File ← Add local repository ← לבחור את התיקייה הזו ← Create repository ← Publish (פרטי). שם: `sulam-website`.
2. vercel.com ← **Add New ← Project** ← לבחור את `sulam-website` ← Framework: **Other** ← לא לשנות כלום אחר.
3. לפני Deploy, לפתוח **Environment Variables** ולהוסיף:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_URL` (למשל `https://sulam.co.il`)
4. **Deploy**.

**או מהטרמינל, בלי GitHub:** בתוך התיקייה מריצים `npx vercel` ואחרי זה `npx vercel --prod`, ומוסיפים את המשתנים באתר של Vercel.

## שלב 3 · הקישורים

אחרי ה-Deploy, Vercel נותן כתובת כמו `sulam-website.vercel.app`:

- האתר: `https://sulam-website.vercel.app`
- הדשבורד: `https://sulam-website.vercel.app/admin`

**דומיין משלכם:** Vercel ← Project ← Settings ← Domains ← להוסיף `sulam.co.il` ולהעתיק את רשומות ה-DNS שמופיעות שם לרשם הדומיין. אחרי זה הדשבורד יהיה ב-`sulam.co.il/admin`.

## שלב 4 · התראה על פנייה חדשה (לא חובה)

**וואטסאפ אליך, בחינם (CallMeBot):**
1. שומרים באנשי הקשר את המספר של CallMeBot, לפי ההוראות באתר שלהם.
2. שולחים לו בוואטסאפ: `I allow callmebot to send me messages`.
3. הוא מחזיר apikey. ב-Vercel מוסיפים את `CALLMEBOT_PHONE` (למשל `972501234567`) ואת `CALLMEBOT_APIKEY`. אחרי זה Redeploy.

**מייל (Resend):** פותחים חשבון ב-resend.com ומוסיפים ב-Vercel את `RESEND_API_KEY` ואת `NOTIFY_EMAIL`.

## בדיקה

1. ממלאים את הטופס באתר עם שם וטלפון.
2. נכנסים ל-`/admin` עם המייל והסיסמה שיצרת.
3. הפנייה מופיעה. לוחצים **וואטסאפ**, נפתחת שיחה עם הודעה מוכנה, והסטטוס עובר אוטומטית ל"דיברנו".

## לפני שעולים לאוויר

- בהצהרת הנגישות ובמדיניות הפרטיות (בתחתית האתר) יש מקומות ריקים: [שם], [מספר], [כתובת], [מייל]. מחפשים `[` בקובץ `index.html` ומחליפים.
- כפתור "וואטסאפ" באזור יצירת הקשר עדיין לא מוביל למספר. מחפשים `href="#contact">וואטסאפ` ומחליפים ב-`href="https://wa.me/9725XXXXXXXX"`.
