function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function decodeEntities(text = "") {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeText(value = "") {
  return decodeEntities(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cleanName(name = "") {
  return decodeEntities(safeText(name))
    .replace(/\s+/g, " ")
    .replace(/tvg-logo="[^"]*"/gi, "")
    .trim();
}

function cleanChannelName(name = "") {
  return String(name || "")
    .toLowerCase()
    .replace(/\b(fhd|hd|sd|uhd|4k|fullhd)\b/gi, "")
    .replace(/\b(tv|tvc|canal|channel)\b/gi, "")
    .replace(/[|[\]()/\\\-_.:,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildChannelAliases(name = "", group = "", tvgId = "", tvgName = "") {
  const original = decodeEntities(safeText(name));
  const clean = cleanChannelName(original);

  const rawParts = `${original} ${group} ${tvgId} ${tvgName}`
    .split(/[\-|/|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);

  const cleanParts = rawParts
    .map((item) => cleanChannelName(item))
    .filter(Boolean);

  const aliases = [original, clean, tvgId, tvgName, ...rawParts, ...cleanParts]
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return Array.from(new Set(aliases));
}

function extractAttr(line = "", attr = "") {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = line.match(new RegExp(`${escaped}="([^"]*)"`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function extractGroup(extinf = "") {
  const g1 = extractAttr(extinf, "group-title");
  if (g1) return safeText(g1);

  const parts = extinf.split(",");
  if (parts.length > 1) return safeText(parts[1]);

  return "OUTROS";
}

function extractName(extinf = "") {
  const parts = extinf.split(",");
  if (parts.length > 1) return cleanName(parts.slice(1).join(","));
  return "Sem nome";
}

function extractLogo(extinf = "") {
  return extractAttr(extinf, "tvg-logo") || extractAttr(extinf, "logo") || "";
}

function extractTvgId(extinf = "") {
  return safeText(extractAttr(extinf, "tvg-id"));
}

function extractTvgName(extinf = "") {
  return safeText(extractAttr(extinf, "tvg-name"));
}

function extractYear(name = "", group = "") {
  const text = `${name} ${group}`;
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : "";
}

function extractDescription(extinf = "", name = "", group = "") {
  const plot =
    extractAttr(extinf, "plot") ||
    extractAttr(extinf, "description") ||
    extractAttr(extinf, "tvg-description");

  if (plot) return safeText(plot);

  const text = `${name} ${group}`.toLowerCase();

  if (/temporada|epis[oó]dio|s\d{1,2}e\d{1,2}|series|séries|season/.test(text)) {
    return safeText(name || "Conteúdo de série.");
  }

  if (/movie|filme|cinema|lançamento|vod/.test(text)) {
    return safeText(name || "Conteúdo de filme.");
  }

  return safeText(name || "");
}

function looksLikeLiveGroup(group = "") {
  const text = safeText(group).toLowerCase();

  return /abertos|tv aberta|esportes|sport|not[ií]cias|news|document[aá]rios|religiosos|variedades|infantil|kids|globo|sbt|record|band|discovery|history|national geographic|natgeo|24h|ao vivo|tv ao vivo|canais|regionais|locais/.test(
    text
  );
}

function looksLikeMovieGroup(group = "") {
  const text = safeText(group).toLowerCase();

  return /filmes|filme|movies|movie|cinema|lançamento|lancamento|terror|ação|acao|com[eé]dia|comedia|drama|romance|anima[cç][aã]o|suspense|dublado|legendado|nacional|adult/.test(
    text
  );
}

function looksLikeSeriesGroup(group = "") {
  const text = safeText(group).toLowerCase();

  return /s[eé]ries|series|temporadas|season|novelas|doramas|anime/.test(text);
}

function looksLikeMovieName(name = "") {
  const text = safeText(name).toLowerCase();
  return /\b(19\d{2}|20\d{2})\b/.test(text);
}

function isSeriesByText(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  return /series|séries|temporada|epis[oó]dio|season|cap[ií]tulo|s\d{1,2}e\d{1,2}|novelas|anime|dorama/.test(
    text
  );
}

function isMovieByText(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  return /movie|filme|cinema|vod|lançamento|lancamento|ação|acao|terror|drama|romance|com[eé]dia|comedia|anima[cç][aã]o/.test(
    text
  );
}

function hasLiveUrl(url = "") {
  const text = safeText(url).toLowerCase();

  return (
    /\/live\//.test(text) ||
    /type=live/.test(text) ||
    /\/play\/live/.test(text) ||
    /\.(m3u8|ts)(\?|$)/.test(text)
  );
}

function hasMovieUrl(url = "") {
  const text = safeText(url).toLowerCase();

  return (
    /\/movie\//.test(text) ||
    /type=movie/.test(text) ||
    /action=get_vod_stream/.test(text) ||
    /\/vod\//.test(text)
  );
}

function hasSeriesUrl(url = "") {
  const text = safeText(url).toLowerCase();

  return (
    /\/series\//.test(text) ||
    /type=series/.test(text) ||
    /action=get_series/.test(text) ||
    /action=get_series_info/.test(text)
  );
}

function shouldForceLive(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  if (
    /warner channel|hbo|telecine|premiere|sportv|discovery|history|tnt|space|megapix|canal brasil|globo|sbt|record|band|multishow|gnt|viva|fox|fx|sony|axn|a&e|amc|agrobrasil|amazon sat|all sports|espn|cnn|bandnews|globonews/.test(
      text
    )
  ) {
    return true;
  }

  return hasLiveUrl(url) || looksLikeLiveGroup(group);
}

function inferType(name = "", group = "", url = "", tvgId = "", tvgName = "") {
  const merged = `${name} ${group} ${url} ${tvgId} ${tvgName}`.toLowerCase();

  if (hasMovieUrl(url)) return "movie";
  if (hasSeriesUrl(url)) return "series";

  if (looksLikeSeriesGroup(group) || isSeriesByText(name, group, url)) {
    return "series";
  }

  if (looksLikeMovieGroup(group) || isMovieByText(name, group, url)) {
    return "movie";
  }

  if (shouldForceLive(name, group, url)) {
    return "live";
  }

  if (looksLikeLiveGroup(group)) {
    return "live";
  }

  if (hasLiveUrl(url) && !looksLikeMovieGroup(group) && !looksLikeSeriesGroup(group)) {
    return "live";
  }

  if (
    looksLikeMovieName(name) &&
    !looksLikeLiveGroup(group) &&
    !hasLiveUrl(url)
  ) {
    return "movie";
  }

  if (/vod|filme|movie|series|séries|temporada|epis[oó]dio/.test(merged)) {
    if (/series|séries|temporada|epis[oó]dio/.test(merged)) return "series";
    return "movie";
  }

  return "unknown";
}

function buildCategories(items = []) {
  const grouped = {};

  items.forEach((item) => {
    const group = safeText(item.group || "OUTROS").toUpperCase();
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((group) => ({
      name: group,
      count: grouped[group].length,
    }));
}

export async function loadM3U(url) {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok || !text) {
    throw new Error("Falha ao carregar lista");
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const live = [];
  const movies = [];
  const series = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.startsWith("#EXTINF")) continue;

    const extinf = line;
    let streamUrl = "";

    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].startsWith("#")) {
        streamUrl = lines[j];
        i = j;
        break;
      }
    }

    if (!streamUrl) continue;

    const name = extractName(extinf);
    const group = extractGroup(extinf);
    const logo = extractLogo(extinf);
    const tvgId = extractTvgId(extinf);
    const tvgName = extractTvgName(extinf);
    const type = inferType(name, group, streamUrl, tvgId, tvgName);
    const year = extractYear(name, group);
    const description = extractDescription(extinf, name, group);
    const aliases = buildChannelAliases(name, group, tvgId, tvgName);

    if (type === "unknown") {
      continue;
    }

    const item = {
      id: `${type}_${i}_${name}`.replace(/\s+/g, "_"),
      name,
      group,
      logo,
      url: streamUrl,
      type,
      year,
      description,
      tvgId,
      tvgName,
      channelKey: normalizeText(name),
      cleanChannelKey: normalizeText(cleanChannelName(name)),
      aliases,
    };

    if (type === "movie") {
      movies.push(item);
    } else if (type === "series") {
      series.push(item);
    } else if (type === "live") {
      live.push(item);
    }
  }

  return {
    live,
    movies,
    series,
    liveCategories: buildCategories(live),
    movieCategories: buildCategories(movies),
    seriesCategories: buildCategories(series),
    loadedAt: new Date().toISOString(),
  };
}

export default loadM3U;
