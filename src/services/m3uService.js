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

function hasVodUrl(url = "") {
  const lower = normalizeText(url);
  return (
    lower.includes("/movie/") ||
    lower.includes("/series/") ||
    lower.includes("/vod/")
  );
}

function looksLikePlainNumericStream(url = "") {
  const clean = String(url || "").trim();
  return /\/\d+(\?.*)?$/.test(clean);
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
    /\bcanais 24h\b/.test(groupText) ||
    /\bcanais 4k\b/.test(groupText) ||
    /\besportes\b/.test(groupText) ||
    /\bdocumentarios\b/.test(groupText) ||
    /\bnoticias\b/.test(groupText) ||
    /\breligiosos\b/.test(groupText) ||
    /\binfantil\b/.test(groupText) ||
    /\bglobo\b/.test(groupText) ||
    /\brecord\b/.test(groupText) ||
    /\bband\b/.test(groupText) ||
    /\bsbt\b/.test(groupText) ||
    /\bdiscovery\b/.test(groupText) ||
    /\bespn\b/.test(groupText) ||
    /\bbbb\b/.test(groupText) ||
    /\bcopinha\b/.test(groupText) ||
    /\bcopa\b/.test(groupText)
  );
}

function isBlockedFromLive(groupText = "", nameText = "", tvgNameText = "") {
  const joined = `${groupText} ${nameText} ${tvgNameText}`;

  return (
    /\bfilmes\b/.test(joined) ||
    /\bfilme\b/.test(joined) ||
    /\bmovies\b/.test(joined) ||
    /\bmovie\b/.test(joined) ||
    /\bseries\b/.test(joined) ||
    /\bserie\b/.test(joined) ||
    /\btemporadas\b/.test(joined) ||
    /\bepisodios\b/.test(joined) ||
    /\bepisodio\b/.test(joined) ||
    /\bnovelas\b/.test(joined) ||
    /\banimes\b/.test(joined) ||
    /\bcoletanea\b/.test(joined) ||
    /\bcolecao\b/.test(joined) ||
    /\blancamentos\b/.test(joined) ||
    /\blancamento\b/.test(joined) ||
    /\bdublado\b/.test(joined) ||
    /\blegendado\b/.test(joined) ||
    /\bdesenhos\b/.test(joined)
  );
}

function hasStrongLiveName(nameText = "", tvgNameText = "") {
  const joined = `${nameText} ${tvgNameText}`;

  return (
    /\b(fhd|hd|sd|uhd|4k)\b/.test(joined) ||
    /\b(tv|canal|channel)\b/.test(joined) ||
    /\b(a&e|animal planet|discovery|globo|record|band|sbt|espn|premiere|combate|telecine|hbo|cnn|nick|cartoon|disney|amc|agro|amazon sat|apple tv)\b/.test(
      joined
    )
  );
}

function inferType(name = "", group = "", url = "", tvgName = "", tvgId = "") {
  const nameText = normalizeText(name);
  const groupText = normalizeText(group);
  const tvgNameText = normalizeText(tvgName);
  const tvgIdText = normalizeText(tvgId);

  const blockedFromLive = isBlockedFromLive(groupText, nameText, tvgNameText);

  // 1) série tem prioridade máxima
  if (hasEpisodePattern(nameText) || hasEpisodePattern(tvgNameText)) {
    return "series";
  }

  if (normalizeText(url).includes("/series/")) {
    return "series";
  }

  if (isSeriesGroup(groupText) && !hasStrongLiveName(nameText, tvgNameText)) {
    return "series";
  }

  // 2) filme tem segunda prioridade
  if (normalizeText(url).includes("/movie/") || normalizeText(url).includes("/vod/")) {
    if (isSeriesGroup(groupText)) return "series";
    return "movie";
  }

  if (isMovieGroup(groupText) && !hasStrongLiveName(nameText, tvgNameText)) {
    return "movie";
  }

  if (hasMoviePattern(nameText) && !hasStrongLiveName(nameText, tvgNameText)) {
    return "movie";
  }

  // 3) live só entra se estiver claramente com cara de canal
  if (!blockedFromLive) {
    const hasLiveByGroup = isLiveGroup(groupText);
    const hasLiveByName = hasStrongLiveName(nameText, tvgNameText);
    const hasLiveById = !!safeText(tvgIdText);
    const hasLiveByUrl = looksLikePlainNumericStream(url) && !hasVodUrl(url);

    if (
      hasLiveByGroup ||
      (hasLiveByName && hasLiveById) ||
      (hasLiveByName && hasLiveByUrl)
    ) {
      return "live";
    }
  }

  // 4) fallback conservador:
  // se não ficou claramente live, joga para movie
  return "movie";
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
