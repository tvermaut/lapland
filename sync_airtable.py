import os
import json
import requests

AIRTABLE_BASE_ID = "appGVphzDg9yKOfnl"
AIRTABLE_TABLE_NAME = "Punt"
AIRTABLE_API_KEY = os.environ.get("AIRTABLE_TOKEN")
FILENAME = "data.json"

if not AIRTABLE_API_KEY:
    raise ValueError("Fout: AIRTABLE_TOKEN is niet gevonden in de environment variabelen.")

url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"
headers = {"Authorization": f"Bearer {AIRTABLE_API_KEY}"}

all_records = []
params = {}

print("Data ophalen en platstlaan uit Airtable...")

while True:
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"Foutmelding van Airtable: {response.text}")
        response.raise_for_status()
    
    data = response.json()
    records = data.get("records", [])

    for record in records:
        # Hier gebeurt het 'platstlaan': 
        # We nemen de 'fields' dictionary en voegen de 'id' van het record toe
        flat_record = {"id": record.get("id")}
        flat_record.update(record.get("fields", {}))
        all_records.append(flat_record)

    offset = data.get("offset")
    if not offset:
        break
    params["offset"] = offset

# Schrijf de platgeslagen data weg
with open(FILENAME, "w", encoding="utf-8") as f:
    json.dump(all_records, f, ensure_ascii=False, indent=2)

print(f"Succes! {len(all_records)} platgeslagen records opgeslagen in {FILENAME}")
