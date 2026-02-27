const MAPTILER_KEY = 'AnnsmCO7ptYACLsbbwKH';

const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            // De algemene OpenMapTiles bron
            'osm-tiles': {
                type: 'vector',
                url: `https://api.maptiler.com/tiles/v3-openmaptiles/tiles.json?key=${MAPTILER_KEY}`
            },
            // De Terrain RGB bron voor Hillshading
            'terrain-tiles': {
                type: 'raster-dem',
                url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
                tileSize: 256
            }
        },
        layers: [
            // Simpele achtergrondlaag om te beginnen
            {
                id: 'background',
                type: 'background',
                paint: { 'background-color': '#f8f4f0' }
            },
            // Voorbeeld van een basis vector-laag (water)
            {
                id: 'water',
                type: 'fill',
                source: 'osm-tiles',
                'source-layer': 'water',
                paint: { 'fill-color': '#a0cfdf' }
            },
            // De Hillshade laag (het reliëf)
            {
                id: 'hillshade-layer',
                type: 'hillshade',
                source: 'terrain-tiles',
                layout: { visibility: 'visible' },
                paint: {
                    'hillshade-shadow-color': '#473b31',
                    'hillshade-illumination-direction': 315
                }
            }
        ]
    },
    center: [25.0, 66.5],
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

// 1. Toggle functionaliteit voor de Terrain laag
document.getElementById('terrain-toggle').addEventListener('change', function (e) {
    const visibility = e.target.checked ? 'visible' : 'none';
    if (map.getLayer('hillshade-layer')) {
        map.setLayoutProperty('hillshade-layer', 'visibility', visibility);
    }
});

// 2. Airtable data inladen
async function loadAirtableData() {
    try {
        const response = await fetch('data.json');
        const locations = await response.json();

        locations.forEach(location => {
            if (location.Latitude && location.Longitude) {
                const popup = new maplibregl.Popup({ offset: 25 })
                    .setHTML(`<strong>${location.Name || 'Locatie'}</strong><br>${location.Description || ''}`);

                new maplibregl.Marker({ color: '#ff4400' })
                    .setLngLat([location.Longitude, location.Latitude])
                    .setPopup(popup)
                    .addTo(map);
            }
        });
    } catch (err) {
        console.error("Data kon niet worden geladen:", err);
    }
}

map.on('load', loadAirtableData);