import requests
import json

settings={"language":"Italian"}

url="https://api.magicthegathering.io/v1/cards"

card_name=input("Input card name>")

print("Searching...")

params = {
    'name': card_name,
    "language": settings["language"]
}

response = requests.get(url,params=params)

print("-"*len("Searching..."))

if response.status_code == 200:
    try:
        # Parse the JSON response
        json_data = response.json()

        with open("latest.json","w") as jf:
            json.dump(json_data,jf)

        output_dict={}

        if len(json_data["cards"])==0:
            print("No results :(")
            quit(0)

        for card in json_data["cards"]:
            if settings["language"]!="English" and "foreignNames" not in card:
                continue
            localized_data=[value for value in card["foreignNames"] if value["language"]==settings["language"]]

            if len(localized_data)==0:
                localized_data=card
            else:
                localized_data=localized_data[0]

            output_dict["name"]=localized_data["name"]
            output_dict["rarity"]=card["rarity"]
            output_dict["text"]=localized_data["text"].replace("\"","'").replace("\n"," // ")
            output_dict["types"]=card["types"]
            output_dict["image_url"]=localized_data["imageUrl"]

            print(output_dict["name"])
            print(output_dict["types"])

            if "Land" in card["types"]: # The card is a land
                pass
            elif "Creature" in card["types"]: # The card is a creature
                output_dict["mana_cost"]=card["manaCost"]
                output_dict["power"]=card["power"]
                output_dict["toughness"]=card["toughness"]
                
                print(output_dict["mana_cost"])
                print(f"{output_dict['power']}/{output_dict['toughness']}")
            else:
                output_dict["mana_cost"]=card["manaCost"]
                
                print(output_dict["mana_cost"])

            print(output_dict["text"])

            print("-"*len("Searching..."))
            accepted=input("Accept? [y/n]>")
            print("-"*len("Searching..."))
            if accepted=="y":
                break

        if accepted!="y":
            quit(0)

        if "mana_cost" in output_dict:
            mana_cost=output_dict["mana_cost"]

            if mana_cost[1]not in ["W","B","R","G","U"]: # The first value is a number
                output_dict["neutral"]=int(mana_cost.split("{")[1][:-1])

            output_dict["white"]=mana_cost.count("{W}")
            output_dict["black"]=mana_cost.count("{B}")
            output_dict["red"]=mana_cost.count("{R}")
            output_dict["green"]=mana_cost.count("{G}")
            output_dict["blue"]=mana_cost.count("{U}")

        output_text="---\n"

        for key in output_dict:
            if isinstance(output_dict[key],str):
                output_text+=f"{key}: \"{output_dict[key]}\"\n"
            else:
                output_text+=f"{key}: {output_dict[key]}\n"

        output_text+="---"

        with open(f"Cards/{output_dict["name"]}.md","w") as jf:
            jf.write(output_text)

    except ValueError:
        print("Response content is not valid JSON")
else:
    print(f'Failed to retrieve the data. Status code: {response.status_code}')
