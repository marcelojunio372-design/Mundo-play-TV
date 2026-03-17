import { Alert } from "react-native";

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
  if (g1) return g1;

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

function inferType(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  const isSeries =
    /s\d{1,2}e\d{1,2}|temporada|epis[oó]dio|novelas|séries|series|serie/.test(text);

  const isMovie =
    /filmes|filme|movie|cinema|lançamento|lancamento|ação|acao|com[eé]dia|drama|terror|suspense|romance|anima[cç][aã]o/.test(
      text
    );

  const isLive =
    /tv|ao vivo|canal|abertos|esportes|not[ií]cias|document[aá]rios|religiosos|variedades|globo|sbt|record|band/.test(
      text
    );

  if (isSeries && !isLive) return "series";
  if (isMovie && !isLive) return "movie";
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

    const item = {
      id: `${type}_${i}_${name}`,
      name,
      group,
      logo,
      url: streamUrl,
      type,
      year: "",
      description: "",
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
