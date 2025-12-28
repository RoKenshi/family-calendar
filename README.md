# Семейный календарь

Веб-приложение календаря для семей, интегрированное с Telegram WebApp и Spring Boot backend.

## Архитектура

```
[ Telegram WebApp ] → [ Cloudflare Pages ] → [ Spring Boot Backend ] → [ PostgreSQL ]
                            ↓
                    [ Cloudflare Tunnel ]
```

## Технологии

- **Фронтенд**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Spring Boot 3.2.1, PostgreSQL, Liquibase
- **Инфраструктура**: Cloudflare Pages (хостинг фронта), Cloudflare Tunnel (доступ к backend)
- **Аутентификация**: Telegram WebApp (initData валидация)

## Быстрый старт

### Предварительные требования

1. **Telegram бот** - создайте через [@BotFather](https://t.me/botfather)
2. **Spring Boot Backend** - должен быть развернут и доступен (см. [family-calendar-back/README.md](../family-calendar-back/README.md))
3. **Cloudflare Tunnel** - настроен для доступа к backend (см. [family-calendar-back/docs/DEPLOY.md](../family-calendar-back/docs/DEPLOY.md))

### 1. Настройка API endpoint

URL бэкенда определяется автоматически:

- **Локальная разработка** (localhost) → `http://localhost:8080`
- **Продакшен** → `https://api.yourdomain.com` (нужно обновить в коде)

**Как узнать URL бэкенда:**

#### Локальная разработка:
1. Запустите backend локально (см. [family-calendar-back/README.md](../family-calendar-back/README.md))
2. Backend будет доступен на `http://localhost:8080`
3. Откройте `index.html` локально - URL определится автоматически

#### Продакшен (через Cloudflare Tunnel):
1. Настройте Cloudflare Tunnel (см. [family-calendar-back/docs/DEPLOY.md](../family-calendar-back/docs/DEPLOY.md))
2. После настройки tunnel, ваш backend будет доступен по адресу типа:
   ```
   https://api.yourdomain.com
   ```
3. Обновите в `index.html` функцию `getApiBaseUrl()`:
   ```javascript
   // Продакшен URL (замените на свой)
   return 'https://api.yourdomain.com';
   ```

#### Проверка доступности backend:
```bash
# Локально
curl http://localhost:8080/actuator/health

# Через Cloudflare Tunnel
curl https://api.yourdomain.com/actuator/health
```

Если backend доступен, вы получите ответ `{"status":"UP"}`.

#### Отладка URL через параметр:
Можно также указать URL через параметр в адресной строке:
```
https://your-pages-site.pages.dev/?api_url=https://api.yourdomain.com
```

### 2. Настройка календаря

По умолчанию используется `calendarId = 1`. Если у вас другой календарь, измените:

```javascript
let currentCalendarId = 1; // Замените на ID вашего календаря
```

### 3. Деплой на Cloudflare Pages

1. Подключите репозиторий к Cloudflare Pages
2. Настройте build:
   - **Build command**: (не требуется, статический сайт)
   - **Build output directory**: `/` (корневая директория)
3. Задеплойте

Или через Wrangler CLI:

```bash
npx wrangler pages deploy .
```

### 4. Проверка работы

1. Откройте календарь через Telegram бота (кнопка "Open Web App")
2. Календарь должен автоматически загрузить события из backend
3. При клике на дату должно открыться модальное окно для создания события

## Локальная разработка

### Запуск Worker локально

```bash
npm run dev
```

Worker будет доступен на `http://localhost:8787`

### Тестирование Worker

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-08","title":"Встреча"}'
```

## API Integration

Фронтенд интегрирован с Spring Boot backend API. Все запросы требуют заголовок `X-Telegram-Init-Data` с валидной подписью Telegram.

### POST /api/events

Создает новое событие в календаре.

**Заголовки:**
- `X-Telegram-Init-Data` (обязательно) - Telegram initData с подписью
- `Content-Type: application/json`

**Тело запроса:**
```json
{
  "calendarId": 1,
  "title": "Встреча",
  "description": "Описание события",
  "startAt": "2025-01-08T09:00:00Z",
  "durationMinutes": 60
}
```

**Ответ:**
```json
{
  "id": 1,
  "calendarId": 1,
  "creatorId": 123,
  "title": "Встреча",
  "description": "Описание события",
  "startAt": "2025-01-08T09:00:00Z",
  "durationMinutes": 60,
  "createdAt": "2025-01-08T10:00:00Z"
}
```

### GET /api/events/calendar/{calendarId}

Получает список событий календаря с пагинацией.

**Параметры запроса:**
- `page` (default=0) - номер страницы
- `size` (default=20) - размер страницы
- `startFrom` (опционально) - начало диапазона дат (ISO-8601)
- `startTo` (опционально) - конец диапазона дат (ISO-8601)

**Ответ:**
```json
{
  "content": [
    {
      "id": 1,
      "calendarId": 1,
      "creatorId": 123,
      "title": "Встреча",
      "startAt": "2025-01-08T09:00:00Z",
      "durationMinutes": 60
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "number": 0,
  "size": 20
}
```

Подробная документация API: [family-calendar-back/docs/API.md](../family-calendar-back/docs/API.md)

## Структура проекта

```
family-calendar/
├── index.html          # Фронтенд приложения (HTML + JS)
├── README.md          # Документация
├── DEPLOY.md          # Инструкции по деплою
└── package.json       # Зависимости (если нужны)
```

## Аутентификация

Приложение использует Telegram WebApp для аутентификации:

1. Пользователь открывает календарь через Telegram бота
2. Telegram передает `initData` с подписью HMAC SHA-256
3. Фронтенд передает `initData` в заголовке `X-Telegram-Init-Data` на каждый запрос
4. Backend валидирует подпись и извлекает данные пользователя

**Важно:** Приложение должно открываться только через Telegram WebApp для корректной работы аутентификации.

## Особенности

- ✅ **Telegram-native** - полностью интегрирован с Telegram WebApp
- ✅ **Без авторизации** - используется встроенная валидация Telegram
- ✅ **Backend integration** - все данные хранятся в PostgreSQL через Spring Boot
- ✅ **Семейные календари** - поддержка нескольких календарей и семей
- ✅ **Реальное время** - события загружаются из базы данных

## Разработка

### Локальная разработка

1. Запустите backend локально (см. [family-calendar-back/README.md](../family-calendar-back/README.md))
2. Обновите `API_BASE_URL` в `index.html` на `http://localhost:8080`
3. Откройте `index.html` в браузере (или через локальный сервер)

**Примечание:** Для полной функциональности нужен доступ к Telegram WebApp через бота.

### Отладка

1. Откройте DevTools в браузере
2. Проверьте Network tab для запросов к API
3. Проверьте Console для ошибок
4. Убедитесь, что `telegramInitData` доступен (должен быть, если открыто через Telegram)

## Troubleshooting

### Ошибка 401 Unauthorized
- Убедитесь, что приложение открыто через Telegram WebApp
- Проверьте, что `telegramInitData` не пустой в консоли

### Ошибка 403 Forbidden
- Пользователь не является членом семьи, которой принадлежит календарь
- Проверьте `currentCalendarId` в коде

### События не загружаются
- Проверьте, что backend доступен по указанному URL
- Проверьте логи backend на наличие ошибок
- Убедитесь, что календарь существует в базе данных

## Лицензия

MIT