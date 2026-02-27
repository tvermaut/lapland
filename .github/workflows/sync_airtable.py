import requests
import json
import os

# Configuratie
BASE_ID = "appGVphzDg9yKOfnl"
TABLE_NAME = "Punt"
TOKEN = os.environ.get("AIRTABLE_TOKEN")
FILENAME = "data.json"

def fetch_all_records():
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {"view": "Github view"}
    
    all_records = []
    offset = None

    while True:
        if offset:
            params["offset"] = offset
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        # We halen alleen de 'fields' en 'id' op om de JSON schoon te houden
        all_records.extend(data.get("records", []))
        
        offset = data.get("offset")
        if not offset:
            break
            
    return all_records

if __name__ == "__main__":
    # 1. Haal de nieuwe data op
    new_records = fetch_all_records()
    
    # 2. Lees de oude data (indien het bestand bestaat)
    old_records = []
    if os.path.exists(FILENAME):
        with open(FILENAME, "r", encoding="utf-8") as f:
            try:
                old_records = json.load(f)
            except json.JSONDecodeError:
                old_records = []

    # 3. Vergelijk de data
    # We vergelijken de inhoud. Als ze gelijk zijn, doen we niets.
    if json.dumps(new_records, sort_keys=True) == json.dumps(old_records, sort_keys=True):
        print("Geen wijzigingen gevonden in Airtable. Script stopt.")
    else:
        # 4. Schrijf alleen weg bij wijzigingen
        with open(FILENAME, "w", encoding="utf-8") as f:
            json.dump(new_records, f, indent=2, ensure_ascii=False)
        print(f"Wijzigingen gedetecteerd. {len(new_records)} records opgeslagen.")
