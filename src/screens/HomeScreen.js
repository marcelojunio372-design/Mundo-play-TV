import React, { useMemo, useState } from "react";
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
}) {
  const movies = session?.data?.movies || [];
  const series = session?.data?.series || [];

  const featured = useMemo(() => {
    const combined = [...movies.slice(0, 3), ...series.slice(0, 3)];
    return combined.length
      ? combined
      : [
          {
            name: "MUNDO PLAY TV",
            description: "Streaming profissional",
            logo: "",
            group: "Destaques",
          },
        ];
  }, [movies, series]);

  const [index, setIndex] = useState(0);
  const item = featured[index] || featured[0];

  const nextBanner = () => {
    setIndex((prev) => (prev + 1) % featured.length);
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
          <TouchableOpacity activeOpacity={0.9} onPress={nextBanner}>
            <ImageBackground
              source={item?.logo ? { uri: item.logo } : undefined}
              style={styles.hero}
              imageStyle={styles.heroImage}
            >
              <View style={styles.heroOverlay}>
                <Text style={styles.heroType}>
                  {series.includes(item) ? "SÉRIE" : "FILME"}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {item?.name || "MUNDO PLAY TV"}
                </Text>
                <Text style={styles.heroSub} numberOfLines={2}>
                  {item?.group || "Lançamentos e destaques"}
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.grid}>
            <TouchableOpacity style={styles.card} onPress={onOpenLive}>
              <Text style={styles.cardTitle}>Live TV</Text>
              <Text style={styles.cardText}>Canais ao vivo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={onOpenMovies}>
              <Text style={styles.cardTitle}>Filmes</Text>
              <Text style={styles.cardText}>Catálogo e detalhes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={onOpenSeries}>
              <Text style={styles.cardTitle}>Séries</Text>
              <Text style={styles.cardText}>Temporadas e episódios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={onOpenSettings}>
              <Text style={styles.cardTitle}>Config.</Text>
              <Text style={styles.cardText}>Idiomas e validade</Text>
            </TouchableOpacity>
          </View>
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

  hero: {
    height: isPhone ? 130 : 220,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0c2133",
    marginBottom: 12,
  },

  heroImage: {
    borderRadius: 18,
    opacity: 0.55,
  },

  heroOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(4,13,22,0.45)",
  },

  heroType: {
    color: "#38d7ff",
    fontSize: isPhone ? 10 : 14,
    fontWeight: "900",
    marginBottom: 4,
  },

  heroTitle: {
    color: "#fff",
    fontSize: isPhone ? 22 : 34,
    fontWeight: "900",
  },

  heroSub: {
    color: "#c4d1de",
    fontSize: isPhone ? 10 : 14,
    marginTop: 6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48.5%",
    minHeight: isPhone ? 84 : 110,
    borderRadius: 16,
    backgroundColor: "#0b1b2b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    marginBottom: 10,
  },

  cardTitle: {
    color: "#38d7ff",
    fontSize: isPhone ? 14 : 22,
    fontWeight: "900",
  },

  cardText: {
    color: "#d7e0ea",
    fontSize: isPhone ? 10 : 14,
    marginTop: 6,
  },
});
