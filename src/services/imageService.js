const API_KEY = "SUA_CHAVE_TMDB"; // vou te explicar abaixo

export async function fetchPoster(title) {
  try {
    const query = encodeURIComponent(title);

    const url = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}&language=pt-BR`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.results || json.results.length === 0) return null;

    const item = json.results[0];

    if (!item.poster_path) return null;

    return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
  } catch (e) {
    return null;
  }
}
