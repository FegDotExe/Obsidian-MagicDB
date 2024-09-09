class MagicDB{
    async invoke() {
        const settings = {
            language: "Italian"
        };

        const url = "https://api.magicthegathering.io/v1/cards";
    
        const cardName = await this.get_input();
    
        new Notice(`Searching for card: ${cardName}`);

        const params = {
            name: cardName,
            language: settings.language
        };
    
        try {
            // console.log(encodeURI(url+"?name="+cardName+"&language="+settings.language));

            // const response = await fetch(encodeURI(url+"?name="+cardName+"&language="+settings.language));
            const response = await fetch(url+"?"+new URLSearchParams({
                name: cardName,
                language: settings.language
            }));
    
            // Do something with the data
            const jsonData = await response.json();

            new Notice("Got a response.");

            const fileContent = JSON.stringify(jsonData);
            await app.vault.adapter.write("latest.json", fileContent);

            const outputDict = {};

            if (jsonData.cards.length === 0) {
                new Notice(`No results :(`);
                return;
            }

            let accepted=false;
            let number_of_cards=jsonData.cards.length;
            let i=1;

            for (const card of jsonData.cards) {
                if (settings.language !== "English" && !card.foreignNames) {
                    continue;
                }
                const localizedData = card.foreignNames.find(value => value.language === settings.language);
                if (!localizedData) {
                    localizedData = card;
                }

                for (const dict of [card, localizedData]) {
                    for (const key in dict) {
                        if (dict.hasOwnProperty(key) && key!="foreignNames" && dict[key] !== null) {
                            if(key=="text" || key=="flavor" || key=="originalText"){
                                outputDict[key]=dict[key].replace(/"/g, "'").replace(/\n/g, " // ");
                            }else if(key=="imageUrl"){
                                outputDict["image_url"]=dict["imageUrl"]
                            }else if(key=="manaCost"){
                                outputDict["mana_cost"]=dict["manaCost"]
                            }else if(key!="legalities"){
                                outputDict[key] = dict[key];
                            }
                        }
                    }
                }

                accepted = await this.get_bool_input("Accept? ("+i+"/"+number_of_cards+")",localizedData.imageUrl);
                
                if (accepted) {
                    break;
                }
                i++;
            }

            if (!accepted) {
                return
            }

            if (outputDict.mana_cost) {
                const manaCost = outputDict.mana_cost;

                if (manaCost[1] !== "W" && manaCost[1] !== "B" && manaCost[1] !== "R" && manaCost[1] !== "G" && manaCost[1] !== "U") { // The first value is a number
                    outputDict.neutral = parseInt(manaCost.split("{")[1], 10);
                }

                outputDict.white = manaCost.split("{W}").length - 1;
                outputDict.black = manaCost.split("{B}").length - 1;
                outputDict.red = manaCost.split("{R}").length - 1;
                outputDict.green = manaCost.split("{G}").length - 1;
                outputDict.blue = manaCost.split("{U}").length - 1;
            }

            let outputText = "---\n";

            for (const key in outputDict) {
                if (typeof outputDict[key] === "string") {
                    outputText += `${key}: "${outputDict[key]}"\n`;
                }else if(Array.isArray(outputDict[key])){
                    outputText += `${key}: ${JSON.stringify(outputDict[key])}\n`;
                }
                else {
                    outputText += `${key}: ${outputDict[key]}\n`;
                }
            }

            outputText += "---";

            new Notice("Writing to file...");

            const filePath = `Cards/${outputDict.name}.md`;
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file) {
                await app.vault.adapter.write(filePath, outputText);
            } else {
                await app.vault.create(filePath, outputText);
            }

            new Notice("Success!");
        } catch (error) {
            console.error(error);
        }
    }

    async get_input(message = "Input Card Name",extra_text="") {
        const {Modal, Setting} = customJS.obsidian;
        return new Promise((resolve, reject) => {
            class MyModal extends Modal {
                constructor() {
                    super(app);
                    this.value = "";
                }

                onOpen() {
                    const {contentEl} = this;
                    contentEl.createEl("h1", {text: message});

                    if (extra_text) {
                        const p = contentEl.createEl("p");
                        p.innerText = extra_text;
                    }
                    

                    const inputSetting = new Setting(contentEl);
                    inputSetting.addText((text) => {
                        text.onChange((value) => {
                            this.value = value;
                        });
                        text.inputEl.focus();
                    });
                    inputSetting.addButton((btn) => btn
                        .setButtonText("Submit")
                        .setCta()
                        .onClick(() => {
                            resolve(this.value);
                            this.close();
                        })
                    );
                    contentEl.addEventListener("keydown", (e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            resolve(this.value);
                            this.close();
                        }
                    });
                }
            }

            new MyModal(app).open();
        });
    }

    async get_bool_input(message = "Input Card Name",extra_text=""){
        const {Modal, Setting} = customJS.obsidian;
        return new Promise((resolve, reject) => {
            class MyBoolInputModal extends Modal {
                constructor(app) {
                    super(app);
                }

                onOpen() {
                    const {contentEl} = this;
                    contentEl.createEl("h1", {text: message});

                    if (extra_text) {
                        const img = contentEl.createEl("img");
                        img.src = extra_text;
                        img.style.width = "250px";
                        img.style.display = "block";
                        img.style.margin = "auto";
                    }

                    const setting = new Setting(contentEl);
                    setting.addButton((btn) => btn
                        .setButtonText("Yes")
                        .setCta()
                        .onClick(() => {
                            resolve(true);
                            this.close();
                        })
                    );
                    setting.addButton((btn) => btn
                        .setButtonText("No")
                        .setWarning()
                        .onClick(() => {
                            resolve(false);
                            this.close();
                        })
                    );
                }
            }

            new MyBoolInputModal(app).open();
        });
    }

}