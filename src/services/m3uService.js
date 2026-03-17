function normalizeUrl(rawUrl) {
  let url = (rawUrl || "").trim();
  url = url.replace(/^['"]+|['"]+$/g, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "http://" + url;
  }
  return url;
}

function getAttr(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function getYearFromName(name) {
  const match = (name || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function isSeriesName(name) {
  return /s\d{1,2}e\d{1,2}|temporada|epis[oó]dio/i.test(name || "");
}

function detectType(item) {
  const group = (item.group || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const url = (item.url || "").toLowerCase();

  const liveWords =
    /tv|live|ao vivo|canal|canais|abertos|esportes|not[ií]cias|document[aá]rios|infantis|religiosos|variedades|globo|record|sbt|band|discovery|sportv|espn|premiere|telecine|hbo/.test(
      group
    );

  const movieWords =
    /filmes|filme|movie|movies|cinema|lançamentos|lancamentos|ação|acao|com[eé]dia|drama|terror|suspense|anima[cç][aã]o/.test(
      group
    );

  const seriesWords =
    /s[eé]ries|series|serie|temporadas|epis[oó]dios|novelas/.test(group) ||
    isSeriesName(name);

  const vodByUrl =
    url.includes("/movie/") ||
    url.includes("/series/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".mkv") ||
    url.endsWith(".avi") ||
    url.endsWith(".mpeg") ||
    url.endsWith(".mpg");

  if (seriesWords) return "series";
  if (movieWords && !liveWords) return "movies";
  if (liveWords && !vodByUrl) return "live";

  if (url.includes("/series/")) return "series";
  if (url.includes("/movie/")) return "movies";

  // se for grupo "filmes e series", manda para movies
  if (/filmes e series|filmes & series|filmes\/series/.test(group)) return "movies";

  return "live";
}

export async function loadM3U(rawUrl) {
  const url = normalizeUrl(rawUrl);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Não foi possível carregar a lista M3U");
  }

  const text = await res.text();
  const lines = text.split("\n");

  const channels = [];
  const movies = [];
  const series = [];

  let current = null;
  let count = 0;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const titlePart = line.includes(",")
        ? line.split(",").slice(1).join(",").trim()
        : `Item ${count + 1}`;

      current = {
        id: `m3u_${count++}`,
        name: titlePart,
        title: titlePart,
        group: getAttr(line, "group-title") || "OUTROS",
        logo: getAttr(line, "tvg-logo") || "",
        epgId: getAttr(line, "tvg-id") || "",
        description: getAttr(line, "description") || "",
        year: getYearFromName(titlePart),
        url: "",
      };
      continue;
    }

    if (line.startsWith("http://") || line.startsWith("https://")) {
      if (!current) continue;

      current.url = line;
      const type = detectType(current);

      if (type === "movies") movies.push(current);
      else if (type === "series") series.push(current);
      else channels.push(current);

      current = null;
    }
  }

  return { channels, movies, series };
}
