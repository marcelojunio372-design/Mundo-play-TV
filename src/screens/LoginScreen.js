import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  xtreamAuth,
  normalizeUrl,
  loadM3UPreview,
} from "../utils/iptv";

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState("xtream");
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleXtreamLogin() {
    try {
      if (!server || !username || !password) {
        Alert.alert("Aviso", "Preencha servidor, usuário e senha.");
        return;
      }

      setLoading(true);

      const auth = await xtreamAuth(server, username, password);

      navigation.replace("Home", {
        loginType: "xtream",
        server: normalizeUrl(server),
        username,
        password,
        authData: auth,
      });
    } catch (e) {
      Alert.alert("Erro", e?.message || "Falha ao conectar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleM3ULogin() {
    try {
      if (!m3uUrl) {
        Alert.alert("Aviso", "Cole a URL M3U.");
        return;
      }

      setLoading(true);
      await loadM3UPreview(m3uUrl, 20);

      navigation.replace("Home", {
        loginType: "m3u",
        m3uUrl,
        previewItems: [],
      });
    } catch (e) {
      Alert.alert("Erro", e?.message || "Falha ao carregar M3U.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>MUNDO PLAY TV</Text>
          <Text style={styles.subtitle}>Streaming Oficial</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "xtream" && styles.tabActive]}
              onPress={() => setMode("xtream")}
            >
              <Text style={[styles.tabText, mode === "xtream" && styles.tabTextActive]}>
                Xtream
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === "m3u" && styles.tabActive]}
              onPress={() => setMode("m3u")}
            >
              <Text style={[styles.tabText, mode === "m3u" && styles.tabTextActive]}>
                M3U
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "xtream" ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Servidor ex: http://dominio:8080"
                placeholderTextColor="#aaa"
                value={server}
                onChangeText={setServer}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Usuário"
                placeholderTextColor="#aaa"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.button} onPress={handleXtreamLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="URL M3U"
                placeholderTextColor="#aaa"
                value={m3uUrl}
                onChangeText={setM3uUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.button} onPress={handleM3ULogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CARREGAR M3U</Text>}
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.macText}>MAC: CA:CE:DA:A0:00:00</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#2b0144",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  logo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#ddd",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#18e7a1",
  },
  tabText: {
    color: "#ddd",
    textAlign: "center",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#111",
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#18e7a1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 18,
  },
  macText: {
    color: "#cfcfcf",
    textAlign: "center",
    marginTop: 18,
    fontSize: 12,
    fontWeight: "700",
  },
});
