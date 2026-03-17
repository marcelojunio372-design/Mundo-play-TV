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
  Alert,
} from "react-native";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

export default function MovieDetailsScreen({ movie, onBack }) {
  if (!movie) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={movie.logo ? { uri: movie.logo } : undefined}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>↩</Text>
        </TouchableOpacity>

        <View style={styles.overlay}>
          <Image
            source={movie.logo ? { uri: movie.logo } : undefined}
            style={styles.poster}
          />

          <View style={styles.infoWrap}>
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (!movie.url) {
                    Alert.alert("Erro", "URL do filme não encontrada");
                    return;
                  }
                  Alert.alert("Player", "Aqui abre o player do filme");
                }}
              >
                <Text style={styles.actionBtnText}>▶ Assistir agora</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>★</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{movie.name}</Text>
            <Text style={styles.meta}>
              {movie.year || "2026"}   •   {movie.group || "Filmes"}
            </Text>

            <Text style={styles.desc}>
              {movie.description || "Sem descrição na lista."}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080b12" },
  bg: { flex: 1 },
  bgImage: { opacity: 0.22 },
  backBtn: { position: "absolute", top: 18, left: 18, zIndex: 10 },
  backText: { color: "#fff", fontSize: isPhone ? 22 : 30, fontWeight: "900" },

  overlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isPhone ? 20 : 70,
    backgroundColor: "rgba(10,8,16,0.55)",
  },

  poster: {
    width: isPhone ? 120 : 180,
    height: isPhone ? 180 : 270,
    borderRadius: 10,
    backgroundColor: "#26354b",
  },

  infoWrap: {
    flex: 1,
    marginLeft: 24,
    backgroundColor: "rgba(60,36,72,0.55)",
    padding: 20,
  },

  actionBar: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  actionBtn: {
    height: 42,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    marginRight: 12,
  },
  actionBtnText: { color: "#fff", fontSize: isPhone ? 12 : 16, fontWeight: "700" },
  iconBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  iconBtnText: { color: "#fff", fontSize: 20 },

  title: { color: "#fff", fontSize: isPhone ? 22 : 36, fontWeight: "900" },
  meta: { color: "#d9d0de", fontSize: isPhone ? 12 : 16, marginTop: 8 },
  desc: {
    color: "#f1edf4",
    fontSize: isPhone ? 12 : 16,
    marginTop: 18,
    lineHeight: isPhone ? 18 : 25,
  },
});
