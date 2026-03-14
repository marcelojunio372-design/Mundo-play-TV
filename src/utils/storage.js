import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "mundoplaytv:favorites";
const HISTORY_KEY = "mundoplaytv:history";
const CONTINUE_KEY = "mundoplaytv:continue";

export async function getFavorites() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(items) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items || []));
}

export async function toggleFavorite(item, section = "live") {
  const current = await getFavorites();
  const id = `${section}:${item?.id}`;

  const exists = current.some((x) => x?.favId === id);

  let next;
  if (exists) {
    next = current.filter((x) => x?.favId !== id);
  } else {
    next = [
      {
        ...item,
        favId: id,
        section,
        savedAt: Date.now(),
      },
      ...current,
    ];
  }

  await saveFavorites(next);
  return next;
}

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(items) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items || []));
}

export async function addToHistory(item, section = "live") {
  const current = await getHistory();
  const id = `${section}:${item?.id}`;

  const filtered = current.filter((x) => x?.historyId !== id);

  const next = [
    {
      ...item,
      historyId: id,
      section,
      watchedAt: Date.now(),
    },
    ...filtered,
  ].slice(0, 50);

  await saveHistory(next);
  return next;
}

export async function getContinueWatching() {
  try {
    const raw = await AsyncStorage.getItem(CONTINUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveContinueWatching(items) {
  await AsyncStorage.setItem(CONTINUE_KEY, JSON.stringify(items || []));
}

export async function updateContinueWatching(item, section = "live", positionMillis = 0, durationMillis = 0) {
  const current = await getContinueWatching();
  const id = `${section}:${item?.id}`;

  const filtered = current.filter((x) => x?.continueId !== id);

  const next = [
    {
      ...item,
      continueId: id,
      section,
      positionMillis,
      durationMillis,
      updatedAt: Date.now(),
    },
    ...filtered,
  ].slice(0, 50);

  await saveContinueWatching(next);
  return next;
}


