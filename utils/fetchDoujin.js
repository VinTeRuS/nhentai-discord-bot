const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

const BASE_API_URL = 'https://nhentai.net/api';
const CDN_SERVERS = ['i3.nhentai.net', 'i7.nhentai.net', 'i5.nhentai.net'];
const THUMBNAIL_SERVERS = ['t3.nhentai.net', 't7.nhentai.net', 't5.nhentai.net'];

// Кеш для избежания повторных запросов
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Получение случайного ID из существующих галерей
async function getRandomId() {
  try {
    // Получаем случайную страницу из популярных
    const randomPage = Math.floor(Math.random() * 100) + 1;
    const { data } = await axios.get(`${BASE_API_URL}/galleries/all?page=${randomPage}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (data.result && data.result.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.result.length);
      return data.result[randomIndex].id;
    }
  } catch (err) {
    console.log('Ошибка получения случайного ID, используем fallback');
  }
  
  // Fallback на старый метод
  return Math.floor(Math.random() * 400000) + 1;
}

// Получение данных галереи с кешированием
async function fetchGalleryData(id) {
  const cacheKey = `gallery_${id}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Используем кешированные данные для галереи ${id}`);
    return cached.data;
  }

  const apiUrl = `${BASE_API_URL}/gallery/${id}`;
  console.log('Запрос к API:', apiUrl);
  
  const { data } = await axios.get(apiUrl, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  });

  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Очистка старого кеша
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }

  return data;
}

// Загрузка изображения с поддержкой нескольких CDN
async function downloadImage(mediaId, page, imageType, ext, isCover = false) {
  const servers = isCover ? THUMBNAIL_SERVERS : CDN_SERVERS;
  
  for (const server of servers) {
    try {
      let imageUrl;
      if (isCover) {
        imageUrl = `https://${server}/galleries/${mediaId}/cover.${ext}`;
      } else {
        imageUrl = `https://${server}/galleries/${mediaId}/${page}.${ext}`;
      }

      console.log('Попытка загрузки:', imageUrl);

      const { data } = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://nhentai.net/'
        }
      });

      const buffer = Buffer.from(data);
      if (buffer.length > 0) {
        console.log('Изображение успешно загружено');
        return buffer;
      }
    } catch (err) {
      console.log(`Ошибка загрузки с ${server}:`, err.message);
      continue;
    }
  }

  throw new Error('Не удалось загрузить изображение ни с одного CDN');
}

async function fetchDoujin(rawId, page = 1, infoOnly = false) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    console.log('Некорректный ID:', rawId);
    return null;
  }

  try {
    const doujin = await fetchGalleryData(id);

    if (!doujin) {
      console.log('Галерея не найдена');
      return null;
    }

    const title = doujin.title?.english
      || doujin.title?.japanese
      || doujin.title?.pretty
      || 'Без названия';

    const totalPages = doujin.images?.pages?.length || 0;
    if (totalPages === 0) return null;

    // Проверка валидности страницы
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;

    // Если запрошена только информация
    if (infoOnly) {
      const tags = {
        artists: doujin.tags?.filter(t => t.type === 'artist').map(t => t.name) || [],
        parodies: doujin.tags?.filter(t => t.type === 'parody').map(t => t.name) || [],
        characters: doujin.tags?.filter(t => t.type === 'character').map(t => t.name) || [],
        tags: doujin.tags?.filter(t => t.type === 'tag').map(t => t.name) || [],
        languages: doujin.tags?.filter(t => t.type === 'language').map(t => t.name) || [],
        categories: doujin.tags?.filter(t => t.type === 'category').map(t => t.name) || []
      };

      const infoEmbed = new EmbedBuilder()
        .setTitle(title)
        .setURL(`https://nhentai.net/g/${id}`)
        .setColor(0xff006f)
        .setThumbnail(`https://t3.nhentai.net/galleries/${doujin.media_id}/thumb.jpg`)
        .addFields(
          { name: '📊 ID', value: `\`${id}\``, inline: true },
          { name: '📄 Страниц', value: `${totalPages}`, inline: true },
          { name: '❤️ Избранное', value: `${doujin.num_favorites || 0}`, inline: true }
        );

      // Добавляем поля только если есть данные
      if (tags.artists.length > 0) {
        const artistsStr = tags.artists.join(', ');
        if (artistsStr.trim().length > 0) {
          infoEmbed.addFields({ 
            name: '🎨 Художники', 
            value: artistsStr.length > 1024 ? artistsStr.substring(0, 1021) + '...' : artistsStr, 
            inline: false 
          });
        }
      }
      
      if (tags.parodies.length > 0) {
        const parodiesStr = tags.parodies.join(', ');
        if (parodiesStr.trim().length > 0) {
          infoEmbed.addFields({ 
            name: '📺 Пародии', 
            value: parodiesStr.length > 1024 ? parodiesStr.substring(0, 1021) + '...' : parodiesStr, 
            inline: false 
          });
        }
      }
      
      if (tags.characters.length > 0) {
        const charsStr = tags.characters.join(', ');
        if (charsStr.trim().length > 0) {
          infoEmbed.addFields({ 
            name: '👥 Персонажи', 
            value: charsStr.length > 1024 ? charsStr.substring(0, 1021) + '...' : charsStr, 
            inline: false 
          });
        }
      }
      
      if (tags.languages.length > 0) {
        const langsStr = tags.languages.join(', ');
        if (langsStr.trim().length > 0) {
          infoEmbed.addFields({ name: '🌐 Языки', value: langsStr, inline: true });
        }
      }
      
      if (tags.categories.length > 0) {
        const catsStr = tags.categories.join(', ');
        if (catsStr.trim().length > 0) {
          infoEmbed.addFields({ name: '📁 Категории', value: catsStr, inline: true });
        }
      }
      
      if (tags.tags.length > 0) {
        const tagsStr = tags.tags.join(', ');
        if (tagsStr.trim().length > 0) {
          infoEmbed.addFields({ 
            name: '🏷️ Теги', 
            value: tagsStr.length > 1024 ? tagsStr.substring(0, 1021) + '...' : tagsStr, 
            inline: false 
          });
        }
      }

      infoEmbed.setFooter({ text: `Загружено: ${new Date(doujin.upload_date * 1000).toLocaleDateString('ru-RU')}` });

      return { infoEmbed };
    }

    // Получаем данные изображения
    const mediaId = doujin.media_id;
    let imageData;
    
    if (page === 1) {
      imageData = doujin.images.cover;
    } else {
      imageData = doujin.images.pages[page - 1];
    }

    if (!imageData) {
      console.log('Данные изображения не найдены');
      return null;
    }

    // Определяем расширение файла
    const typeMap = {
      'j': 'jpg',
      'p': 'png',
      'g': 'gif',
      'w': 'webp'
    };
    const ext = typeMap[imageData.t] || 'jpg';

    // Загружаем изображение
    const buffer = await downloadImage(mediaId, page, imageData.t, ext, page === 1);

    const filename = `page_${page}.${ext}`;
    const attachment = new AttachmentBuilder(buffer, { name: filename });

    // Собираем теги
    const allTags = doujin.tags?.map(t => t.name).join(', ') || 'Нет';
    const langTag = doujin.tags?.find(t => t.type === 'language');
    const language = langTag ? langTag.name : 'unknown';

    const embed = new EmbedBuilder()
      .setTitle(title.length > 256 ? title.substring(0, 253) + '...' : title)
      .setURL(`https://nhentai.net/g/${id}/${page}`)
      .setImage(`attachment://${filename}`)
      .setColor(0xff006f)
      .addFields(
        { name: '🆔 ID', value: `\`${id}\``, inline: true },
        { name: '🌐 Язык', value: language, inline: true },
        { name: '📄 Страница', value: `${page}/${totalPages}`, inline: true }
      )
      .setFooter({ text: `❤️ ${doujin.num_favorites || 0} • ${new Date(doujin.upload_date * 1000).toLocaleDateString('ru-RU')}` });

    // Добавляем теги только если они не слишком длинные
    if (allTags.length <= 1024) {
      embed.addFields({ name: '🏷️ Теги', value: allTags, inline: false });
    }

    return { embed, attachment, totalPages };
  } catch (err) {
    console.error('Ошибка в fetchDoujin:', err.message);
    if (err.response?.status === 404) {
      console.log('Галерея 404 - не существует');
    }
    return null;
  }
}

async function searchDoujin(tag, sort = 'random') {
  try {
    console.log('Поиск по тегу:', tag, 'Сортировка:', sort);
    
    const searchUrl = `${BASE_API_URL}/galleries/search?query=tag:"${encodeURIComponent(tag)}"`;
    console.log('URL поиска:', searchUrl);
    
    const { data } = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('Получен ответ от API');
    
    if (!data || !data.result || data.result.length === 0) {
      console.log('Результаты поиска пусты');
      return null;
    }

    console.log('Найдено галерей:', data.result.length);
    
    let selectedDoujin;
    
    switch (sort) {
      case 'popular':
        // Самая популярная (по избранному)
        selectedDoujin = data.result.reduce((prev, current) => 
          (prev.num_favorites > current.num_favorites) ? prev : current
        );
        break;
        
      case 'recent':
        // Самая свежая
        selectedDoujin = data.result[0];
        break;
        
      case 'random':
      default:
        // Случайная
        const randomIndex = Math.floor(Math.random() * Math.min(data.result.length, 25));
        selectedDoujin = data.result[randomIndex];
        break;
    }
    
    console.log('Выбрана галерея с ID:', selectedDoujin.id);
    
    return { id: parseInt(selectedDoujin.id) };
  } catch (err) {
    console.error('Ошибка в searchDoujin:', err.message);
    return null;
  }
}

module.exports = { fetchDoujin, searchDoujin, getRandomId };