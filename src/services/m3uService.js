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

function extractAttr(line = "", attr = "") {
  const escaped = attr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const doubleQuoted = line.match(
    new RegExp(`${escaped}\\s*=\\s*"([^"]*)"`, "i")
  );
  if (doubleQuoted?.[1]) return decodeEntities(doubleQuoted[1]);

  const singleQuoted = line.match(
    new RegExp(`${escaped}\\s*=\\s*'([^']*)'`, "i")
  );
  if (singleQuoted?.[1]) return decodeEntities(singleQuoted[1]);

  return "";
}

function extractGroup(line = "") {
  const group = extractAttr(line, "group-title");
  return group ? group.trim() : "OUTROS";
}

function cleanName(name = "") {
  return decodeEntities(String(name || ""))
    .replace(/tvg-logo="[^"]*"/gi, "")
    .replace(/tvg-logo='[^']*'/gi, "")
    .replace(/group-title="[^"]*"/gi, "")
    .replace(/group-title='[^']*'/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractName(line = "") {
  const index = line.indexOf(",");
  if (index >= 0) {
    return cleanName(line.slice(index + 1));
  }
  return "Sem nome";
}

function extractLogo(line = "") {
  return extractAttr(line, "tvg-logo") || extractAttr(line, "logo") || "";
}

function extractTvgId(line = "") {
  return extractAttr(line, "tvg-id") || "";
}

function extractTvgName(line = "") {
  return extractAttr(line, "tvg-name") || "";
}

function normalizeText(value = "") {
  return decodeEntities(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value = "") {
  return normalizeText(value)
    .replace(/[|[\]()/\\\-_.:,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasEpisodePattern(text = "") {
  return (
    /\bs\d{1,2}\s*e\d{1,3}\b/i.test(text) ||
    /\btemporada\s*\d+\b/i.test(text) ||
    /\bseason\s*\d+\b/i.test(text) ||
    /\bepisodio\s*\d+\b/i.test(text) ||
    /\bepisodio\b/i.test(text) ||
    /\bepisode\s*\d+\b/i.test(text)
  );
}

function hasMoviePattern(text = "") {
  return (
    /\((19|20)\d{2}\)/.test(text) ||
    /\b(19|20)\d{2}\b/.test(text) ||
    /\b(bluray|web-dl|webrip|hdrip|dvdrip|cam|h264|h265|x264|x265|1080p|720p|2160p)\b/i.test(
      text
    )
  );
}

function isAmbiguousMixedGroup(groupText = "") {
  return (
    groupText.includes("filmes e series") ||
    groupText.includes("filmes & series") ||
    groupText.includes("movie and series") ||
    groupText.includes("movies and series") ||
    groupText.includes("filme e serie")
  );
}

function isStrongSeriesGroup(groupText = "") {
  return (
    /\bseries\b/.test(groupText) ||
    /\bserie\b/.test(groupText) ||
    /\btemporadas\b/.test(groupText) ||
    /\bepisodios\b/.test(groupText) ||
    /\bepisodio\b/.test(groupText) ||
    /\bnovelas\b/.test(groupText) ||
    /\banimes\b/.test(groupText)
  );
}

function isStrongMovieGroup(groupText = "") {
  return (
    /\bfilmes\b/.test(groupText) ||
    /\bfilme\b/.test(groupText) ||
    /\bmovies\b/.test(groupText) ||
    /\bmovie\b/.test(groupText) ||
    /\bcinema\b/.test(groupText) ||
    /\blancamentos\b/.test(groupText) ||
    /\blancamento\b/.test(groupText) ||
    /\bdublado\b/.test(groupText) ||
    /\blegendado\b/.test(groupText) ||
    /\bvod\b/.test(groupText)
  );
}

function isLikelyLiveChannel(nameText = "", groupText = "", tvgNameText = "") {
  const joined = `${nameText} ${groupText} ${tvgNameText}`;

  if (/\b(fhd|hd|sd|uhd|4k)\b/.test(joined)) return true;

  if (
    /\b(tv|canal|channel|news|sport|sports|espn|discovery|animal planet|globo|record|band|sbt|cnn|hbo|telecine|premiere|combate|nick|cartoon|disney)\b/.test(
      joined
    )
  ) {
    return true;
  }

  return false;
}

function hasVodUrl(url = "") {
  const lower = normalizeText(url);
  return (
    lower.includes("/movie/") ||
    lower.includes("/series/") ||
    lower.includes("/vod/") ||
    /\.(mp4|mkv|avi|mov|m4v|mpg|mpeg)(\?|$)/i.test(url)
  );
}

function inferType(name = "", group = "", url = "", tvgName = "", tvgId = "") {
  const nameText = normalizeKey(name);
  const groupText = normalizeKey(group);
  const tvgNameText = normalizeKey(tvgName);
  const tvgIdText = normalizeKey(tvgId);
  const joinedText = `${nameText} ${groupText} ${tvgNameText} ${tvgIdText}`;

  const episodeByName = hasEpisodePattern(nameText) || hasEpisodePattern(tvgNameText);
  const movieByName = hasMoviePattern(nameText) || hasMoviePattern(tvgNameText);
  const urlLooksVod = hasVodUrl(url);

  const ambiguousMixedGroup = isAmbiguousMixedGroup(groupText);
  const strongSeriesGroup = isStrongSeriesGroup(groupText) && !ambiguousMixedGroup;
  const strongMovieGroup = isStrongMovieGroup(groupText) && !ambiguousMixedGroup;
  const likelyLive = isLikelyLiveChannel(nameText, groupText, tvgNameText);

  // 1) Série real tem prioridade máxima
  if (episodeByName) {
    return "series";
  }

  // 2) URLs claramente de VOD
  if (urlLooksVod) {
    if (strongSeriesGroup) return "series";
    if (strongMovieGroup) return "movie";
    if (episodeByName) return "series";
    if (movieByName) return "movie";
  }

  // 3) Grupo forte de série, desde que não pareça canal linear
  if (strongSeriesGroup && !likelyLive) {
    return "series";
  }

  // 4) Grupo forte de filme, desde que não pareça canal linear
  if (strongMovieGroup && !likelyLive) {
    return "movie";
  }

  // 5) Nome com cara de filme
  if (movieByName && !likelyLive) {
    return "movie";
  }

  // 6) Grupo misto tipo "FILMES E SERIES" não decide nada sozinho.
  // Se o nome parecer canal linear, fica live.
  if (ambiguousMixedGroup && likelyLive) {
    return "live";
  }

  // 7) Canais ao vivo ficam como live
  return "live";
}

function buildCategories(items = []) {
  const grouped = {};

  items.forEach((item) => {
    const group = safeText(item.group || "OUTROS");
    if (!grouped[group]) grouped[group] = 0;
    grouped[group] += 1;
  });

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      count: grouped[name],
    }));
}

function parseHeaderInfo(firstLine = "") {
  const epgUrl =
    extractAttr(firstLine, "url-tvg") ||
    extractAttr(firstLine, "x-tvg-url") ||
    "";

  return {
    epgUrl,
    xmltvUrl: epgUrl,
  };
}

export async function loadM3U(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "*/*",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const text = await response.text();

  if (!text || !text.includes("#EXTM3U")) {
    throw new Error("Falha ao carregar lista");
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const headerLine = lines[0] || "#EXTM3U";
  const headerInfo = parseHeaderInfo(headerLine);

  const live = [];
  const movies = [];
  const series = [];

  let currentInfo = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXTINF")) {
      currentInfo = line;
      continue;
    }

    if (!line.startsWith("#") && currentInfo) {
      const name = extractName(currentInfo);
      const group = extractGroup(currentInfo);
      const logo = extractLogo(currentInfo);
      const tvgId = extractTvgId(currentInfo);
      const tvgName = extractTvgName(currentInfo);
      const streamUrl = line;

      const type = inferType(name, group, streamUrl, tvgName, tvgId);

      const item = {
        id: `${type}_${i}_${name}`.replace(/\s+/g, "_"),
        name,
        group,
        logo,
        url: streamUrl,
        type,
        tvgId,
        tvgName,
      };

      if (type === "movie") {
        movies.push(item);
      } else if (type === "series") {
        series.push(item);
      } else {
        live.push(item);
      }

      currentInfo = null;
    }
  }

  return {
    live,
    movies,
    series,
    liveCategories: buildCategories(live),
    movieCategories: buildCategories(movies),
    seriesCategories: buildCategories(series),
    epgUrl: headerInfo.epgUrl,
    xmltvUrl: headerInfo.xmltvUrl,
    loadedAt: new Date().toISOString(),
  };
}

export default loadM3U;
