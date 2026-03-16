import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import { SERIES_CATEGORIES, SERIES_POSTERS } from "../data/mockData";

export default function SeriesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(SERIES_CATEGORIES[0]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadOnlySeries = () => {
      const next = SERIES_POSTERS[selectedCategory.id] || SERIES_POSTERS.all || [];
      setItems(next);
    };

    loadOnlySeries();
  }, [selectedCategory]);

  function renderCategory({ item }) {
    const active = item.id === selectedCategory.id;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, active && styles.categoryItemActive]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.categoryName, active && styles.categoryNameActive]}>
          {item.name}
        </Text>
        <Text style={[styles.categoryCount, active && styles.categoryNameActive]}>
          {item.count}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderPoster({ item }) {
    return (
      <TouchableOpacity style={styles.posterCard}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <Image source={{ uri: item.image }} style={styles.posterImage} />
        <Text numberOfLines={2} style={styles.posterTitle}>
          {item.title}
        </Text>
        <Text style={styles.posterYear}>({item.year})</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.logo}>EPIC</Text>
        </TouchableOpacity>
        <Text style={styles.close}>✕</Text>
        <Text style={styles.title}>TODOS OS CANAIS</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <View style={styles.searchHeader}>
            <Text style={styles.searchText}>🔍 Pesquisa em categorias</Text>
          </View>

          <FlatList
            data={SERIES_CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={renderCategory}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <View style={styles.rightColumn}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderPoster}
            numColumns={5}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.posterRow}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#17103d",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    color: "#7df4ff",
    fontSize: 24,
    fontWeight: "900",
  },
  close: {
    color: "#d9f6ff",
    fontSize: 28,
    marginLeft: 26,
  },
  title: {
    color: "#e7f9ff",
    fontSize: 26,
    fontWeight: "900",
    marginLeft: "auto",
    marginRight: 20,
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  leftColumn: {
    width: "33%",
    marginRight: 14,
  },
  rightColumn: {
    flex: 1,
  },
  searchHeader: {
    backgroundColor: "#25204d",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  searchText: {
    color: "#dff8ff",
    fontSize: 16,
    fontWeight: "700",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#221c49",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3f3768",
  },
  categoryItemActive: {
    backgroundColor: "#68f6ff",
  },
  categoryName: {
    color: "#f0f7ff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  categoryNameActive: {
    color: "#11316e",
  },
  categoryCount: {
    color: "#f0f7ff",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 12,
  },
  posterRow: {
    justifyContent: "space-between",
  },
  posterCard: {
    width: "18.8%",
    marginBottom: 18,
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 2,
    backgroundColor: "#59dfff",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: {
    color: "#143c80",
    fontSize: 12,
    fontWeight: "900",
  },
  posterImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#2a2456",
  },
  posterTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },
  posterYear: {
    color: "#c8d7ff",
    fontSize: 13,
    marginTop: 3,
  },
});
