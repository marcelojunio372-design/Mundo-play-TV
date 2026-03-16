import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  FAVORITES_MOVIES: "favorites_movies",
  FAVORITES_SERIES: "favorites_series",
  FAVORITES_LIVE: "favorites_live",
  RECENT_MOVIES: "recent_movies",
  RECENT_SERIES: "recent_series",
  RECENT_LIVE: "recent_live",
  APP_LANGUAGE: "app_language",
};

async function readJson(key, fallback = []) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function getFavorites(type) {
  if (type === "movies") return await readJson(KEYS.FAVORITES_MOVIES);
  if (type === "series") return await readJson(KEYS.FAVORITES_SERIES);
  return await readJson(KEYS.FAVORITES_LIVE);
}

export async function toggleFavorite(type, item) {
  const list = await getFavorites(type);
  const exists = list.some((x) => x.id === item.id);

  const updated = exists
    ? list.filter((x) => x.id !== item.id)
    : [item, ...list];

  if (type === "movies") await writeJson(KEYS.FAVORITES_MOVIES, updated);
  else if (type === "series") await writeJson(KEYS.FAVORITES_SERIES, updated);
  else await writeJson(KEYS.FAVORITES_LIVE, updated);

  return updated;
}

export async function getRecent(type) {
  if (type === "movies") return await readJson(KEYS.RECENT_MOVIES);
  if (type === "series") return await readJson(KEYS.RECENT_SERIES);
  return await readJson(KEYS.RECENT_LIVE);
}

export async function addRecent(type, item) {
  const list = await getRecent(type);
  const filtered = list.filter((x) => x.id !== item.id);
  const updated = [item, ...filtered].slice(0, 20);

  if (type === "movies") await writeJson(KEYS.RECENT_MOVIES, updated);
  else if (type === "series") await writeJson(KEYS.RECENT_SERIES, updated);
  else await writeJson(KEYS.RECENT_LIVE, updated);

  return updated;
}

export async function getLanguage() {
  try {
    return (await AsyncStorage.getItem(KEYS.APP_LANGUAGE)) || "pt";
  } catch {
    return "pt";
  }
}

export async function setLanguage(lang) {
  try {
    await AsyncStorage.setItem(KEYS.APP_LANGUAGE, lang);
  } catch {}
}
``
