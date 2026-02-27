import os
import json
import requests

AIRTABLE_BASE_ID = "appGVphzDg9yKOfnl"
AIRTABLE_TABLE_NAME = "Lapland"
AIRTABLE_API_KEY = os.environ.get("AIRTABLE_TOKEN")
FILENAME = "data.json"

# Check of de token wel aanwezig is (essentieel voor GitHub Actions)
if not AIRTABLE_API_KEY:
    raise ValueError("Fout: AIRTABLE_TOKEN is niet gevonden in de environment variabelen.")

url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"
headers = {"Authorization": f"Bearer {AIRTABLE_API_KEY}"}

all_records = []
params = {}

print("Data ophalen uit Airtable...")

while True:
    response = requests.get(url, headers=headers, params=params)
    
    # Check of de aanvraag gelukt is (bijv. 401 Unauthorized of 404 Not Found)
    response.raise_for_status() 
    
    data = response.json()
    records = data.get("records", [])
    all_records.extend(records)

    # Airtable gebruikt 'offset' voor paginering
    offset = data.get("offset")
    if not offset:
        break
    params["offset"] = offset

# Schrijf de data in één keer weg naar het bestand
with open(FILENAME, "w", encoding="utf-8") as f:
    # indent=2 maakt het bestand leesbaar voor mensen
    json.dump(all_records, f, ensure_ascii=False, indent=2)

print(f"Succes! {len(all_records)} records opgeslagen in {FILENAME}")