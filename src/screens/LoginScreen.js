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
        if (!m3u.trim()) {
          throw new Error("Cole a URL M3U");
        }

        const data = await loadM3U(m3u);

        onLogin({
          type: "m3u",
          data,
        });
      }

      if (mode === "xtream") {
        if (!server.trim() || !user.trim() || !pass.trim()) {
          throw new Error("Preencha servidor, usuário e senha");
        }

        const data = await loginXtream(server, user, pass);

        onLogin({
          type: "xtream",
          data,
        });
      }

      if (mode === "mac") {
        if (!server.trim() || !mac.trim()) {
          throw new Error("Preencha portal e MAC");
        }

        const data = await loginMAC(server, mac);

        onLogin({
          type: "mac",
          data,
        });
      }
    } catch (e) {
      Alert.alert("Erro", e.message || "Falha ao conectar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.logo}>MUNDO PLAY TV</Text>
        <Text style={styles.sub}>Entrar no aplicativo</Text>

        <View style={styles.topModes}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "xtream" && styles.modeBtnActive]}
            onPress={() => setMode("xtream")}
          >
            <Text style={[styles.modeText, mode === "xtream" && styles.modeTextActive]}>
              Usuário / Senha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, mode === "m3u" && styles.modeBtnActive]}
            onPress={() => setMode("m3u")}
          >
            <Text style={[styles.modeText, mode === "m3u" && styles.modeTextActive]}>
              M3U
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "m3u" && (
          <TextInput
            placeholder="Cole aqui sua URL M3U"
            placeholderTextColor="#8ea3b8"
            style={styles.bigInput}
            value={m3u}
            onChangeText={setM3u}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {mode === "xtream" && (
          <View style={styles.form}>
            <TextInput
              placeholder="Servidor"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={server}
              onChangeText={setServer}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              placeholder="Usuário"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={user}
              onChangeText={setUser}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              placeholder="Senha"
              placeholderTextColor="#8ea3b8"
              style={styles.input}
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <TouchableOpacity style={styles.connectBtn} onPress={connect} disabled={loading}>
          <Text style={styles.connectText}>
            {loading ? "CONECTANDO..." : "CONECTAR"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.macFooterBtn, mode === "mac" && styles.macFooterBtnActive]}
            onPress={() => setMode("mac")}
          >
            <Text
              style={[
                styles.macFooterText,
                mode === "mac" && styles.macFooterTextActive,
              ]}
            >
              MAC
            </Text>
          </TouchableOpacity>

          {mode === "mac" && (
            <View style={styles.macForm}>
              <TextInput
                placeholder="Portal"
                placeholderTextColor="#8ea3b8"
                style={styles.input}
                value={server}
                onChangeText={setServer}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                placeholder="00:1A:79:00:00:00"
                placeholderTextColor="#8ea3b8"
                style={styles.input}
                value={mac}
                onChangeText={setMac}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          )}
        </View>

        <Text style={styles.bottomText}>Login IPTV profissional</Text>
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
    padding: 18,
  },

  loginBox: {
    width: "100%",
    maxWidth: 980,
    backgroundColor: "#0d1b2a",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
  },

  logo: {
    color: "#40d8ff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
  },

  sub: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 22,
  },

  topModes: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 18,
  },

  modeBtn: {
    minWidth: 160,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#122338",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  modeBtnActive: {
    backgroundColor: "rgba(64,216,255,0.18)",
    borderColor: "#40d8ff",
  },

  modeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  modeTextActive: {
    color: "#ffffff",
  },

  bigInput: {
    width: "100%",
    minHeight: 112,
    backgroundColor: "#102235",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 18,
    paddingTop: 18,
    color: "#ffffff",
    fontSize: 17,
    marginBottom: 18,
  },

  form: {
    marginBottom: 18,
  },

  macForm: {
    width: "100%",
    marginTop: 14,
  },

  input: {
    width: "100%",
    height: 52,
    backgroundColor: "#102235",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 12,
  },

  connectBtn: {
    width: "100%",
    height: 68,
    borderRadius: 18,
    backgroundColor: "#40d8ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  connectText: {
    color: "#07111b",
    fontSize: 22,
    fontWeight: "900",
  },

  footer: {
    marginTop: 18,
    alignItems: "flex-start",
  },

  macFooterBtn: {
    minWidth: 120,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#122338",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  macFooterBtnActive: {
    backgroundColor: "rgba(64,216,255,0.18)",
    borderColor: "#40d8ff",
  },

  macFooterText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  macFooterTextActive: {
    color: "#40d8ff",
  },

  bottomText: {
    color: "#8ea3b8",
    textAlign: "center",
    fontSize: 13,
    marginTop: 16,
  },
});
