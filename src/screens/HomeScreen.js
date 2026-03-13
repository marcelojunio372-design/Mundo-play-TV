import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import {
  loadXtreamPreview,
  loadXtreamContent,
  loadM3UAll,
} from "../utils/iptv";

export default function HomeScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const m3uUrl = params?.m3uUrl || "";

  const [section, setSection] = useState("live");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState(params?.previewItems || []);
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    async function firstLoad() {
      if (loginType === "xtream") {
        try {
          setLoading(true);
          const preview = await loadXtreamPreview(
            server,
            username,
            password,
            "live",
            100
          );
          setItems(preview);
        } catch (e) {
          Alert.alert("Erro", e?.message || "Falha ao carregar prévia.");
        } finally {
          setLoading(false);
        }
      }
    }

    firstLoad();
  }, [loginType, server, username, password]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      String(item?.name || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  async function loadPreview(kind) {
    try {
      setLoading(true);
      setSection(kind);
      setAllLoaded(false);

      if (loginType === "xtream") {
        const preview = await loadXtreamPreview(
          server,
          username,
          password,
          kind,
          100
        );
        setItems(preview);
      } else {
        const full = await loadM3UAll(m3uUrl);
        setItems(full.slice(0, 100));
      }
    } catch (e) {
      Alert.alert("Erro", e?.message || "Falha ao carregar prévia.");
    } finally {
      setLoading(false);
    }
  }

  async function loadFull(kind) {
    try {
      setFullLoading(true);
      setSection(kind);

      if (loginType === "xtream") {
        const full = await loadXtreamContent(server, username, password, kind);
        setItems(full);
      } else {
        const full = await loadM3UAll(m3uUrl);
        setItems(full);
      }

      setAllLoaded(true);
    } catch (e) {
      Alert.alert("Erro", e?.message || "Falha ao atualizar lista.");
    } finally {
      setFullLoading(false);
    }
  }

  function handleLogout() {
    navigation.replace("Login");
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        {item?.logo ? (
          <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="cover" />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Text style={styles.logoFallbackText}>TV</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item?.name || "Sem nome"}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {item?.category || "Geral"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {menuOpen && (
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>MUNDO PLAY TV</Text>

            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => {
                setMenuOpen(false);
                loadPreview("live");
              }}
            >
              <Text style={styles.sideBtnText}>Live TV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => {
                setMenuOpen(false);
                loadPreview("vod");
              }}
            >
              <Text style={styles.sideBtnText}>Filmes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() => {
                setMenuOpen(false);
                loadPreview("series");
              }}
            >
              <Text style={styles.sideBtnText}>Séries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() =>
                Alert.alert("Idiomas", "Português / English / Español")
              }
            >
              <Text style={styles.sideBtnText}>Idiomas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideBtn}
              onPress={() =>
                Alert.alert("Configurações", "Player, atualização, conta e cache.")
              }
            >
              <Text style={styles.sideBtnText}>Configurações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideBtn} onPress={handleLogout}>
              <Text style={styles.sideBtnText}>Sair</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.main}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMenuOpen(!menuOpen)}
            >
              <Text style={styles.menuBtnText}>☰</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              {section === "live"
                ? "Live TV"
                : section === "vod"
                ? "Filmes"
                : "Séries"}
            </Text>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => loadFull(section)}
            >
              <Text style={styles.refreshText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Buscar conteúdo"
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.quickTabs}>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => loadPreview("live")}
            >
              <Text style={styles.quickBtnText}>Live TV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => loadPreview("vod")}
            >
              <Text style={styles.quickBtnText}>Filmes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => loadPreview("series")}
            >
              <Text style={styles.quickBtnText}>Séries</Text>
            </TouchableOpacity>
          </View>

          {loading || fullLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#18e7a1" />
              <Text style={styles.loaderText}>
                {fullLoading
                  ? "Carregando lista completa..."
                  : "Carregando 100 itens..."}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.countText}>
                {allLoaded
                  ? `Lista completa: ${filteredItems.length} itens`
                  : `Prévia leve: ${filteredItems.length} itens`}
              </Text>

              <FlatList
                data={filteredItems}
                keyExtractor={(item, index) => `${item?.id || index}`}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
  },
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#1d0b2f",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  sidebarTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },
  sideBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  sideBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  main: {
    flex: 1,
    padding: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#18e7a1",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtnText: {
    color: "#111",
    fontSize: 20,
    fontWeight: "800",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 12,
  },
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "700",
  },
  search: {
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  quickTabs: {
    flexDirection: "row",
    marginBottom: 12,
  },
  quickBtn: {
    backgroundColor: "#291041",
    marginRight: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  countText: {
    color: "#bbb",
    marginBottom: 10,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: "#fff",
    marginTop: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: "#2b2b2b",
  },
  logoFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    color: "#fff",
    fontWeight: "800",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  category: {
    color: "#bdbdbd",
    marginTop: 4,
  },
});
