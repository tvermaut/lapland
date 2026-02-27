const MAPTILER_KEY = 'AnnsmCO7ptYACLsbbwKH';

const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`, 
    center: [25.0, 66.5],
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

map.on('load', async () => {
    // Check welke bron MapTiler gebruikt (meestal 'maptiler' in basic-v2)
    const styleSources = map.getStyle().sources;
    const vectorSource = styleSources.maptiler ? 'maptiler' : 'openmaptiles';

    // 1. Wegen als rode lijnen (Toevoegen VÓÓR de punten zodat ze eronder liggen)
    map.addLayer({
        id: 'rode-wegen',
        type: 'line',
        source: vectorSource,
        'source-layer': 'road',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#ff0000',
            'line-width': [
                'interpolate', ['linear'], ['zoom'],
                5, 0.5,
                12, 2.5
            ],
            'line-opacity': 0.6
        }
    });

    // 2. Terrain/Hillshade (Reliëf)
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

    // 3. Data inladen en omzetten naar GeoJSON
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
                properties: { lbl: item.lbl, groep: item.groep }
            }))
        };

        map.addSource('punten-bron', { type: 'geojson', data: geojson });

        // 4. De Puntenlaag - Gekleurd op jouw symbolen
        map.addLayer({
            id: 'punten-laag',
            type: 'circle',
            source: 'punten-bron',
            paint: {
                'circle-radius': 9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-color': [
                    'match', ['get', 'groep'],
                    '✈', '#0077b6',
                    '⌘', '#e63946',
                    '🚙', '#f4a261',
                    '⌂', '#2a9d8f',
                    '#8d99ae'
                ]
            }
        });

        // 5. De Tekstlabels (lbl) - Verticale ruimte gehalveerd naar 0.75
        map.addLayer({
            id: 'punten-labels',
            type: 'symbol',
            source: 'punten-bron',
            layout: {
                'text-field': ['get', 'lbl'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 11,
                'text-offset': [0, 0.75], 
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#1a1a1a',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });

    } catch (err) {
        console.error("Fout bij inladen data.json:", err);
    }
});

// Toggle voor de heuvels
document.getElementById('terrain-toggle').addEventListener('change', (e) => {
    map.setLayoutProperty('hillshade-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});