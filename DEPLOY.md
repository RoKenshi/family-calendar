# Инструкция по деплою

## Шаг 1: Создание Telegram бота

1. Откройте [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните **токен бота** (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Шаг 2: Получение Chat ID

### Вариант 1: Использование бота
1. Откройте [@userinfobot](https://t.me/userinfobot)
2. Отправьте `/start`
3. Скопируйте ваш **ID** (число, например `123456789`)

### Вариант 2: Через API
1. Отправьте любое сообщение вашему боту
2. Откройте в браузере: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Найдите `"chat":{"id":123456789}` и скопируйте число

## Шаг 3: Деплой Cloudflare Worker

### Установка Wrangler CLI

```bash
npm install -g wrangler
# или локально: npm install
```

### Авторизация в Cloudflare

```bash
npx wrangler login
```

### Настройка переменных окружения

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Вставьте токен бота из Шага 1

npx wrangler secret put TELEGRAM_CHAT_ID
# Вставьте Chat ID из Шага 2
```

### Деплой Worker

```bash
npm run deploy
# или
npx wrangler deploy
```

После деплоя вы получите URL вида:
```
https://family-calendar-worker.your-subdomain.workers.dev
```

## Шаг 4: Обновление API URL в HTML

Откройте `index.html` и обновите `API_URL`:

```javascript
const API_URL = 'https://family-calendar-worker.your-subdomain.workers.dev/api/event';
```

## Шаг 5: Деплой фронтенда на Cloudflare Pages

### Вариант 1: Через Dashboard

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **Workers & Pages**
3. Нажмите **Create Application** → **Pages** → **Connect to Git**
4. Подключите ваш GitHub/GitLab репозиторий
5. Настройки build:
   - **Build command**: (оставьте пустым)
   - **Build output directory**: `/` (корневая директория)
6. В **Settings** → **Functions** → добавьте route:
   - Route: `/api/*`
   - Worker: выберите ваш Worker из списка

### Вариант 2: Через Wrangler CLI

```bash
npx wrangler pages deploy . --project-name=family-calendar
```

После деплоя ваш сайт будет доступен по адресу:
```
https://family-calendar.pages.dev
```

## Проверка работы

1. Откройте ваш календарь в браузере
2. Кликните на любую дату
3. Введите название события
4. Проверьте Telegram — должно прийти уведомление!

## Локальная разработка

Для тестирования Worker локально:

```bash
npm run dev
```

Создайте файл `.dev.vars` в корне проекта:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

Теперь Worker будет использовать эти переменные при локальной разработке.

## Troubleshooting

### Ошибка "Method not allowed"
- Убедитесь, что отправляете POST запрос на правильный endpoint

### Ошибка "Server configuration error"
- Проверьте, что переменные окружения установлены через `wrangler secret put`

### Ошибка "Failed to send notification to Telegram"
- Проверьте правильность токена бота
- Убедитесь, что вы отправили сообщение боту хотя бы раз
- Проверьте правильность Chat ID

### CORS ошибки
- Убедитесь, что Worker возвращает правильные CORS заголовки (они уже настроены в коде)
- Проверьте, что API_URL указывает на правильный домен
