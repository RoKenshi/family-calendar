/**
 * Cloudflare Worker для обработки событий календаря и отправки уведомлений в Telegram
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Обрабатываем только путь /api/event (или корень, если Worker настроен как endpoint)
    if (url.pathname !== '/api/event' && url.pathname !== '/') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Обработка CORS preflight запросов
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Разрешаем только POST запросы
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    try {
      // Получаем данные из запроса
      const body = await request.json();
      const { date, title, time, user } = body;

      // Валидация
      if (!date || !title) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: date and title' }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // Получаем переменные окружения
      const botToken = env.TELEGRAM_BOT_TOKEN;
      const chatId = env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.error('Missing environment variables: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          {
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // Формируем сообщение для Telegram
      let message = `📅 Новое событие\n`;
      message += `Дата: ${date}\n`;
      
      // Добавляем продолжительность (если указана в будущем)
      // Пока оставляем без этого поля, т.к. в запросе его нет
      
      if (time) {
        // Конвертируем время в читаемый формат (HH:MM -> H:MM AM/PM)
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        message += `Время: ${h12}:${minutes} ${ampm}\n`;
      }
      
      message += `Событие: ${title}\n`;
      
      // Добавляем информацию о пользователе (если доступна)
      if (user) {
        const userName = user.username 
          ? `${user.name || 'Пользователь'} (@${user.username})`
          : user.name || 'Пользователь';
        message += `От: ${userName}`;
      }

      // Отправляем сообщение в Telegram
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('Telegram API error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to send notification to Telegram' }),
          {
            status: 502,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      // Возвращаем успешный ответ
      return new Response(
        JSON.stringify({ status: 'ok' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
