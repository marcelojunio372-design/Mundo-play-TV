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
    /\bepisodios\b/i.test(text) ||
    /\bepisode\s*\d+\b/i.test(text) ||
    /\bcapitulo\s*\d+\b/i.test(text)
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

function hasLiveNamePattern(text = "") {
  return (
    /\b(fhd|hd|sd|uhd|4k)\b/.test(text) ||
    /\b(tv|canal|channel)\b/.test(text) ||
    /\b(animal planet|discovery|globo|record|band|sbt|espn|premiere|combate|telecine|hbo|cnn|nick|cartoon|disney|amc|a&e|agro|amazon sat|apple tv)\b/.test(
      text
    )
  );
}

function isSeriesGroup(groupText = "") {
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

function isMovieGroup(groupText = "") {
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
    /\bvod\b/.test(groupText) ||
    /\bcoletanea\b/.test(groupText) ||
    /\bcolecao\b/.test(groupText)
  );
}

function isLiveGroup(groupText = "") {
  return (
    /\babertos\b/.test(groupText) ||
    /\bcanais\b/.test(groupText) ||
    /\besportes\b/.test(groupText) ||
    /\bdocumentarios\b/.test(groupText) ||
    /\b24h\b/.test(groupText) ||
    /\bnoticias\b/.test(groupText) ||
    /\binfantil\b/.test(groupText) ||
    /\breligiosos\b/.test(groupText) ||
    /\bglobo\b/.test(groupText) ||
    /\brecord\b/.test(groupText) ||
    /\bband\b/.test(groupText) ||
    /\bsbt\b/.test(groupText) ||
    /\bdiscovery\b/.test(groupText) ||
    /\bespn\b/.test(groupText) ||
    /\bcanais 4k\b/.test(groupText) ||
    /\bcanais 24h\b/.test(groupText) ||
    /\bbbb\b/.test(groupText) ||
    /\bcopa\b/.test(groupText) ||
    /\bcopinha\b/.test(groupText)
  );
}

function isMixedGroup(groupText = "") {
  return (
    groupText.includes("filmes e series") ||
    groupText.includes("filmes & series") ||
    groupText.includes("movie and series") ||
    groupText.includes("movies and series") ||
    groupText.includes("filme e serie")
  );
}

function hasVodUrl(url = "") {
  const lower = normalizeText(url);
  return (
    lower.includes("/movie/") ||
    lower.includes("/series/") ||
    lower.includes("/vod/") ||
    /\.(mp4|mkv|avi|mov|m4v|mpg|mpeg|ts)(\?|$)/i.test(url)
  );
}

function looksLikePlainNumericStream(url = "") {
  const clean = String(url || "").trim();
  return /\/\d+(\?.*)?$/.test(clean);
}

function inferType(name = "", group = "", url = "", tvgName = "", tvgId = "") {
  const nameText = normalizeText(name);
  const groupText = normalizeText(group);
  const tvgNameText = normalizeText(tvgName);
  const tvgIdText = normalizeText(tvgId);
  const combined = `${nameText} ${groupText} ${tvgNameText} ${tvgIdText}`;

  let seriesScore = 0;
  let movieScore = 0;
  let liveScore = 0;

  // Série
  if (hasEpisodePattern(nameText)) seriesScore += 10;
  if (hasEpisodePattern(tvgNameText)) seriesScore += 8;
  if (isSeriesGroup(groupText) && !isMixedGroup(groupText)) seriesScore += 6;
  if (normalizeText(url).includes("/series/")) seriesScore += 8;

  // Filme
  if (hasMoviePattern(nameText)) movieScore += 7;
  if (hasMoviePattern(tvgNameText)) movieScore += 5;
  if (isMovieGroup(groupText) && !isMixedGroup(groupText)) movieScore += 6;
  if (normalizeText(url).includes("/movie/")) movieScore += 8;
  if (normalizeText(url).includes("/vod/")) movieScore += 7;

  // Live
  if (safeText(tvgId)) liveScore += 5;
  if (hasLiveNamePattern(nameText)) liveScore += 8;
  if (hasLiveNamePattern(tvgNameText)) liveScore += 6;
  if (isLiveGroup(groupText)) liveScore += 7;
  if (looksLikePlainNumericStream(url) && !hasVodUrl(url)) liveScore += 5;

  // Grupo misto não decide sozinho
  if (isMixedGroup(groupText)) {
    liveScore -= 1;
    movieScore -= 1;
    seriesScore -= 1;
  }

  // Se parece canal linear, reduz chance de filme/série
  if (hasLiveNamePattern(nameText) || hasLiveNamePattern(tvgNameText)) {
    movieScore -= 3;
    seriesScore -= 3;
  }

  // Se nome parece título puro de VOD, reduz live
  if (
    !hasLiveNamePattern(nameText) &&
    !safeText(tvgId) &&
    !isLiveGroup(groupText) &&
    (isMovieGroup(groupText) || hasMoviePattern(nameText) || hasEpisodePattern(nameText))
  ) {
    liveScore -= 4;
  }

  // Se grupo é coletânea/coleção, tender a movie, não live
  if (/\bcoletanea\b/.test(groupText) || /\bcolecao\b/.test(groupText)) {
    movieScore += 4;
    liveScore -= 3;
  }

  // Prioridade final
  if (seriesScore >= movieScore && seriesScore > liveScore && seriesScore >= 6) {
    return "series";
  }

  if (movieScore > seriesScore && movieScore > liveScore && movieScore >= 6) {
    return "movie";
  }

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
