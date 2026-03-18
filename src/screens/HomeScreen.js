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
        description: "Lançamentos e destaques da sua lista.",
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
    if (!featured.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featured]);

  const item = featured[index] || featured[0] || null;

  const openFeatured = () => {
    if (!item) return;

    if (item.mediaType === "series") {
      onSelectSeries?.(item);
    } else {
      onSelectMovie?.(item);
    }
  };

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

        <TouchableOpacity style={styles.main} onPress={openFeatured} activeOpacity={0.92}>
          <ImageBackground
            source={{
              uri:
                item?.cover ||
                item?.backdrop ||
                item?.fanart ||
                item?.poster ||
                item?.logo ||
                "https://i.imgur.com/6Z8FQ0C.jpg",
            }}
            style={styles.hero}
            imageStyle={styles.heroImage}
          >
            <View style={styles.overlay} />

            <View style={styles.heroContent}>
              <Image
                source={{
                  uri:
                    item?.logo ||
                    item?.poster ||
                    item?.cover ||
                    item?.backdrop ||
                    "https://i.imgur.com/6Z8FQ0C.jpg",
                }}
                style={styles.poster}
              />

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

                <Text style={styles.desc} numberOfLines={3}>
                  {item?.description || "Conteúdo disponível"}
                </Text>

                <View style={styles.button}>
                  <Text style={styles.buttonText}>TOQUE PARA ABRIR</Text>
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
  <TouchableOpacity style={styles.sideBtn} onPress={onPress}>
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
  },

  heroImage: {
    resizeMode: "cover",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.40)",
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

  info: {
    flex: 1,
    backgroundColor: "rgba(18,22,34,0.30)",
    borderRadius: 16,
    padding: isPhone ? 14 : 20,
    maxWidth: isPhone ? "58%" : "62%",
  },

  type: {
    color: "#38d7ff",
    fontWeight: "900",
    marginBottom: 6,
    fontSize: isPhone ? 11 : 15,
  },

  title: {
    color: "#fff",
    fontSize: isPhone ? 24 : 36,
    fontWeight: "900",
  },

  meta: {
    color: "#d8e2ed",
    marginTop: 8,
    fontSize: isPhone ? 11 : 14,
  },

  desc: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: isPhone ? 12 : 16,
    lineHeight: isPhone ? 18 : 24,
  },

  button: {
    marginTop: 18,
    borderColor: "#38d7ff",
    borderWidth: 1,
    paddingVertical: isPhone ? 10 : 12,
    paddingHorizontal: isPhone ? 16 : 18,
    borderRadius: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(56,215,255,0.12)",
  },

  buttonText: {
    color: "#38d7ff",
    fontWeight: "900",
    fontSize: isPhone ? 12 : 13,
  },
});
