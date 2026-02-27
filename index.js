// 1. Initialiseer de Vector Kaart
const map = new maplibregl.Map({
    container: 'map', 
    // Gebruik een publieke vector stijl (OSM Bright variant)
    style: 'https://demotiles.maplibre.org/style.json', 
    center: [25.0, 66.5], // Gecentreerd op Lapland (Lon, Lat)
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

// 2. Laad de data.json die door je Python actie is gegenereerd
async function loadAirtableData() {
    try {
        const response = await fetch('data.json');
        const locations = await response.json();

        locations.forEach(location => {
            // Controleer of de records coördinaten hebben
            if (location.Latitude && location.Longitude) {
                
                // Maak een popup
                const popup = new maplibregl.Popup({ offset: 25 })
                    .setHTML(`
                        <strong class="popup-title">${location.Name || 'Naamloos'}</strong>
                        <p>${location.Description || 'Geen omschrijving beschikbaar.'}</p>
                    `);

                // Voeg een marker toe aan de kaart
                new maplibregl.Marker({ color: '#ff4400' })
                    .setLngLat([location.Longitude, location.Latitude])
                    .setPopup(popup)
                    .addTo(map);
            }
        });
    } catch (error) {
        console.error("Fout bij het laden van data.json:", error);
    }
}

// Start het laden zodra de kaart klaar is
map.on('load', loadAirtableData);