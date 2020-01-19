import L = require("leaflet");
import {TripMap} from "./TripMap";
import {TripViewer} from "./TripViewer";

// let map = new L.Map('map', {
//     center: new L.LatLng(40.731253, -73.996139),
//     zoom: 12,
// });

var map = L.map('map').setView([60, 60], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let tMap = new TripMap(map);
let tripViewer = new TripViewer(tMap);
// @ts-ignore
//Ну не знаю я, как по другому сделать этот объект доступным с веб-страницы.
window.TMap = tripViewer;

