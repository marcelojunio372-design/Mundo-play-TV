function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cleanName(name = "") {
  return safeText(name)
    .replace(/\s+/g, " ")
    .replace(/tvg-logo="[^"]*"/gi, "")
    .trim();
}

function extractAttr(line = "", attr = "") {
  const match = line.match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return match ? match[1] : "";
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
  return (
    extractAttr(extinf, "tvg-logo") ||
    extractAttr(extinf, "logo") ||
    ""
  );
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

  if (/temporada|epis[oó]dio|s\d{1,2}e\d{1,2}/i.test(`${name} ${group}`)) {
    return "Conteúdo de série.";
  }

  if (/movie|filme|cinema|lançamento/i.test(`${name} ${group}`)) {
    return "Conteúdo de filme.";
  }

  return "";
}

function inferType(name = "", group = "", url = "") {
  const text = `${name} ${group}`.toLowerCase();
  const link = safeText(url).toLowerCase();

  const byMovieUrl =
    /\/movie\/|type=movie|action=get_vod_stream|\/vod\//i.test(link);

  const bySeriesUrl =
    /\/series\/|type=series|action=get_series|action=get_series_info/i.test(link);

  const byEpisodePattern =
    /s\d{1,2}e\d{1,2}|temporada|epis[oó]dio|season|novelas|séries|series|cap[ií]tulo/i.test(
      text
    );

  const byLivePattern =
    /tv|ao vivo|canal|abertos|esportes|not[ií]cias|document[aá]rios|religiosos|variedades|globo|sbt|record|band|discovery|fhd|hd|sd|uhd|4k/i.test(
      text
    );

  if (byMovieUrl) return "movie";
  if (bySeriesUrl) return "series";
  if (byEpisodePattern && !byLivePattern) return "series";
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
