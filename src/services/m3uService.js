function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function extractGroup(line = "") {
  const match = line.match(/group-title="([^"]*)"/i);
  return match?.[1] ? match[1].trim() : "OUTROS";
}

function extractName(line = "") {
  const index = line.indexOf(",");
  if (index >= 0) {
    return line.slice(index + 1).trim();
  }
  return "Sem nome";
}

function inferType(name = "", group = "", url = "") {
  const text = `${name} ${group} ${url}`.toLowerCase();

  if (
    text.includes("movie") ||
    text.includes("filme") ||
    text.includes("/movie/")
  ) {
    return "movie";
  }

  if (
    text.includes("series") ||
    text.includes("serie") ||
    text.includes("temporada") ||
    text.includes("/series/")
  ) {
    return "series";
  }

  return "live";
}

export async function loadM3U(url) {
  const response = await fetch(url);
  const text = await response.text();

  if (!text || !text.includes("#EXTM3U")) {
    throw new Error("Falha ao carregar lista");
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const live = [];
  const movies = [];
  const series = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.startsWith("#EXTINF")) continue;

    const name = extractName(line);
    const group = extractGroup(line);

    let streamUrl = "";

    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].startsWith("#")) {
        streamUrl = lines[j];
        i = j;
        break;
      }
    }

    if (!streamUrl) continue;

    const type = inferType(name, group, streamUrl);

    const item = {
      id: `${type}_${i}`,
      name,
      group,
      url: streamUrl,
      type,
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
  };
}

export default loadM3U;
