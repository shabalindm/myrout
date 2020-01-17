import {LatLng, LeafletEvent, LeafletEventHandlerFn, Map, polyline} from "leaflet";
import {TripData} from "./model/TripData";
import L = require("leaflet");
import {Parser} from "./Parser";
import {RoutInterval} from "./RoutInterval";
import {TrackPoint} from "./TrackPoint";

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
        let latLngs = data.track.map((tp:TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
        let trackLine = L.polyline(latLngs);
        trackLine.addTo(this.map);
        var myIcon = L.divIcon({iconSize: L.point(4, 4)});
        L.marker([60, 60], {icon: myIcon}).addTo(this.map);
        trackLine.on('click', (event: LeafletEvent) => {

        });

        let r = new RoutInterval();
        r.fromPoint = this.data.track[0];
        r.toPoint = this.data.track[1];
        this.highlightInterval(this.getIntervalPoints(r));
    }




    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.setData(tripData);
    }


    private nextInterval() {

    }

    private highlightInterval(trackPoints: Array<TrackPoint>) {
        let latLngs = trackPoints.map((tp:TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
        let trackLine = L.polyline(latLngs);
        trackLine.addTo(this.map);
    }

    private getIntervalPoints(interval: RoutInterval) {
        let points = this.data.track;
        let cur = 0;
        while (interval.fromPoint !== points[cur] && cur < points.length - 1) {
            cur++;
        }
        let fromIndex = cur;

        while (interval.toPoint !== points[cur] && cur < points.length - 1) {
            cur++;
        }
        let toIndex = cur;

        const trackPoints = points.slice(fromIndex, toIndex + 1);
        return trackPoints;
    }
}