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
    params = {"view": "Grid view"}
    
    all_records = []
    offset = None

    while True:
        if offset:
            params["offset"] = offset
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        all_records.extend(data.get("records", []))
        
        offset = data.get("offset")
        if not offset:
            break
            
    return all_records

if __name__ == "__main__":
    records = fetch_all_records()
    with open(FILENAME, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Succesvol {len(records)} records opgeslagen.")
