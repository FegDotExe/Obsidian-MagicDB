Use `ctrl+m` or `cmnd+m` in order to add a card by name.

---

```dataviewjs
let pages=dv.pages('"Cards"');

let subtype_filter = (card,subtype)=>{
	if(card.subtypes){
		return card.subtypes.includes(subtype);
	}else{
		return false;
	}
}

// Filters here
//pages=pages.filter(card => card.text.includes("segnalin"))

//pages=pages.filter(card => card.toughness==1)
//pages=pages.filter(card => card.atk>0)
//pages=pages.slice(0,10);
//pages=pages.filter(card => subtype_filter(card,"Dragon"))
// No more filters

// Usage functions
let color_function = (b) =>{
	let output=""

	if(b.neutral>0){
		output+=b.neutral;
	}
	output+="⚪".repeat(b.white)
	output+="🔴".repeat(b.red)
	output+="🟢".repeat(b.green)
	output+="🔵".repeat(b.blue)
	output+="⚫".repeat(b.black)
	
	return output
}
let atk_constitution_function = (b) =>{
	if (typeof b.types !== 'undefined'){
		return b.power+"/"+b.toughness;
	}
	return ""
}
// End of usage functions

dv.table(["Card", "Image"],pages
    .map(b => [b.file.link, "![nome|250]("+b.image_url+")"]));
```
