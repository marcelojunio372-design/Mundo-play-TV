function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function decodeEntities(text = "") {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanName(name = "") {
  return decodeEntities(safeText(name))
    .replace(/\s+/g, " ")
    .replace(/tvg-logo="[^"]*"/gi, "")
    .trim();
}

function extractAttr(line = "", attr = "") {
  const match = line.match(new RegExp(`${attr}="([^"]*)"`, "i"));
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

function isLiveByGroup(group = "") {
  const text = safeText(group).toLowerCase();

  return /abertos|esportes|not[ií]cias|document[aá]rios|religiosos|variedades|globo|sbt|record|band|discovery|canais|ao vivo|tv ao vivo|24h|fhd|hd|sd|uhd|4k/.test(
    text
  );
}

function isSeriesByText(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  return /series|séries|temporada|epis[oó]dio|season|cap[ií]tulo|s\d{1,2}e\d{1,2}|novelas/.test(
    text
  );
}

function isMovieByText(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  return /movie|filme|cinema|vod|lançamento|ação|terror|drama|romance|com[eé]dia|anima[cç][aã]o/.test(
    text
  );
}

function shouldForceLive(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  if (/warner channel|hbo|telecine|premiere|sportv|discovery|history|tnt|space|megapix|canal brasil|globo|sbt|record|band|multishow|gnt|viva|fox|fx|sony|axn|a&e|amc|agrobrasil|amazon sat|all sports/.test(text)) {
    return true;
  }

  if (/\bhd\b|\bsd\b|\bfhd\b|\buhd\b|\b4k\b/.test(text)) {
    return true;
  }

  if (/\/live\//.test(text)) {
    return true;
  }

  return false;
}

function inferType(name = "", group = "", url = "") {
  const link = safeText(url).toLowerCase();
  const groupText = safeText(group).toLowerCase();

  const byMovieUrl =
    /\/movie\/|type=movie|action=get_vod_stream|\/vod\//i.test(link);

  const bySeriesUrl =
    /\/series\/|type=series|action=get_series|action=get_series_info/i.test(
      link
    );

  const liveGroupForced =
    /abertos|esportes|not[ií]cias|document[aá]rios|religiosos|variedades|globo|sbt|record|band|discovery|ao vivo|tv ao vivo|24h|canais 24h/.test(
      groupText
    );

  if (shouldForceLive(name, group, url)) return "live";
  if (byMovieUrl) return "movie";
  if (bySeriesUrl) return "series";
  if (liveGroupForced) return "live";
  if (isSeriesByText(name, group, url) && !isLiveByGroup(group)) return "series";
  if (isMovieByText(name, group, url) && !isLiveByGroup(group)) return "movie";

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
    const type = inferType(name, group, streamUrl);
    const year = extractYear(name, group);
    const description = extractDescription(extinf, name, group);

    const item = {
      id: `${type}_${i}_${name}`.replace(/\s+/g, "_"),
      name,
      group,
      logo,
      url: streamUrl,
      type,
      year,
      description,
    };

    if (type === "movie") {
      movies.push(item);
    } else if (type === "series") {
      series.push(item);
    } else {
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
