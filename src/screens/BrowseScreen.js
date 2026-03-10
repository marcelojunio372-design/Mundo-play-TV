import React, { useMemo, useState } from "react";
import {
View,
Text,
FlatList,
TouchableOpacity,
StyleSheet,
TextInput
} from "react-native";

export default function BrowseScreen({ route, navigation }) {

const { title="Lista", items=[] } = route.params || {}

const [search,setSearch] = useState("")
const [category,setCategory] = useState(null)

const categories = useMemo(()=>{

const groups = {}

items.forEach(item=>{

const g = item.group || "Outros"

if(!groups[g]) groups[g] = []

groups[g].push(item)

})

return groups

},[items])

const categoryList = Object.keys(categories)

const filtered = useMemo(()=>{

let list = category ? categories[category] : items

if(search){

const q = search.toLowerCase()

list = list.filter(x=>x.name?.toLowerCase().includes(q))

}

return list

},[items,search,category])

function openPlayer(item){

navigation.navigate("Player",{channel:item})

}

const renderItem = ({item}) =>(

<TouchableOpacity
style={styles.row}
onPress={()=>openPlayer(item)}
>

<Text style={styles.name}>
{item.name}
</Text>

</TouchableOpacity>

)

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

<Text style={styles.title}>
{title}
</Text>

</View>

<TextInput
style={styles.search}
placeholder="Procurar..."
placeholderTextColor="#aaa"
value={search}
onChangeText={setSearch}
/>

{!category && (

<FlatList
data={categoryList}
keyExtractor={(item)=>item}
renderItem={({item})=>(

<TouchableOpacity
style={styles.category}
onPress={()=>setCategory(item)}
>

<Text style={styles.categoryText}>
{item}
</Text>

</TouchableOpacity>

)}
/>

)}

{category && (

<>

<TouchableOpacity
style={styles.categoryBack}
onPress={()=>setCategory(null)}
>

<Text style={styles.categoryBackText}>
← VOLTAR CATEGORIAS
</Text>

</TouchableOpacity>

<FlatList
data={filtered}
keyExtractor={(item,i)=>String(i)}
renderItem={renderItem}
/>

</>

)}

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
backgroundColor:"rgba(255,255,255,0.2)",
padding:8,
borderRadius:8
},

backText:{
color:"#fff",
fontWeight:"bold"
},

title:{
color:"#fff",
fontSize:18,
marginLeft:10,
fontWeight:"bold"
},

search:{
backgroundColor:"rgba(255,255,255,0.1)",
margin:10,
borderRadius:10,
padding:10,
color:"#fff"
},

category:{
padding:15,
borderBottomWidth:1,
borderBottomColor:"#333"
},

categoryText:{
color:"#fff",
fontSize:16
},

categoryBack:{
padding:10
},

categoryBackText:{
color:"#aaa"
},

row:{
padding:15,
borderBottomWidth:1,
borderBottomColor:"#333"
},

name:{
color:"#fff"
}

})
