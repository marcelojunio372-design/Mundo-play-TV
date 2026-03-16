function normalizeUrl(rawUrl) {
  let url = (rawUrl || "").trim();

  url = url.replace(/^['"]+|['"]+$/g, "");

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
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

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith("#EXTINF")) {
      const name = line.includes(",") ? line.split(",").slice(1).join(",").trim() : "Sem nome";

      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);

      const group = groupMatch ? groupMatch[1] : "Outros";
      const logo = logoMatch ? logoMatch[1] : "";

      current = {
        id: String(Date.now() + Math.random()),
        name,
        title: name,
        group,
        logo,
        url: "",
      };
    } else if (line.startsWith("http")) {
      if (!current) continue;

      current.url = line;

      const groupLower = (current.group || "").toLowerCase();
      const nameLower = (current.name || "").toLowerCase();

      if (
        groupLower.includes("movie") ||
        groupLower.includes("filme") ||
        nameLower.includes("mp4") ||
        nameLower.includes("mkv")
      ) {
        movies.push(current);
      } else if (
        groupLower.includes("series") ||
        groupLower.includes("série") ||
        groupLower.includes("serie")
      ) {
        series.push(current);
      } else {
        channels.push(current);
      }

      current = null;
    }
  }

  return {
    channels,
    movies,
    series,
  };
}
