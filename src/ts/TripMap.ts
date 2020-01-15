import {LatLng, LeafletEvent, LeafletEventHandlerFn, Map, polyline} from "leaflet";
import {TripData} from "./TripData";
import L = require("leaflet");
import {Parser} from "./Parser";

export class TripMap {
    private map: Map;

    public constructor(map: Map) {
        this.map = map;
    }

    public setData(data: TripData) {
        // L.marker([51.5, -0.09]).addTo(this.map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
        let latLngs = data.track.map((tp) => new LatLng(tp.lat, tp.lng, tp.alt));
        let trackLine = L.polyline(latLngs);
        trackLine.addTo(this.map);
        var myIcon = L.divIcon({iconSize: L.point(4, 4)});
        L.marker([60, 60], {icon: myIcon}).addTo(this.map);
        trackLine.on('click',(event: LeafletEvent)=>{

        })



    }

    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.setData(tripData);
    }


}