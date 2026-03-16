import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
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

  async function connect() {

    try {

      if (mode === "m3u") {

        const data = await loadM3U(m3u);

        onLogin({
          type: "m3u",
          data
        });
      }

      if (mode === "xtream") {

        const data = await loginXtream(server, user, pass);

        onLogin({
          type: "xtream",
          data
        });
      }

      if (mode === "mac") {

        const data = await loginMAC(server, mac);

        onLogin({
          type: "mac",
          data
        });
      }

    } catch (e) {

      Alert.alert("Erro", e.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>MUNDO PLAY TV</Text>

      <View style={styles.tabs}>

        <TouchableOpacity onPress={() => setMode("xtream")}>
          <Text style={styles.tab}>Usuário / Senha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode("m3u")}>
          <Text style={styles.tab}>M3U</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode("mac")}>
          <Text style={styles.tab}>MAC</Text>
        </TouchableOpacity>

      </View>

      {mode === "m3u" && (
        <TextInput
          placeholder="Cole aqui sua URL M3U"
          placeholderTextColor="#aaa"
          style={styles.input}
          onChangeText={setM3u}
        />
      )}

      {mode === "xtream" && (
        <>
          <TextInput
            placeholder="Servidor"
            style={styles.input}
            onChangeText={setServer}
          />

          <TextInput
            placeholder="Usuário"
            style={styles.input}
            onChangeText={setUser}
          />

          <TextInput
            placeholder="Senha"
            style={styles.input}
            onChangeText={setPass}
          />
        </>
      )}

      {mode === "mac" && (
        <>
          <TextInput
            placeholder="Portal"
            style={styles.input}
            onChangeText={setServer}
          />

          <TextInput
            placeholder="MAC Address"
            style={styles.input}
            onChangeText={setMac}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={connect}>
        <Text style={styles.buttonText}>CONECTAR</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

container:{flex:1,backgroundColor:"#06111d",alignItems:"center",justifyContent:"center"},

title:{color:"#40d8ff",fontSize:32,fontWeight:"bold",marginBottom:30},

tabs:{flexDirection:"row",gap:20,marginBottom:20},

tab:{color:"#fff",fontSize:16},

input:{
width:"80%",
height:50,
backgroundColor:"#0e2235",
borderRadius:10,
marginBottom:12,
paddingHorizontal:12,
color:"#fff"
},

button:{
backgroundColor:"#40d8ff",
width:"80%",
height:55,
borderRadius:12,
alignItems:"center",
justifyContent:"center",
marginTop:10
},

buttonText:{fontWeight:"bold",fontSize:18}

});
