import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { loadM3U } from "../services/m3uService";
import { loginXtream } from "../services/xtreamService";
import { loginMAC } from "../services/macService";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("m3u");
  const [m3u, setM3u] = useState("");
  const [server, setServer] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [mac, setMac] = useState("");
  const [loading, setLoading] = useState(false);

  async function connect() {
    try {
      setLoading(true);

      if (mode === "m3u") {
        const data = await loadM3U(m3u);
        onLogin({ type: "m3u", data });
      }

      if (mode === "xtream") {
        const data = await loginXtream(server, user, pass);
        onLogin({ type: "xtream", data });
      }

      if (mode === "mac") {
        const data = await loginMAC(server, mac);
        onLogin({ type: "mac", data });
      }
    } catch (e) {
      Alert.alert("Erro", e.message || "Falha ao conectar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.logo}>MUNDO PLAY TV</Text>
        <Text style={styles.sub}>Entrar no aplicativo</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === "xtream" && styles.tabActive]}
            onPress={() => setMode("xtream")}
          >
            <Text style={styles.tabText}>Usuário / Senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mode === "m3u" && styles.tabActive]}
            onPress={() => setMode("m3u")}
          >
            <Text style={styles.tabText}>M3U</Text>
          </TouchableOpacity>
        </View>

        {mode === "m3u" && (
          <TextInput
            placeholder="Cole sua URL M3U"
            placeholderTextColor="#8ea3b8"
            style={styles.input}
            value={m3u}
            onChangeText={setM3u}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {mode === "xtream" && (
          <>
            <TextInput
              placeholder="Servidor"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={server}
              onChangeText={setServer}
            />
            <TextInput
              placeholder="Usuário"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={user}
              onChangeText={setUser}
            />
            <TextInput
              placeholder="Senha"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={pass}
              onChangeText={setPass}
              secureTextEntry
            />
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={connect} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "CONECTANDO..." : "CONECTAR"}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.macBtn, mode === "mac" && styles.tabActive]}
            onPress={() => setMode("mac")}
          >
            <Text style={styles.macText}>MAC</Text>
          </TouchableOpacity>
        </View>

        {mode === "mac" && (
          <>
            <TextInput
              placeholder="Portal"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={server}
              onChangeText={setServer}
            />
            <TextInput
              placeholder="00:1A:79:00:00:00"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={mac}
              onChangeText={setMac}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06111d",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  box: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0d1b2a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  logo: {
    color: "#40d8ff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  sub: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#122338",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    borderWidth: 1,
    borderColor: "#40d8ff",
    backgroundColor: "rgba(64,216,255,0.18)",
  },
  tabText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    height: 46,
    backgroundColor: "#102235",
    borderRadius: 12,
    paddingHorizontal: 12,
    color: "#fff",
    marginBottom: 10,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#40d8ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  btnText: {
    color: "#07111b",
    fontSize: 17,
    fontWeight: "900",
  },
  footer: {
    marginTop: 12,
    alignItems: "flex-start",
  },
  macBtn: {
    height: 36,
    minWidth: 80,
    borderRadius: 10,
    backgroundColor: "#122338",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  macText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
