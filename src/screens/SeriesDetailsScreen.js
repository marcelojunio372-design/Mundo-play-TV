import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

function buildSeasonFromSeries(series) {
  const totalEpisodes = series?.episodes?.length || 0;

  const fallbackEpisodes =
    totalEpisodes > 0
      ? series.episodes
      : Array.from({ length: 8 }).map((_, index) => ({
          id: `ep_${index + 1}`,
          title: `${series.name} - S01E0${index + 1} - Episódio ${index + 1}`,
          description: "Descrição do episódio.",
          logo: series.logo,
          url: series.url,
          season: 1,
          episodeNumber: index + 1,
        }));

  return {
    id: "season_1",
    name: "Temporada 1",
    episodes: fallbackEpisodes,
  };
}

export default function SeriesDetailsScreen({ series, onBack, onOpenSeason }) {
  if (!series) return null;

  const season = buildSeasonFromSeries(series);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={series.logo ? { uri: series.logo } : undefined}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.overlay}>
          <Image
            source={series.logo ? { uri: series.logo } : undefined}
            style={styles.poster}
          />

          <View style={styles.infoWrap}>
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onOpenSeason(season)}
              >
                <Text style={styles.actionBtnText}>▶ assistir a temporada</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>★</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {series.name}
            </Text>

            <Text style={styles.meta} numberOfLines={2}>
              {(series.year || "-") + " • " + (series.group || "Séries")}
            </Text>

            <Text style={styles.desc} numberOfLines={7}>
              {series.description || "Sem descrição na lista."}
            </Text>

            <Text style={styles.episodesInfo}>
              Episódios disponíveis: {season.episodes.length}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080b12",
  },

  bg: {
    flex: 1,
  },

  bgImage: {
    opacity: 0.18,
  },

  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 20,
  },

  backText: {
    color: "#fff",
    fontSize: isPhone ? 24 : 30,
    fontWeight: "900",
  },

  overlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: isPhone ? 14 : 60,
    paddingBottom: isPhone ? 18 : 26,
    backgroundColor: "rgba(8,11,18,0.55)",
  },

  poster: {
    width: isPhone ? 92 : 200,
    height: isPhone ? 138 : 300,
    borderRadius: 14,
    backgroundColor: "#26354b",
  },

  infoWrap: {
    flex: 1,
    marginLeft: isPhone ? 14 : 28,
    backgroundColor: "rgba(44,22,58,0.58)",
    padding: isPhone ? 14 : 20,
    borderRadius: 16,
  },

  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  actionBtn: {
    height: isPhone ? 40 : 42,
    paddingHorizontal: isPhone ? 14 : 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    marginRight: 10,
    borderRadius: 10,
  },

  actionBtnText: {
    color: "#fff",
    fontSize: isPhone ? 11 : 16,
    fontWeight: "700",
  },

  iconBtn: {
    width: isPhone ? 40 : 42,
    height: isPhone ? 40 : 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },

  iconBtnText: {
    color: "#fff",
    fontSize: 20,
  },

  title: {
    color: "#fff",
    fontSize: isPhone ? 18 : 36,
    fontWeight: "900",
  },

  meta: {
    color: "#d9d0de",
    fontSize: isPhone ? 10 : 16,
    marginTop: 6,
  },

  desc: {
    color: "#f1edf4",
    fontSize: isPhone ? 10 : 16,
    marginTop: 12,
    lineHeight: isPhone ? 15 : 25,
  },

  episodesInfo: {
    color: "#38d7ff",
    fontSize: isPhone ? 10 : 15,
    marginTop: 12,
    fontWeight: "700",
  },
});
