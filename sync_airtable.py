import os
import json
import requests

AIRTABLE_BASE_ID = os.environ.get("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_NAME = "Lapland"
AIRTABLE_API_KEY = os.environ.get("AIRTABLE_API_KEY")
FILENAME = "data.json"

url = f"{AIRTABLE_BASE_ID}/{AIRTABLE_TABLE_NAME}"
headers = {"Authorization": f"Bearer {AIRTABLE_API_KEY}"}

all_records = []
params = {}

while True:
response = requests.get(url, headers=headers, params=params)
data = response.json()

with open(FILENAME, "w", encoding="utf-8") as f:
f.write("[\n")
for i, record in enumerate(all_records):
# Maak een JSON string van het object zonder extra spaties
line = json.dumps(record, ensure_ascii=False)
# Voeg een komma toe, behalve bij de laatste regel
comma = "," if i < len(all_records) - 1 else ""
f.write(f"  {line}{comma}\n")
f.write("]\n")

print(f"Succesvol {len(all_records)} records opgeslagen in {FILENAME}")