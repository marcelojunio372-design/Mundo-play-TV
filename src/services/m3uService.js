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

function hasRealEpisodePattern(text = "") {
  return (
    /\bs\d{1,2}\s*e\d{1,3}\b/i.test(text) ||
    /\btemporada\s*\d+\s*episodio\s*\d+\b/i.test(text) ||
    /\bseason\s*\d+\s*episode\s*\d+\b/i.test(text) ||
    /\bepisode\s*\d+\b/i.test(text) ||
    /\bepisodio\s*\d+\b/i.test(text)
  );
}

function isMovieGroup(groupText = "") {
  return (
    /\bfilmes\b/.test(groupText) ||
    /\bfilme\b/.test(groupText) ||
    /\bmovies\b/.test(groupText) ||
    /\bmovie\b/.test(groupText) ||
    /\bespecial\b/.test(groupText) ||
    /\bcoletanea\b/.test(groupText) ||
    /\bcoletania\b/.test(groupText) ||
    /\bcolecao\b/.test(groupText) ||
    /\blancamentos\b/.test(groupText) ||
    /\blancamento\b/.test(groupText) ||
    /\blegendados\b/.test(groupText) ||
    /\blegendado\b/.test(groupText) ||
    /\bdublado\b/.test(groupText) ||
    /\bdrama\b/.test(groupText) ||
    /\bacao\b/.test(groupText) ||
    /\bcomedia\b/.test(groupText) ||
    /\bterror\b/.test(groupText) ||
    /\bfamilia\b/.test(groupText) ||
    /\bfaroeste\b/.test(groupText) ||
    /\banimacao\b/.test(groupText) ||
    /\bcrime\b/.test(groupText) ||
    /\bromance\b/.test(groupText) ||
    /\bthriller\b/.test(groupText) ||
    /\bficcao\b/.test(groupText) ||
    /\bxxx\b/.test(groupText)
  );
}

function isSeriesGroup(groupText = "") {
  return (
    /\bseries\b/.test(groupText) ||
    /\bserie\b/.test(groupText) ||
    /\btemporadas\b/.test(groupText) ||
    /\bnovelas\b/.test(groupText) ||
    /\banimes\b/.test(groupText)
  );
}

function looksLikeMovieUrl(url = "") {
  const clean = String(url || "").trim().toLowerCase();
  return clean.includes("/movie/");
}

function looksLikeSeriesUrl(url = "") {
  const clean = String(url || "").trim().toLowerCase();
  return clean.includes("/series/");
}

function looksLikeLiveUrl(url = "") {
  const clean = String(url || "").trim();
  return /^https?:\/\/[^/]+\/[^/]+\/[^/]+\/\d+(\?.*)?$/i.test(clean);
}

function looksLikeTmdbLogo(logo = "") {
  return String(logo || "").toLowerCase().includes("image.tmdb.org");
}

function inferType(name = "", group = "", url = "", tvgName = "", tvgId = "", logo = "") {
  const nameText = normalizeText(name);
  const groupText = normalizeText(group);
  const tvgNameText = normalizeText(tvgName);

  // 1) URL manda primeiro e na ordem certa
  if (looksLikeSeriesUrl(url)) {
    return "series";
  }

  if (looksLikeMovieUrl(url)) {
    return "movie";
  }

  if (looksLikeLiveUrl(url)) {
    return "live";
  }

  // 2) Apoio por padrão forte
  if (hasRealEpisodePattern(nameText) || hasRealEpisodePattern(tvgNameText)) {
    return "series";
  }

  if (looksLikeTmdbLogo(logo)) {
    return "movie";
  }

  if (isMovieGroup(groupText)) {
    return "movie";
  }

  if (isSeriesGroup(groupText)) {
    return "series";
  }

  // 3) Fallback final
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

      const type = inferType(name, group, streamUrl, tvgName, tvgId, logo);

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
