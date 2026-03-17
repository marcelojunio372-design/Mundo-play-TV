import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import VideoPlayer from "../components/VideoPlayer";

function buildMovieCategories(movies) {
  const grouped = {};

  movies.forEach((item) => {
    const group = item.group || "OUTROS";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const categories = [
    { id: "all", name: "TODOS", items: movies },
    { id: "fav", name: "FAVORITOS", items: [] },
    { id: "last", name: "VISTO POR ÚLTIMO", items: [] },
  ];

  Object.keys(grouped).forEach((group, index) => {
    categories.push({
      id: `movie_group_${index}`,
      name: group.toUpperCase(),
      items: grouped[group],
    });
  });

  return categories;
}

export default function MoviesScreen({ session, onBack, onOpenSettings, onLogout }) {
  const rawMovies = session?.data?.movies || [];

  const movies = useMemo(() => {
    return rawMovies.filter((item) => {
      const group = (item.group || "").toLowerCase();
      const name = (item.name || "").toLowerCase();

      const seemsLive =
        /tv|ao vivo|canal|abertos|esportes|not[ií]cias|document[aá]rios|religiosos|variedades/.test(group) &&
        !/filme|movie|cinema|lançamento|lancamento|ação|acao|com[eé]dia|drama|terror|suspense/.test(group);

      if (seemsLive) return false;
      if (/s\d{1,2}e\d{1,2}|temporada|epis[oó]dio/.test(name)) return false;

      return true;
    });
  }, [rawMovies]);

  const categories = useMemo(() => buildMovieCategories(movies), [movies]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const visibleMovies = categories[selectedCategory]?.items || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBtn}>VOLTAR</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>FILMES</Text>

        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.headerBtn}>SAIR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const active = selectedCategory === index;
              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => setSelectedCategory(index)}
                >
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.categoryCount, active && styles.categoryTextActive]}>
                    {item.items.length}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.gridPanel}>
          <FlatList
            data={visibleMovies}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            numColumns={3}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedMovie(item);
                  setShowDetails(true);
                }}
              >
                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.poster} />
                ) : (
                  <View style={styles.posterFallback} />
                )}

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name || "Sem nome"}
                </Text>

                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.group || "Filme"}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <Modal visible={showDetails} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              {selectedMovie?.logo ? (
                <Image source={{ uri: selectedMovie.logo }} style={styles.detailCover} />
              ) : (
                <View style={styles.detailCoverFallback} />
              )}

              <Text style={styles.detailTitle}>{selectedMovie?.name || "Sem nome"}</Text>
              <Text style={styles.detailText}>Ano: {selectedMovie?.year || "-"}</Text>
              <Text style={styles.detailText}>Grupo: {selectedMovie?.group || "-"}</Text>
              <Text style={styles.detailText}>
                Descrição: {selectedMovie?.description || "Sem descrição na lista"}
              </Text>

              <TouchableOpacity
                style={styles.mainBtn}
                onPress={() => {
                  setShowDetails(false);
                  setShowPlayer(true);
                }}
              >
                <Text style={styles.mainBtnText}>ABRIR PLAYER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondBtn}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.secondBtnText}>FECHAR</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPlayer} animationType="slide">
        <SafeAreaView style={styles.playerScreen}>
          <View style={styles.playerHeader}>
            <TouchableOpacity
              style={styles.secondBtn}
              onPress={() => setShowPlayer(false)}
            >
              <Text style={styles.secondBtnText}>FECHAR PLAYER</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.playerWrap}>
            <VideoPlayer
              url={selectedMovie?.url}
              title={selectedMovie?.name}
              brand="MUNDO PLAY TV"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },

  header: {
    height: 42,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBtn: { color: "#38d7ff", fontSize: 8, fontWeight: "900" },
  headerTitle: { color: "#fff", fontSize: 13, fontWeight: "900" },

  content: { flex: 1, flexDirection: "row", padding: 4 },

  leftPanel: {
    width: 96,
    paddingRight: 4,
  },

  categoryRow: {
    minHeight: 32,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  categoryActive: {
    backgroundColor: "#6de9ea",
    borderRadius: 4,
  },

  categoryText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "800",
    flex: 1,
    marginRight: 4,
  },

  categoryTextActive: { color: "#0d2340" },
  categoryCount: { color: "#fff", fontSize: 7, fontWeight: "800" },

  gridPanel: {
    flex: 1,
    paddingHorizontal: 4,
  },

  card: {
    width: "31%",
    marginHorizontal: "1%",
    marginBottom: 8,
  },

  poster: {
    width: "100%",
    height: 92,
    borderRadius: 8,
    backgroundColor: "#243a57",
    marginBottom: 4,
  },

  posterFallback: {
    width: "100%",
    height: 92,
    borderRadius: 8,
    backgroundColor: "#243a57",
    marginBottom: 4,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },

  cardSub: {
    color: "#9fb2c7",
    fontSize: 7,
    marginTop: 2,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },

  modalBox: {
    width: "94%",
    maxHeight: "92%",
    backgroundColor: "#0d1b2a",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  detailCover: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#243a57",
    marginBottom: 10,
  },

  detailCoverFallback: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#243a57",
    marginBottom: 10,
  },

  detailTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },

  detailText: {
    color: "#c8d4e2",
    fontSize: 9,
    marginBottom: 6,
    lineHeight: 14,
  },

  mainBtn: {
    height: 34,
    borderRadius: 8,
    backgroundColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  mainBtnText: {
    color: "#00131f",
    fontSize: 9,
    fontWeight: "900",
  },

  secondBtn: {
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.14)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingHorizontal: 10,
  },

  secondBtnText: {
    color: "#38d7ff",
    fontSize: 9,
    fontWeight: "900",
  },

  playerScreen: {
    flex: 1,
    backgroundColor: "#06111d",
  },

  playerHeader: {
    padding: 10,
  },

  playerWrap: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});
