import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from "react-native";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onReload,
  onLogout,
  onSelectMovie,
  onSelectSeries,
}) {
  const movies = session?.data?.movies || [];
  const series = session?.data?.series || [];

  const featured = useMemo(() => {
    const movieItems = movies.slice(0, 5).map((item) => ({
      ...item,
      mediaType: "movie",
    }));

    const seriesItems = series.slice(0, 5).map((item) => ({
      ...item,
      mediaType: "series",
    }));

    const combined = [...movieItems, ...seriesItems];

    if (combined.length > 0) return combined;

    return [
      {
        id: "fallback_home",
        name: "MUNDO PLAY TV",
        description: "Streaming profissional",
        logo: "",
        group: "Lançamentos e destaques",
        year: "",
        mediaType: "movie",
      },
    ];
  }, [movies, series]);

  const [index, setIndex] = useState(0);

  const item = featured[index] || featured[0];

  useEffect(() => {
    if (!featured.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featured]);

  const openFeatured = () => {
    if (!item) return;

    if (item.mediaType === "series") {
      onSelectSeries?.(item);
      return;
    }

    onSelectMovie?.(item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>MUNDO PLAY TV</Text>
          <Text style={styles.subbrand}>IPTV Profissional</Text>
        </View>

        <View>
          <Text style={styles.datetime}>
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            {new Date().toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sideBtn} onPress={onOpenLive}>
            <Text style={styles.sideBtnText}>LIVE TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={onOpenMovies}>
            <Text style={styles.sideBtnText}>FILMES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={onOpenSeries}>
            <Text style={styles.sideBtnText}>SÉRIES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={onOpenSettings}>
            <Text style={styles.sideBtnText}>CONFIG.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={async () => {
              await onReload?.();
            }}
          >
            <Text style={styles.sideBtnText}>RECARREGAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={onLogout}>
            <Text style={styles.sideBtnText}>SAIR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.main}>
          <TouchableOpacity
            activeOpacity={0.92}
            style={styles.heroTouch}
            onPress={openFeatured}
          >
            <ImageBackground
              source={item?.logo ? { uri: item.logo } : undefined}
              style={styles.hero}
              imageStyle={styles.heroImage}
            >
              <View style={styles.heroOverlay}>
                <Text style={styles.heroType}>
                  {item?.mediaType === "series" ? "SÉRIE" : "FILME"}
                </Text>

                <Text style={styles.heroTitle} numberOfLines={2}>
                  {item?.name || "MUNDO PLAY TV"}
                </Text>

                <Text style={styles.heroMeta} numberOfLines={1}>
                  {(item?.year || "-") + " • " + (item?.group || "Destaques")}
                </Text>

                <Text style={styles.heroDesc} numberOfLines={4}>
                  {item?.description || "Lançamentos e destaques da sua lista."}
                </Text>

                <View style={styles.heroAction}>
                  <Text style={styles.heroActionText}>
                    TOQUE PARA ABRIR
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111e",
  },

  topbar: {
    height: isPhone ? 54 : 70,
    backgroundColor: "#0c1c2c",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    color: "#fff",
    fontSize: isPhone ? 16 : 24,
    fontWeight: "900",
  },

  subbrand: {
    color: "#9eb3c7",
    fontSize: isPhone ? 8 : 12,
    marginTop: 2,
  },

  datetime: {
    color: "#d8e2ed",
    fontSize: isPhone ? 8 : 12,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: isPhone ? 96 : 150,
    backgroundColor: "#061522",
    padding: 10,
  },

  sideBtn: {
    height: isPhone ? 42 : 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0b1b2b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  sideBtnText: {
    color: "#fff",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
  },

  main: {
    flex: 1,
    padding: 10,
  },

  heroTouch: {
    flex: 1,
  },

  hero: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0c2133",
  },

  heroImage: {
    opacity: 0.58,
  },

  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: isPhone ? 18 : 28,
    backgroundColor: "rgba(4,13,22,0.38)",
  },

  heroType: {
    color: "#38d7ff",
    fontSize: isPhone ? 11 : 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  heroTitle: {
    color: "#fff",
    fontSize: isPhone ? 24 : 38,
    fontWeight: "900",
  },

  heroMeta: {
    color: "#d4dde7",
    fontSize: isPhone ? 11 : 15,
    marginTop: 8,
  },

  heroDesc: {
    color: "#eef3f8",
    fontSize: isPhone ? 12 : 16,
    lineHeight: isPhone ? 18 : 24,
    marginTop: 12,
    maxWidth: "70%",
  },

  heroAction: {
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: "rgba(56,215,255,0.16)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  heroActionText: {
    color: "#38d7ff",
    fontSize: isPhone ? 11 : 13,
    fontWeight: "900",
  },
});
