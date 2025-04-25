const { API } = require('nhentai');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

const api = new API();

async function fetchDoujin(rawId, page = 1) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return null;

  try {
    const doujin = await api.fetchDoujin(id);
    if (!doujin) return null;

    const title = doujin.titles.english
      || doujin.titles.japanese
      || doujin.titles.pretty
      || 'Без названия';
    const totalPages = doujin.pages.length;

    const orig = page === 1
      ? doujin.cover.url
      : doujin.pages[page - 1]?.url;
    if (!orig) return null;

    const imageUrl = orig
      .replace('i.nhentai.net', 'i1.nhentai.net')
      .replace('t.nhentai.net', 't1.nhentai.net');

    const { data } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 8000
    });
    const buffer = Buffer.from(data);
    if (!buffer.length) return null;

    const extMatch = imageUrl.match(/\.(jpe?g|png|gif|webp|w)(?=$|\?)/i);
    let ext = 'jpg';
    if (extMatch) {
      const found = extMatch[1].toLowerCase();
      ext = found === 'w' ? 'webp' : found;
    }
    const filename = `cover.${ext}`;

    const attachment = new AttachmentBuilder(buffer, { name: filename });

    const tags = doujin.tags.all.length
      ? doujin.tags.all.map(t => t.name).join(', ')
      : 'Нет';
    const language = doujin.language || 'unknown';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(`https://nhentai.net/g/${id}/${page}`)
      .setImage(`attachment://${filename}`)
      .setColor(0xff006f)
      .addFields(
        { name: 'Язык', value: language, inline: true },
        { name: 'Страница', value: `${page}/${totalPages}`, inline: true },
        { name: 'Теги', value: tags, inline: false }
      );

    return { embed, attachment, totalPages };
  } catch (err) {
    console.error('Ошибка в fetchDoujin:', err.message);
    return null;
  }
}

module.exports = { fetchDoujin };
