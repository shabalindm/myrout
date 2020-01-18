import {LatLng, LeafletEvent, LeafletEventHandlerFn, Map, polyline} from "leaflet";
import {TripModel} from "./model/TripModel";
import L = require("leaflet");
import {Parser} from "./Parser";
import {TrackPoint} from "./model/TrackPoint";
import {Track} from "./model/Track";
import {Interval} from "./model/Interval";


export class TripMap {
    private map: Map;
    private data:TripModel;
    private btnPrev: HTMLElement = this.get("btn-prev");
    private btnNext: HTMLElement = this.get("btn-next");

    public constructor(map: Map) {
        this.map = map;
        this.btnNext.addEventListener("click",(e) => {
            this.nextInterval();
        });
    }

    private get(id:string){
        return document.getElementById(id)
    }

    public setData(data: TripModel) {
         this.data = data;
        // L.marker([51.5, -0.09]).addTo(this.map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
        data.tracks.forEach((track: Track) => {
            let latLngs = track.points.map((tp: TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
            let trackLine = L.polyline(latLngs, {weight:4, opacity:0.6});
            trackLine.addTo(this.map);
            var myIcon = L.divIcon({iconSize: L.point(4, 4)});
            L.marker([60, 60], {icon: myIcon}).addTo(this.map);
            trackLine.on('click', (event: LeafletEvent) => {

            });
        });

        let testInterval = new Interval();
        testInterval.from = 1;
        testInterval.to = 4;
        this.highlightInterval(data.tracks[0], testInterval);
    }




    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.setData(tripData);
    }


    private nextInterval() {

    }

    private highlightInterval(track: Track, interval:Interval) {
        let latLngs = [];
        for(var i = interval.from; i < interval.to; i++){
            let tp = track.points[i];
            latLngs.push(new LatLng(tp.lat, tp.lng, tp.alt));
        }
        debugger;
        let trackLine = L.polyline(latLngs, {color:"yellow", weight:7, opacity:0.8});
        trackLine.addTo(this.map);
    }


}