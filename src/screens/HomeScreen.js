import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {

  const [live, setLive] = useState([])
  const [movies, setMovies] = useState([])
  const [series, setSeries] = useState([])
  const [favorites, setFavorites] = useState([])
  const [recent, setRecent] = useState([])

  useEffect(() => {
    loadFavorites()
    loadRecent()
  }, [])

  async function loadFavorites() {
    const fav = await AsyncStorage.getItem("favorites")
    if (fav) setFavorites(JSON.parse(fav))
  }

  async function loadRecent() {
    const rec = await AsyncStorage.getItem("recent")
    if (rec) setRecent(JSON.parse(rec))
  }

  async function reload() {

    try {

      const url = await AsyncStorage.getItem("m3u_url")

      if (!url) {
        Alert.alert("Erro","Lista não encontrada")
        return
      }

      const response = await fetch(url)

      const text = await response.text()

      const lines = text.split("\n")

      const channels = []

      let name = ""

      lines.forEach(line => {

        if (line.startsWith("#EXTINF")) {

          const parts = line.split(",")

          name = parts[1] || "Canal"

        } else if (line.startsWith("http")) {

          channels.push({
            name: name,
            url: line
          })

        }

      })

      setLive(channels)

    } catch (e) {

      Alert.alert("Erro ao carregar lista")

    }

  }

  return (

<View style={styles.container}>

<Image
source={require("../../assets/bg.jpg")}
style={styles.bg}
/>

<View style={styles.menu}>

<TouchableOpacity
style={styles.button}
onPress={()=>navigation.navigate("Browse",{title:"Live TV",items:live})}
>
<Text style={styles.text}>Live TV</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.button}
onPress={()=>navigation.navigate("Browse",{title:"Filmes",items:movies})}
>
<Text style={styles.text}>Filmes</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.button}
onPress={()=>navigation.navigate("Browse",{title:"Séries",items:series})}
>
<Text style={styles.text}>Séries</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.button}
onPress={()=>navigation.navigate("Browse",{title:"Favoritos",items:favorites})}
>
<Text style={styles.text}>Favoritos</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.button}
onPress={()=>navigation.navigate("Browse",{title:"Vistos",items:recent})}
>
<Text style={styles.text}>Vistos Recentemente</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.reload}
onPress={reload}
>
<Text style={styles.reloadText}>RECARREGAR</Text>
</TouchableOpacity>

<TouchableOpacity
style={styles.exit}
onPress={()=>navigation.replace("Login")}
>
<Text style={styles.exitText}>SAIR</Text>
</TouchableOpacity>

</View>

</View>

  )

}

const styles = StyleSheet.create({

container:{
flex:1
},

bg:{
position:"absolute",
width:"100%",
height:"100%"
},

menu:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

button:{
backgroundColor:"#6a00ff",
padding:15,
margin:10,
borderRadius:10,
width:200
},

text:{
color:"#fff",
textAlign:"center",
fontWeight:"bold"
},

reload:{
backgroundColor:"#00aaff",
padding:15,
marginTop:20,
borderRadius:10,
width:200
},

reloadText:{
color:"#fff",
textAlign:"center",
fontWeight:"bold"
},

exit:{
backgroundColor:"#fff",
padding:15,
marginTop:20,
borderRadius:10,
width:200
},

exitText:{
color:"#000",
textAlign:"center",
fontWeight:"bold"
}

})
