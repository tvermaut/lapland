const colorPalette = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#00ced1', '#a65628'];
const groupColors = {};
let colorIndex = 0;
const map = new ol.Map({
target: 'map',
layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
view: new ol.view.View({ center: ol.proj.fromLonLat([25.0, 67.0]), zoom: 5 })
});
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({ source: vectorSource });
map.addLayer(vectorLayer);

function updateLegend(groep, color) {
const legendItems = document.getElementById('legend-items');
if (!legendItems) return;
const item = document.createElement('div');
item.className = 'legend-item';
item.innerHTML = '<span class="color-dot" style="background-color: ' + color + '"></span> ' + groep;
legendItems.appendChild(item);
}
fetch('data.json')
.then(r => r.json())
.then(records => {
const features = records.map(record => {
const f = record.fields;
if (!f.lat || !f.lng) return null;
if (!groupColors[f.groep]) {
groupColors[f.groep] = colorPalette[colorIndex % colorPalette.length];
colorIndex++;
updateLegend(f.groep, groupColors[f.groep]);
}

const feature = new ol.Feature({
geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(f.lng), parseFloat(f.lat)])),
lbl: f.lbl,
groep: f.groep
});
feature.setStyle(new ol.style.Style({
image: new ol.style.Circle({
radius: 7,
fill: new ol.style.Fill({ color: groupColors[f.groep] }),
stroke: new ol.style.Stroke({ color: 'white', width: 2 })
}),
text: new ol.style.Text({
text: f.lbl, offsetY: -15, font: 'bold 12px sans-serif',
fill: new ol.style.Fill({ color: '#000' }),
stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
})
}));
return feature;
}).filter(f => f !== null);
vectorSource.addFeatures(features);
if (features.length > 0) {
map.getView().fit(vectorSource.getExtent(), { padding: [50, 50, 50, 50] });
}
}).catch(err => console.error(err));