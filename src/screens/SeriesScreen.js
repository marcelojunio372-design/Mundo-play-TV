import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../utils/constants";
import { SERIES } from "../data/mockData";
import VideoPlayer from "../components/VideoPlayer";
import { addRecent, getFavorites, getLanguage, getRecent, toggleFavorite } from "../utils/storage";
import { t } from "../utils/helpers";

export default function SeriesScreen({ onBack, onLogout }) {
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recent, setRecent] = useState([]);
  const [lang, setLang] = useState("pt");

  useEffect(() => {
    async function load() {
      setFavorites(await getFavorites("series"));
      setRecent(await getRecent("series"));
      setLang(await getLanguage());
    }
    load();
  }, []);

  async function openSeries(item) {
    setSelectedEpisode(item);
    setRecent(await addRecent("series", item));
  }

  async function handleToggleFavorite(item) {
    setFavorites(await toggleFavorite("series", item));
  }

  function isFavorite(item) {
    return favorites.some((x) => x.id === item.id);
  }

  if (selectedEpisode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedEpisode(null)}>
            <Text style={styles.btn}>{t(lang, "back")}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{selectedEpisode.title}</Text>

          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.btn}>{t(lang, "logout")}</Text>
          </TouchableOpacity>
        </View>

        <VideoPlayer url={selectedEpisode.url} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.btn}>{t(lang, "back")}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t(lang, "series")}</Text>

        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.btn}>{t(lang, "logout")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t(lang, "recent")}</Text>
        <FlatList
          horizontal
          data={recent}
          keyExtractor={(item) => `recent-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.smallCard} onPress={() => openSeries(item)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t(lang, "favorites")}</Text>
        <FlatList
          horizontal
          data={favorites}
          keyExtractor={(item) => `fav-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.smallCard} onPress={() => openSeries(item)}>
              <Text style={styles.cardTitle}>★ {item.title}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={SERIES}
        keyExtractor={(item) => item.id}
        numColumns={4}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openSeries(item)}>
            <Text style={styles.star} onPress={() => handleToggleFavorite(item)}>
              {isFavorite(item) ? "★" : "☆"}
            </Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    height: 80,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "bold" },
  btn: { color: COLORS.primary, fontSize: 18, fontWeight: "bold" },
  block: { paddingHorizontal: 20, paddingTop: 14 },
  blockTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800", marginBottom: 10 },
  grid: { padding: 20 },
  card: {
    flex: 1,
    margin: 10,
    height: 120,
    backgroundColor: COLORS.panel,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  smallCard: {
    width: 220,
    height: 80,
    backgroundColor: COLORS.panel2,
    marginRight: 10,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cardTitle: { color: COLORS.text, fontWeight: "bold", textAlign: "center" },
  star: {
    position: "absolute",
    top: 8,
    right: 10,
    color: "#ffd54a",
    fontSize: 24,
    fontWeight: "900",
    zIndex: 2,
  },
});
