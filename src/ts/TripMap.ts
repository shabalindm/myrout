import {LatLng, LeafletEvent, LeafletEventHandlerFn, Map, polyline} from "leaflet";
import {TripData} from "./model/TripData";
import L = require("leaflet");
import {Parser} from "./Parser";
import {RoutInterval} from "./model/RoutInterval";

export class TripMap {
    private map: Map;
    private data:TripData;
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

    public setData(data: TripData) {
        this.data = data;
        // L.marker([51.5, -0.09]).addTo(this.map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
        let latLngs = data.track.map((tp) => new LatLng(tp.lat, tp.lng, tp.alt));
        let trackLine = L.polyline(latLngs);
        trackLine.addTo(this.map);
        var myIcon = L.divIcon({iconSize: L.point(4, 4)});
        L.marker([60, 60], {icon: myIcon}).addTo(this.map);
        trackLine.on('click', (event: LeafletEvent) => {

        });

        let r = new RoutInterval();
        r.fromPoint = this.data.track[0];
        r.toPoint = this.data.track[1];
        this.highlightInterval(r);
    }




    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.setData(tripData);
    }


    private nextInterval() {

    }

    private highlightInterval(interval: RoutInterval){
       let points = this.data.track;
       let i = 0;
       debugger;
       //доходим до начала участка пути
       while (interval.fromPoint !== points[i] && i < points.length){
           i++;
       }
       // раскрашиваем
        let toHighlight: Array<LatLng> = [];
        while (interval.toPoint !==points[i] && i < points.length) {
            toHighlight.push(new LatLng(points[i].lat, points[i].lng));
            i++;
        };

        let trackLine = L.polyline(toHighlight, {weight:2, color:"red"});
        trackLine.addTo(this.map);
    }
}