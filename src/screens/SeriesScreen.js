import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";

export default function SeriesScreen({ session, onBack, onOpenSettings, onLogout }) {
  const series = session?.data?.series || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBtn}>VOLTAR</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>SÉRIES</Text>

        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.headerBtn}>SAIR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topBlocks}>
        <Text style={styles.blockTitle}>VISTO POR ÚLTIMO</Text>
        <Text style={styles.blockTitle}>FAVORITOS</Text>
        <Text style={styles.blockTitle}>TODAS ({series.length})</Text>
      </View>

      <FlatList
        data={series}
        keyExtractor={(item, index) => item.id || String(index)}
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
              <View style={styles.poster} />
            )}

            <Text style={styles.title} numberOfLines={2}>
              {item.name || item.title || "Sem nome"}
            </Text>

            <Text style={styles.group} numberOfLines={1}>
              {item.group || "Série"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma série encontrada na lista.</Text>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={onOpenSettings}>
          <Text style={styles.footerBtnText}>CONF.</Text>
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

  topBlocks: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
  },

  blockTitle: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 6,
  },

  grid: {
    paddingHorizontal: 4,
    paddingBottom: 10,
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
    marginBottom: 5,
  },

  title: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  group: {
    color: "#9fb2c7",
    fontSize: 7,
    marginTop: 2,
  },

  empty: {
    color: "#ffffff",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },

  footer: {
    padding: 8,
  },

  footerBtn: {
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(56,215,255,0.18)",
    borderWidth: 1,
    borderColor: "#38d7ff",
    alignItems: "center",
    justifyContent: "center",
  },

  footerBtnText: {
    color: "#38d7ff",
    fontSize: 9,
    fontWeight: "900",
  },
});
