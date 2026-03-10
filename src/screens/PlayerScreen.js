import React, { useEffect, useRef } from "react";
import {
View,
StyleSheet,
TouchableOpacity,
Text,
Image,
Alert
} from "react-native";

import { Video } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PlayerScreen({ route, navigation }) {

const { channel } = route.params || {};

const videoRef = useRef(null)

useEffect(()=>{

saveRecent()

},[])

async function saveRecent(){

try{

const rec = await AsyncStorage.getItem("recent")

let list = rec ? JSON.parse(rec) : []

list = list.filter(x=>x.url !== channel.url)

list.unshift(channel)

if(list.length>40){

list=list.slice(0,40)

}

await AsyncStorage.setItem("recent",JSON.stringify(list))

}catch{}

}

if(!channel?.url){

return(

<View style={styles.container}>

<Text style={styles.error}>
Erro ao carregar vídeo
</Text>

<TouchableOpacity
style={styles.back}
onPress={()=>navigation.goBack()}
>

<Text style={styles.backText}>
VOLTAR
</Text>

</TouchableOpacity>

</View>

)

}

return(

<View style={styles.container}>

<Video
ref={videoRef}
source={{ uri: channel.url }}
style={styles.video}
useNativeControls
resizeMode="contain"
shouldPlay
/>

<View style={styles.topBar}>

<Image
source={require("../../assets/logo.png")}
style={styles.logo}
/>

<Text
numberOfLines={1}
style={styles.title}
>

{channel.name}

</Text>

<TouchableOpacity
style={styles.exit}
onPress={()=>navigation.goBack()}
>

<Text style={styles.exitText}>
SAIR
</Text>

</TouchableOpacity>

</View>

</View>

)

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#000"
},

video:{
flex:1
},

topBar:{
position:"absolute",
top:20,
left:20,
right:20,
height:60,
flexDirection:"row",
alignItems:"center",
backgroundColor:"rgba(0,0,0,0.60)",
borderRadius:12,
padding:10
},

logo:{
width:40,
height:40
},

title:{
flex:1,
color:"#fff",
fontWeight:"bold",
marginLeft:10
},

exit:{
backgroundColor:"#fff",
padding:10,
borderRadius:8
},

exitText:{
color:"#000",
fontWeight:"bold"
},

error:{
color:"#fff",
textAlign:"center",
marginTop:40,
fontSize:18
},

back:{
marginTop:20,
backgroundColor:"#fff",
padding:10,
borderRadius:10,
alignSelf:"center"
},

backText:{
fontWeight:"bold"
}

})
