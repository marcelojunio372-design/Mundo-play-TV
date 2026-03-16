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

function detectType(item) {
  const group = (item.group || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const url = (item.url || "").toLowerCase();

  const movieWords = [
    "movie",
    "movies",
    "filme",
    "filmes",
    "vod",
    "cinema",
  ];

  const seriesWords = [
    "series",
    "serie",
    "série",
    "séries",
    "temporada",
    "episodio",
    "episódio",
    "novelas",
    "novela",
  ];

  const liveWords = [
    "tv",
    "live",
    "ao vivo",
    "canal",
    "canais",
    "abertos",
    "esporte",
    "noticias",
    "notícias",
  ];

  const isMovieGroup = movieWords.some((w) => group.includes(w));
  const isSeriesGroup = seriesWords.some((w) => group.includes(w));
  const isLiveGroup = liveWords.some((w) => group.includes(w));

  const isVodUrl =
    url.includes("/movie/") ||
    url.includes("/movies/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".mkv") ||
    url.endsWith(".avi");

  const isSeriesUrl =
    url.includes("/series/") ||
    name.includes("s0") ||
    name.includes("e0") ||
    name.match(/s\d{1,2}e\d{1,2}/);

  if (isSeriesGroup || isSeriesUrl) return "series";
  if (isMovieGroup || isVodUrl) return "movies";
  if (isLiveGroup) return "live";

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
      const name = line.includes(",")
        ? line.split(",").slice(1).join(",").trim()
        : `Item ${count + 1}`;

      current = {
        id: `m3u_${count++}`,
        name,
        title: name,
        group: getAttr(line, "group-title") || "Outros",
        logo: getAttr(line, "tvg-logo") || "",
        epgId: getAttr(line, "tvg-id") || "",
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

  return {
    channels,
    movies,
    series,
  };
}
