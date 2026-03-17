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
    { id: "last", name: "RECENTE", items: [] },
  ];

  Object.keys(grouped).forEach((group, index) => {
    categories.push({ id: `movie_group_${index}`, name: group.toUpperCase(), items: grouped[group] });
  });

  return categories;
}

export default function MoviesScreen({ session, onBack, onOpenSettings, onLogout }) {
  const movies = session?.data?.movies || [];
  const categories = useMemo(() => buildMovieCategories(movies), [movies]);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const visibleMovies = categories[selectedCategory]?.items || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.headerBtn}>VOLTAR</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>FILMES</Text>
        <TouchableOpacity onPress={onLogout}><Text style={styles.headerBtn}>SAIR</Text></TouchableOpacity>
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

        <View style={styles.centerPanel}>
          <FlatList
            data={visibleMovies}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            numColumns={3}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => {
                setSelectedMovie(item);
                setShowPlayer(false);
              }}>
                {item.logo ? <Image source={{ uri: item.logo }} style={styles.poster} /> : <View style={styles.posterFallback} />}
                <Text style={styles.title} numberOfLines={2}>{item.name || "Sem nome"}</Text>
                <Text style={styles.group} numberOfLines={1}>{item.group || "Filme"}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.rightPanel}>
          {selectedMovie ? (
            <>
              {selectedMovie.logo ? <Image source={{ uri: selectedMovie.logo }} style={styles.detailPoster} /> : <View style={styles.detailPoster} />}

              <Text style={styles.detailTitle} numberOfLines={2}>{selectedMovie.name}</Text>
              <Text style={styles.detailText}>Ano: {selectedMovie.year || "-"}</Text>
              <Text style={styles.detailText}>Grupo: {selectedMovie.group || "-"}</Text>
              <Text style={styles.detailText} numberOfLines={6}>
                Descrição: {selectedMovie.description || "Sem descrição na lista"}
              </Text>

              <TouchableOpacity style={styles.mainBtn} onPress={() => setShowPlayer(true)}>
                <Text style={styles.mainBtnText}>ABRIR PLAYER</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mainBtn} onPress={onOpenSettings}>
                <Text style={styles.mainBtnText}>CONFIG.</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.empty}>Selecione um filme</Text>
          )}
        </View>
      </View>

      <Modal visible={showPlayer} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#06111d" }}>
          <View style={{ padding: 10 }}>
            <TouchableOpacity style={styles.mainBtn} onPress={() => setShowPlayer(false)}>
              <Text style={styles.mainBtnText}>FECHAR PLAYER</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 10 }}>
            <VideoPlayer url={selectedMovie?.url} title={selectedMovie?.name} brand="MUNDO PLAY TV" />
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
  leftPanel: { width: 86, paddingRight: 4 },
  categoryRow: {
    minHeight: 30, paddingHorizontal: 6, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  categoryActive: { backgroundColor: "#6de9ea", borderRadius: 4 },
  categoryText: { color: "#fff", fontSize: 7, fontWeight: "800", flex: 1, marginRight: 4 },
  categoryTextActive: { color: "#0d2340" },
  categoryCount: { color: "#fff", fontSize: 7, fontWeight: "800" },
  centerPanel: { flex: 1, paddingHorizontal: 4 },
  card: { width: "31%", marginHorizontal: "1%", marginBottom: 8 },
  poster: { width: "100%", height: 90, borderRadius: 8, backgroundColor: "#243a57", marginBottom: 4 },
  posterFallback: { width: "100%", height: 90, borderRadius: 8, backgroundColor: "#243a57", marginBottom: 4 },
  title: { color: "#fff", fontSize: 8, fontWeight: "800" },
  group: { color: "#9fb2c7", fontSize: 7, marginTop: 2 },
  rightPanel: { width: 124, paddingLeft: 4 },
  detailPoster: { width: "100%", height: 110, borderRadius: 8, backgroundColor: "#243a57", marginBottom: 6 },
  detailTitle: { color: "#fff", fontSize: 8, fontWeight: "900", marginBottom: 4 },
  detailText: { color: "#9fb2c7", fontSize: 7, marginBottom: 3 },
  mainBtn: {
    height: 30, borderRadius: 8, backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1, borderColor: "#38d7ff", alignItems: "center", justifyContent: "center", marginTop: 6
  },
  mainBtnText: { color: "#38d7ff", fontSize: 7, fontWeight: "900" },
  empty: { color: "#fff", fontSize: 8, marginTop: 20 },
});
