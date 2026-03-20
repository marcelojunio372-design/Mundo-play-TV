import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
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
    const movieItems = movies.slice(0, 10).map((item) => ({
      ...item,
      mediaType: "movie",
    }));

    const seriesItems = series.slice(0, 10).map((item) => ({
      ...item,
      mediaType: "series",
    }));

    const combined = [...movieItems, ...seriesItems];

    if (combined.length > 0) return combined;

    return [
      {
        id: "fallback_home",
        name: "MUNDO PLAY TV",
        description: "Conteúdo carregado com sucesso. Abra Live TV, Filmes ou Séries.",
        logo: "",
        cover: "",
        backdrop: "",
        fanart: "",
        group: "Destaques",
        year: "-",
        mediaType: "movie",
      },
    ];
  }, [movies, series]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [featured.length]);

  useEffect(() => {
    if (!featured.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featured]);

  const item = featured[index] || featured[0] || null;

  const openFeatured = () => {
    if (!item) return;
    if (item.id === "fallback_home") return;

    if (item.mediaType === "series") {
      onSelectSeries?.(item);
    } else {
      onSelectMovie?.(item);
    }
  };

  const heroUri =
    item?.backdrop ||
    item?.cover ||
    item?.fanart ||
    item?.poster ||
    item?.logo ||
    "";

  const posterUri =
    item?.logo ||
    item?.poster ||
    item?.cover ||
    "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.brand}>MUNDO PLAY TV</Text>
        <Text style={styles.datetime}>
          {new Date().toLocaleTimeString("pt-BR")}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <Btn text="LIVE TV" onPress={onOpenLive} />
          <Btn text="FILMES" onPress={onOpenMovies} />
          <Btn text="SÉRIES" onPress={onOpenSeries} />
          <Btn text="CONFIG." onPress={onOpenSettings} />
          <Btn text="RECARREGAR" onPress={onReload} />
          <Btn text="SAIR" onPress={onLogout} />
        </View>

        <TouchableOpacity
          style={styles.main}
          onPress={openFeatured}
          activeOpacity={0.92}
          disabled={item?.id === "fallback_home"}
        >
          <ImageBackground
            source={heroUri ? { uri: heroUri } : undefined}
            style={styles.hero}
            imageStyle={styles.heroImage}
          >
            <View style={styles.overlay} />

            <View style={styles.heroContent}>
              {posterUri ? (
                <Image source={{ uri: posterUri }} style={styles.poster} />
              ) : (
                <View style={styles.posterFallback}>
                  <Text style={styles.posterFallbackText}>MUNDO{"\n"}PLAY TV</Text>
                </View>
              )}

              <View style={styles.info}>
                <Text style={styles.type}>
                  {item?.mediaType === "series" ? "SÉRIE" : "FILME"}
                </Text>

                <Text style={styles.title} numberOfLines={2}>
                  {item?.name || "MUNDO PLAY TV"}
                </Text>

                <Text style={styles.meta} numberOfLines={1}>
                  {(item?.year || "-") + " • " + (item?.group || "Destaques")}
                </Text>

                <Text style={styles.desc} numberOfLines={4}>
                  {item?.description || "Conteúdo disponível"}
                </Text>

                <View style={styles.button}>
                  <Text style={styles.buttonText}>
                    {item?.id === "fallback_home" ? "CONTEÚDO PRONTO" : "TOQUE PARA ABRIR"}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const Btn = ({ text, onPress }) => (
  <TouchableOpacity style={styles.sideBtn} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.sideText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111e",
  },

  topbar: {
    height: isPhone ? 56 : 70,
    backgroundColor: "#0c1c2c",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  brand: {
    color: "#fff",
    fontSize: isPhone ? 18 : 24,
    fontWeight: "900",
  },

  datetime: {
    color: "#9eb3c7",
    fontSize: isPhone ? 10 : 12,
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: isPhone ? 110 : 150,
    backgroundColor: "#061522",
    padding: 10,
  },

  sideBtn: {
    backgroundColor: "#0b1b2b",
    paddingVertical: isPhone ? 14 : 16,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  sideText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: isPhone ? 10 : 14,
  },

  main: {
    flex: 1,
    padding: isPhone ? 10 : 14,
  },

  hero: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "#09111d",
  },

  heroImage: {
    resizeMode: "cover",
    opacity: 0.72,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isPhone ? 18 : 28,
    paddingVertical: isPhone ? 18 : 26,
  },

  poster: {
    width: isPhone ? 105 : 160,
    height: isPhone ? 155 : 235,
    borderRadius: 12,
    marginRight: isPhone ? 16 : 24,
    backgroundColor: "#132235",
  },

  posterFallback: {
    width: isPhone ? 105 : 160,
    height: isPhone ? 155 : 235,
    borderRadius: 12,
    marginRight: isPhone ? 16 : 24,
    backgroundColor: "#132235",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },

  posterFallbackText: {
    color: "#38d7ff",
    fontWeight: "900",
    textAlign: "center",
    fontSize: isPhone ? 16 : 22,
  },

  info: {
    flex: 1,
  },

  type: {
    color: "#38d7ff",
    fontSize: isPhone ? 12 : 15,
    fontWeight: "900",
    marginBottom: 6,
  },

  title: {
    color: "#fff",
    fontSize: isPhone ? 24 : 40,
    fontWeight: "900",
    marginBottom: 8,
  },

  meta: {
    color: "#d0d9e2",
    fontSize: isPhone ? 12 : 16,
    marginBottom: 10,
  },

  desc: {
    color: "#f0f4f8",
    fontSize: isPhone ? 14 : 18,
    lineHeight: isPhone ? 20 : 26,
    marginBottom: 20,
  },

  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: "#38d7ff",
    backgroundColor: "rgba(56,215,255,0.08)",
  },

  buttonText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: isPhone ? 14 : 18,
  },
});
