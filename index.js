const MAPTILER_KEY = 'AnnsmCO7ptYACLsbbwKH';

const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`, 
    center: [25.0, 66.5],
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

map.on('load', async () => {
    // 1. Terrain/Hillshade laag toevoegen
    map.addSource('terrain-tiles', {
        type: 'raster-dem',
        url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
        tileSize: 256
    });

    map.addLayer({
        id: 'hillshade-layer',
        type: 'hillshade',
        source: 'terrain-tiles',
        paint: { 'hillshade-shadow-color': '#473b31' }
    });

    // 2. Data.json inladen en omzetten naar GeoJSON
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        const geojson = {
            type: 'FeatureCollection',
            features: data.map(item => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(item.lng), parseFloat(item.lat)]
                },
                properties: {
                    lbl: item.lbl,
                    groep: item.groep,
                    // Je kunt hier meer velden toevoegen indien nodig
                }
            }))
        };

        map.addSource('punten-bron', {
            type: 'geojson',
            data: geojson
        });

        // 3. De Puntenlaag (gekleurd op basis van 'groep')
        map.addLayer({
            id: 'punten-laag',
            type: 'circle',
            source: 'punten-bron',
            paint: {
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                // Kleur toewijzen op basis van de waarde in 'groep'
                'circle-color': [
                    'match',
                    ['get', 'groep'],
                    'Activiteit', '#FF5733',
                    'Hotel', '#33FF57',
                    'Restaurant', '#3357FF',
                    /* default kleur: */ '#888888'
                ]
            }
        });

        // 4. De Tekstlabels (lbl)
        map.addLayer({
            id: 'punten-labels',
            type: 'symbol',
            source: 'punten-bron',
            layout: {
                'text-field': ['get', 'lbl'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 1.5],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#000000',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1
            }
        });

        // 5. Click event voor een popup
        map.on('click', 'punten-laag', (e) => {
            const props = e.features[0].properties;
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${props.lbl}</strong><br>Groep: ${props.groep}`)
                .addTo(map);
        });

        // Cursor veranderen bij hover
        map.on('mouseenter', 'punten-laag', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'punten-laag', () => map.getCanvas().style.cursor = '');

    } catch (err) {
        console.error("Fout bij laden vector data:", err);
    }
});

// Toggle voor de heuvels
document.getElementById('terrain-toggle').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    if (map.getLayer('hillshade-layer')) {
        map.setLayoutProperty('hillshade-layer', 'visibility', visibility);
    }
});