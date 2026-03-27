[DEPLOY.md](https://github.com/user-attachments/files/26312004/DEPLOY.md)
# 🚀 NutriLens — Інструкція деплою

## Що отримаєш
- Посилання вигляду `https://nutrilens.vercel.app`
- Відкривається на будь-якому телефоні
- Кожен юзер має свій акаунт і свої дані
- API ключ захищений — ніхто не може його вкрасти

---

## Крок 1 — Supabase (база даних + авторизація)

1. Зайди на **supabase.com** → "Start your project" → безкоштовний акаунт
2. "New project" → назви `nutrilens` → вигадай пароль бази
3. Зачекай ~2 хв поки проєкт запускається
4. Зліва: **SQL Editor** → вставляй вміст файлу `supabase-schema.sql` → Run
5. Зліва: **Authentication** → Providers → вмикай **Google**:
   - Потрібен Google Client ID і Secret (безкоштовно на console.cloud.google.com)
   - Або просто залиш тільки Email — теж працює
6. Зліва: **Settings** → **API**:
   - Копіюй `Project URL` → це твій `SUPABASE_URL`
   - Копіюй `anon public` ключ → це твій `SUPABASE_ANON_KEY`

---

## Крок 2 — GitHub (потрібен для деплою)

1. Зайди на **github.com** → New repository → назви `nutrilens`
2. Завантаж всі файли проєкту (або через git):
   ```bash
   cd nutrilens
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/твій-username/nutrilens.git
   git push -u origin main
   ```

---

## Крок 3 — Vercel (хостинг)

1. Зайди на **vercel.com** → Continue with GitHub
2. "Import" → вибери репозиторій `nutrilens`
3. Framework: **Vite** (визначиться автоматично)
4. **Environment Variables** — додай всі 5:

   | Назва | Значення |
   |-------|---------|
   | `VITE_SUPABASE_URL` | твій Project URL з Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon ключ з Supabase |
   | `SUPABASE_URL` | той самий Project URL |
   | `SUPABASE_ANON_KEY` | той самий anon ключ |
   | `ANTHROPIC_API_KEY` | твій ключ з console.anthropic.com |

5. "Deploy" → чекаєш ~1 хв
6. Отримуєш посилання типу `https://nutrilens-abc123.vercel.app`

---

## Крок 4 — Дозволи для Supabase (обов'язково!)

1. В Supabase → **Authentication** → **URL Configuration**
2. В поле **Site URL** вписуй своє посилання з Vercel: `https://nutrilens-abc123.vercel.app`
3. В **Redirect URLs** додай: `https://nutrilens-abc123.vercel.app/**`
4. Save

---

## Крок 5 — Як додати нових юзерів

**Варіант А (прості запрошення):**
- Просто ділись посиланням — юзери реєструються самі через email або Google

**Варіант Б (тільки запрошені):**
- Supabase → Authentication → вимкни "Enable email signups"
- Тоді тільки ти можеш запрошувати через: Authentication → Users → "Invite user"

---

## ✅ Готово!

Посилання відкривається на телефоні → Додай в "На головний екран" (PWA) → користуєшся як додаток.

---

## Якщо щось не працює

| Проблема | Рішення |
|---------|---------|
| "Invalid token" при аналізі | Перевір SUPABASE_URL і SUPABASE_ANON_KEY в Vercel |
| Не відкривається після входу | Перевір Redirect URLs в Supabase |
| "API error" при аналізі фото | Перевір ANTHROPIC_API_KEY в Vercel |
| Дані не зберігаються | Перевір що виконав SQL схему в Supabase |
