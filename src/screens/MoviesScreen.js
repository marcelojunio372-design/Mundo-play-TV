import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";

function buildMovieCategories(movies) {
  const grouped = {};

  movies.forEach((item) => {
    const group = item.group || "OUTROS";
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  const categories = [
    { id: "all", name: "TODOS OS FILMES", items: movies },
    { id: "fav", name: "FAVORITOS", items: [] },
    { id: "last", name: "RECENTEMENTE", items: [] },
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
  const movies = session?.data?.movies || [];
  const categories = useMemo(() => buildMovieCategories(movies), [movies]);

  const [selectedCategory, setSelectedCategory] = useState(0);
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
                  <Text
                    style={[styles.categoryText, active && styles.categoryTextActive]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[styles.categoryCount, active && styles.categoryTextActive]}
                  >
                    {item.items.length}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <FlatList
            data={visibleMovies}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            numColumns={4}
            initialNumToRender={24}
            maxToRenderPerBatch={24}
            windowSize={10}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.logo ? (
                  <Image source={{ uri: item.logo }} style={styles.poster} />
                ) : (
                  <View style={styles.posterFallback} />
                )}

                <Text style={styles.title} numberOfLines={2}>
                  {item.name || item.title || "Sem nome"}
                </Text>

                <Text style={styles.group} numberOfLines={1}>
                  {item.group || "Filme"}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum filme encontrado.</Text>
            }
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={onOpenSettings}>
          <Text style={styles.footerBtnText}>CONFIG.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },

  header: {
    height: 48,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerBtn: {
    color: "#38d7ff",
    fontSize: 10,
    fontWeight: "900",
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  content: {
    flex: 1,
    flexDirection: "row",
    padding: 4,
  },

  leftPanel: {
    width: 102,
    paddingRight: 4,
  },

  categoryRow: {
    minHeight: 36,
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
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
    flex: 1,
    marginRight: 4,
  },

  categoryTextActive: {
    color: "#0d2340",
  },

  categoryCount: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
  },

  rightPanel: {
    flex: 1,
    paddingLeft: 4,
  },

  grid: {
    paddingBottom: 8,
  },

  card: {
    width: "23%",
    marginHorizontal: "1%",
    marginBottom: 10,
  },

  poster: {
    width: "100%",
    height: 95,
    borderRadius: 8,
    backgroundColor: "#243a57",
    marginBottom: 4,
  },

  posterFallback: {
    width: "100%",
    height: 95,
    borderRadius: 8,
    backgroundColor: "#243a57",
    marginBottom: 4,
  },

  title: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "800",
  },

  group: {
    color: "#9fb2c7",
    fontSize: 7,
    marginTop: 2,
  },

  emptyText: {
    color: "#fff",
    fontSize: 9,
    textAlign: "center",
    marginTop: 20,
  },

  footer: {
    padding: 6,
  },

  footerBtn: {
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
  },

  footerBtnText: {
    color: "#38d7ff",
    fontSize: 8,
    fontWeight: "900",
  },
});
