const MAPTILER_KEY = 'AnnsmCO7ptYACLsbbwKH';

const map = new maplibregl.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_KEY}`, 
    center: [25.0, 66.5],
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

map.on('load', async () => {
    // 1. Terrain/Hillshade laag (Reliëf)
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

    // 2. Data inladen en omzetten naar GeoJSON
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
                    groep: item.groep
                }
            }))
        };

        map.addSource('punten-bron', {
            type: 'geojson',
            data: geojson
        });

        // 3. De Puntenlaag - Gekleurd op basis van jouw specifieke symbolen
        map.addLayer({
            id: 'punten-laag',
            type: 'circle',
            source: 'punten-bron',
            paint: {
                'circle-radius': 9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
                'circle-color': [
                    'match',
                    ['get', 'groep'],
                    '✈', '#0077b6',  // Vluchten - Blauw
                    '⌘', '#e63946',  // Bezienswaardigheden - Rood
                    '🚙', '#f4a261', // Vervoer - Oranje
                    '⌂', '#2a9d8f',  // Verblijf - Groen
                    /* default: */ '#8d99ae'
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
                'text-size': 11,
                // Verticale ruimte gehalveerd (van 1.5 naar 0.75)
                'text-offset': [0, 0.75], 
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#1a1a1a',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });

        // 5. Wegen als rode lijnen weergeven
        map.addLayer({
            id: 'rode-wegen',
            type: 'line',
            source: 'openmaptiles', // De standaard bron-naam in MapTiler stijlen
            'source-layer': 'road', // De specifieke vector-laag voor wegen
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                // De kleur van de weg
                'line-color': '#ff0000', 
                // De dikte van de weg, afhankelijk van het zoomniveau
                'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    5, 0.5,  // Op zoom 5 zijn de wegen 0.5px breed
                    12, 3,   // Op zoom 12 zijn ze 3px breed
                    18, 15   // Dichtbij zijn ze 15px breed
                ],
                'line-opacity': 0.8 // Een beetje transparantie zodat de kaart eronder zichtbaar blijft
            }
        }, 'hillshade-layer'); // Optioneel: plaats de laag specifiek onder of boven andere lagen

        // Popup bij klik
        map.on('click', 'punten-laag', (e) => {
            const props = e.features[0].properties;
            new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${props.groep} ${props.lbl}</strong>`)
                .addTo(map);
        });

        map.on('mouseenter', 'punten-laag', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'punten-laag', () => map.getCanvas().style.cursor = '');

    } catch (err) {
        console.error("Fout bij inladen data.json:", err);
    }
});

// De toggle voor de heuvels
document.getElementById('terrain-toggle').addEventListener('change', (e) => {
    map.setLayoutProperty('hillshade-layer', 'visibility', e.target.checked ? 'visible' : 'none');
});