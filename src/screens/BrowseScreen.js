import React, { useEffect, useMemo, useState } from "react";
import {
View,
Text,
FlatList,
TouchableOpacity,
StyleSheet,
TextInput,
Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BrowseScreen({ route, navigation }) {

const { title="Lista", items=[] } = route.params || {}

const [search,setSearch] = useState("")
const [favorites,setFavorites] = useState([])
const [recent,setRecent] = useState([])
const [epg,setEpg] = useState({})

useEffect(()=>{

loadFavorites()
loadRecent()
loadEPG()

},[])

async function loadFavorites(){

const fav = await AsyncStorage.getItem("favorites")

if(fav) setFavorites(JSON.parse(fav))

}

async function loadRecent(){

const rec = await AsyncStorage.getItem("recent")

if(rec) setRecent(JSON.parse(rec))

}

async function loadEPG(){

try{

const url = await AsyncStorage.getItem("epg_url")

if(!url) return

const res = await fetch(url)

const data = await res.json()

setEpg(data)

}catch{}

}

async function toggleFavorite(item){

let next=[...favorites]

const index = next.findIndex(x=>x.url===item.url)

if(index>=0){

next.splice(index,1)

Alert.alert("Favoritos","Removido")

}else{

next.unshift(item)

Alert.alert("Favoritos","Adicionado")

}

setFavorites(next)

await AsyncStorage.setItem("favorites",JSON.stringify(next))

}

function isFavorite(item){

return favorites.some(x=>x.url===item.url)

}

const filtered = useMemo(()=>{

const q=search.toLowerCase()

if(!q) return items

return items.filter(x=>x.name?.toLowerCase().includes(q))

},[items,search])

function openPlayer(item){

navigation.navigate("Player",{channel:item})

}

const renderItem = ({item}) =>{

const program = epg[item.name] || {}

return(

<TouchableOpacity
style={styles.row}
onPress={()=>openPlayer(item)}
onLongPress={()=>toggleFavorite(item)}
>

<View style={{flex:1}}>

<Text style={styles.title}>
{item.name}
</Text>

<Text style={styles.program}>
Agora: {program.now || "Sem informação"}
</Text>

<Text style={styles.program2}>
Depois: {program.next || ""}
</Text>

</View>

<Text style={styles.star}>
{isFavorite(item) ? "★" : "☆"}
</Text>

</TouchableOpacity>

)

}

return(

<View style={styles.container}>

<View style={styles.top}>

<TouchableOpacity
style={styles.back}
onPress={()=>navigation.goBack()}
>

<Text style={styles.backText}>
VOLTAR
</Text>

</TouchableOpacity>

<Text style={styles.header}>
{title}
</Text>

</View>

<TextInput
style={styles.search}
placeholder="Procurar canal..."
placeholderTextColor="#bbb"
value={search}
onChangeText={setSearch}
/>

<FlatList
data={filtered}
renderItem={renderItem}
keyExtractor={(item,i)=>String(i)}
contentContainerStyle={{padding:10}}
/>

</View>

)

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#12001f"
},

top:{
flexDirection:"row",
alignItems:"center",
padding:10
},

back:{
backgroundColor:"rgba(255,255,255,0.15)",
padding:8,
borderRadius:8
},

backText:{
color:"#fff",
fontWeight:"bold"
},

header:{
color:"#fff",
fontSize:18,
marginLeft:10,
fontWeight:"bold"
},

search:{
backgroundColor:"rgba(255,255,255,0.10)",
margin:10,
borderRadius:10,
padding:10,
color:"#fff"
},

row:{
flexDirection:"row",
alignItems:"center",
padding:12,
backgroundColor:"rgba(255,255,255,0.08)",
borderRadius:10,
marginBottom:8
},

title:{
color:"#fff",
fontWeight:"bold"
},

program:{
color:"#aaa",
fontSize:12
},

program2:{
color:"#777",
fontSize:11
},

star:{
color:"#ffd54a",
fontSize:20
}

})
