const MAPTILER_KEY = 'AnnsmCO7ptYACLsbbwKH';

const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`, 
    center: [25.0, 66.5],
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

map.on('load', async () => {
    // 1. Detecteer de juiste bronnaam van MapTiler
    const styleSources = map.getStyle().sources;
    const vectorSource = styleSources.maptiler ? 'maptiler' : 'openmaptiles';

    // 2. Landsgrenzen duidelijker maken
    // We voegen een dikke lijn toe voor de landsgrenzen (admin-0)
    map.addLayer({
        id: 'landsgrenzen',
        type: 'line',
        source: vectorSource,
        'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 0], // Alleen landsgrenzen
        paint: {
            'line-color': '#444444', // Donkergrijs/Zwart
            'line-width': [
                'interpolate', ['linear'], ['zoom'],
                3, 1,
                8, 3
            ],
            'line-opacity': 0.8
        }
    });

    // 3. Wegen als rode lijnen (subtieler)
    map.addLayer({
        id: 'rode-wegen',
        type: 'line',
        source: vectorSource,
        'source-layer': 'road',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': '#ff0000',
            'line-width': 0.6,
            'line-opacity': 0.5
        }
    }, 'landsgrenzen'); // Onder de grenzen leggen

    // 4. Terrain/Hillshade
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

    // 5. Data inladen
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

        // 6. De Puntenlaag - Kleiner gemaakt (radius van 9 naar 6)
        map.addLayer({
            id: 'punten-laag',
            type: 'circle',
            source: 'punten-bron',
            paint: {
                'circle-radius': 6, // Kleiner en minder schreeuwerig
                'circle-stroke-width': 1.5,
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

        // 7. De Tekstlabels
        map.addLayer({
            id: 'punten-labels',
            type: 'symbol',
            source: 'punten-bron',
            layout: {
                'text-field': ['get', 'lbl'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10, // Iets kleinere tekst voor balans
                'text-offset': [0, 0.75], 
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#333333',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.5
            }
        });

    } catch (err) {
        console.error("Fout:", err);
    }
});

document.getElementById('terrain-toggle').addEventListener('change', (e) => {
    if (map.getLayer('hillshade-layer')) {
        map.setLayoutProperty('hillshade-layer', 'visibility', e.target.checked ? 'visible' : 'none');
    }
});