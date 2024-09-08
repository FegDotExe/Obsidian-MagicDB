class MagicDB{
    async invoke() {
        const settings = {
            language: "Italian"
        };
    
        new Notice(`Test`);

        const url = "https://api.magicthegathering.io/v1/cards";
    
        const cardName = await this.get_input();
    
        new Notice(`Carta: ${cardName}`);

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

            // new Notice(`JSON: ${Object.prototype.toString.call(jsonData.cards)}`);

            const fileContent = JSON.stringify(jsonData);
            await app.vault.adapter.write("latest.json", fileContent);

            const outputDict = {};

            if (jsonData.cards.length === 0) {
                new Notice(`No results :(`);
                process.exit(0);
            }

            let accepted="";

            for (const card of jsonData.cards) {
                if (settings.language !== "English" && !card.foreignNames) {
                    continue;
                }
                const localizedData = card.foreignNames.find(value => value.language === settings.language);

                if (!localizedData) {
                    localizedData = card;
                }

                outputDict.name = localizedData.name;
                outputDict.rarity = card.rarity;
                outputDict.text = localizedData.text.replace(/"/g, "'").replace(/\n/g, " // ");
                outputDict.types = card.types;
                outputDict.image_url = localizedData.imageUrl;

                console.log(outputDict.name);
                console.log(outputDict.types);

                if (card.types.includes("Land")) { // The card is a land
                    // Do nothing
                } else if (card.types.includes("Creature")) { // The card is a creature
                    outputDict.mana_cost = card.manaCost;
                    outputDict.power = card.power;
                    outputDict.toughness = card.toughness;
                    
                    console.log(outputDict.mana_cost);
                    console.log(`${outputDict.power}/${outputDict.toughness}`);
                } else {
                    outputDict.mana_cost = card.manaCost;
                    
                    console.log(outputDict.mana_cost);
                }

                console.log(outputDict.text);

                console.log("-".repeat(15));
                accepted = await this.get_input("Accept? [y/n]> ");
                console.log("-".repeat(15));
                if (accepted === "y") {
                    break;
                }
            }

            if (accepted !== "y") {
                process.exit(0);
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
                } else {
                    outputText += `${key}: ${outputDict[key]}\n`;
                }
            }

            outputText += "---";

            new Notice("End reached!");

            const filePath = `Cards/${outputDict.name}.md`;
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file) {
                await app.vault.adapter.write(filePath, outputText);
            } else {
                await app.vault.create(filePath, outputText);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async get_input(message = "Input Card Name") {
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
                }
            }

            new MyModal(app).open();
        });
    }

}