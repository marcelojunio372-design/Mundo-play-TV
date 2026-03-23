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
    .replace(/tvg-logo='[^']*'/gi, "")
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
    .split(/[-/|]+/g)
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

  const doubleQuoted = line.match(
    new RegExp(`${escaped}\\s*=\\s*"([^"]*)"`, "i")
  );
  if (doubleQuoted?.[1]) {
    return decodeEntities(doubleQuoted[1]);
  }

  const singleQuoted = line.match(
    new RegExp(`${escaped}\\s*=\\s*'([^']*)'`, "i")
  );
  if (singleQuoted?.[1]) {
    return decodeEntities(singleQuoted[1]);
  }

  const unquoted = line.match(
    new RegExp(`${escaped}\\s*=\\s*([^\\s,]+)`, "i")
  );
  if (unquoted?.[1]) {
    return decodeEntities(unquoted[1]);
  }

  return "";
}

function extractGroup(extinf = "") {
  const g1 = extractAttr(extinf, "group-title");
  if (g1) return safeText(g1);

  return "OUTROS";
}

function extractName(extinf = "") {
  const commaIndex = extinf.indexOf(",");
  if (commaIndex >= 0) {
    return cleanName(extinf.slice(commaIndex + 1));
  }
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

  if (/movie|filme|cinema|lançamento|lancamento|vod/.test(text)) {
    return safeText(name || "Conteúdo de filme.");
  }

  return safeText(name || "");
}

function inferType(name = "", group = "", url = "", tvgId = "", tvgName = "") {
  const urlText = safeText(url).toLowerCase();
  const metaText = `${name} ${group} ${tvgId} ${tvgName}`.toLowerCase();

  if (
    /\/series\//.test(urlText) ||
    /action=get_series/.test(urlText) ||
    /action=get_series_info/.test(urlText) ||
    /type=series/.test(urlText)
  ) {
    return "series";
  }

  if (
    /\/movie\//.test(urlText) ||
    /action=get_vod_stream/.test(urlText) ||
    /type=movie/.test(urlText) ||
    /\/vod\//.test(urlText)
  ) {
    return "movie";
  }

  if (/temporada|season|epis[oó]dio|s\d{1,2}e\d{1,2}/.test(metaText)) {
    return "series";
  }

  if (/filme sob demanda|vod filme|cat[aá]logo filme/.test(metaText)) {
    return "movie";
  }

  return "live";
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

function shouldKeepType(type, only = "all") {
  if (only === "all") return true;
  if (only === "live") return type === "live";
  if (only === "movie") return type === "movie";
  if (only === "series") return type === "series";
  return true;
}

function pushItemByType(type, item, live, movies, series) {
  if (type === "movie") {
    movies.push(item);
  } else if (type === "series") {
    series.push(item);
  } else {
    live.push(item);
  }
}

function iterateLines(text = "", onLine) {
  let buffer = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "\n") {
      const line = buffer.replace(/\r/g, "").trim();
      buffer = "";
      if (line) onLine(line);
    } else {
      buffer += char;
    }
  }

  const lastLine = buffer.replace(/\r/g, "").trim();
  if (lastLine) onLine(lastLine);
}

export async function loadM3U(url, options = {}) {
  const only = safeText(options.only || "all").toLowerCase();

  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok || !text) {
    throw new Error("Falha ao carregar lista");
  }

  if (!text.includes("#EXTM3U") && !text.includes("#EXTINF")) {
    throw new Error("Lista M3U inválida");
  }

  const live = [];
  const movies = [];
  const series = [];

  let currentExtinf = "";
  let index = 0;

  iterateLines(text, (line) => {
    if (line.startsWith("#EXTINF")) {
      currentExtinf = line;
      return;
    }

    if (line.startsWith("#")) {
      return;
    }

    if (!currentExtinf) {
      return;
    }

    const extinf = currentExtinf;
    currentExtinf = "";

    const streamUrl = line;
    const name = extractName(extinf);
    const group = extractGroup(extinf);
    const logo = extractLogo(extinf);
    const tvgId = extractTvgId(extinf);
    const tvgName = extractTvgName(extinf);
    const type = inferType(name, group, streamUrl, tvgId, tvgName);

    if (!shouldKeepType(type, only)) {
      index += 1;
      return;
    }

    const year = extractYear(name, group);
    const description = extractDescription(extinf, name, group);
    const aliases = buildChannelAliases(name, group, tvgId, tvgName);

    const item = {
      id: `${type}_${index}_${name}`.replace(/\s+/g, "_"),
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

    pushItemByType(type, item, live, movies, series);
    index += 1;
  });

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
