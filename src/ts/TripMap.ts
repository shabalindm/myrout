import {LatLng, LeafletEvent, LeafletEventHandlerFn, Map, Point, Polyline, polyline} from "leaflet";
import {TripModel} from "./model/TripModel";
import L = require("leaflet");
import {Parser} from "./Parser";
import {TrackPoint} from "./model/TrackPoint";
import {Track} from "./model/Track";
import {Interval} from "./model/Interval";
import {ArraySequence} from "./sequence/ArraySequence";
import {SequenceIF} from "./sequence/SequenceIF";
import {SequenceListSequence} from "./sequence/SequenceListSequence";
import {Util} from "./Util";
import {resolveTxt} from "dns";
import {RouteInfo} from "./RouteInfo";


export class TripMap {
    private map: Map;
    private model:TripModel;

    private selectedLine: Polyline;
    private intervalSequence: SequenceIF<Interval>;

    public constructor(map: Map) {
        this.map = map;
    }

    public setData(data: TripModel) {
         this.model = data;
        // L.marker([51.5, -0.09]).addTo(this.map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
        data.tracks.forEach((track: Track, index:number) => {
            let latLngs = track.points.map((tp: TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
            let trackLine = L.polyline(latLngs, {weight:4, opacity:0.6});
            trackLine.addTo(this.map);
            var myIcon = L.divIcon({iconSize: L.point(4, 4)});
            L.marker([60, 60], {icon: myIcon}).addTo(this.map);
            trackLine.on('click', (event: LeafletEvent) => {
                // @ts-ignore
                let lat = event.latlng.lat;
                // @ts-ignore
                let lng = event.latlng.lng;
                let pointIndex: number = TripMap.findNearestPointIndex(new LatLng(lat, lng), track);
                this.intervalSequence = this.createMutiTrackedIntervalSequence(track, pointIndex);
                this.highlightSelectedInterval();
            });
        });
    }

    public nextInterval() {
        if (this.intervalSequence == null) {
            this.intervalSequence = SequenceListSequence.create(this.model.tracks
                .map((track) => new ArraySequence(track.intervals, 0)), 0);
        } else {
            this.intervalSequence.next();
        }
        this.highlightSelectedInterval();
    }

    public prevInterval(){
        if (this.intervalSequence != null && this.intervalSequence.hasPrev()) {
            this.intervalSequence.prev();
        } else {
            this.intervalSequence = null;
        }
        this.highlightSelectedInterval();
    }

    public hasNextInterval():boolean{
        if(this.intervalSequence == null){
            return this.model.tracks.some((t) =>t.intervals.length>0);
        }
        return this.intervalSequence.hasNext();
    }

    public hasPrevInterval(){
      return this.intervalSequence != null;
    }

    private static findNearestPointIndex(tagert: LatLng, track: Track): number {
        var res = 0;
        var dist = TripMap.routhDistance(track.points[res], tagert);
        for (var i = 1; i < track.points.length; i++) {
            var dist1 = TripMap.routhDistance(track.points[i], tagert);
            if(dist>dist1){
                dist = dist1;
               res = i;
            }
        }
        return  res;

    }

    private static routhDistance(p1:LatLng, p2:LatLng){
        return Math.abs(p1.lat - p2.lat) + Math.abs(p1.lng - p2.lng)
    }



    private highlightSelectedInterval() {
        if (this.selectedLine) { //очишаем предыдущее выделение
            this.selectedLine.remove();
        }
        if (this.intervalSequence) {
            let interval = this.intervalSequence.current();
            if (interval) {
                let latLngs = [];
                for (var i = interval.from; i < interval.to; i++) {
                    let tp = interval.track.points[i];
                    latLngs.push(new LatLng(tp.lat, tp.lng, tp.alt));
                }
                let trackLine = L.polyline(latLngs, {color: "yellow", weight: 7, opacity: 0.8});
                this.selectedLine = trackLine;
                trackLine.addTo(this.map);
            }
        }
    }

    public getCurrentInterval(): Interval{
        if(this.intervalSequence)
            return this.intervalSequence.current();
        return null;
    }

    public getModel():TripModel{
        return this.model;
    }

    createMutiTrackedIntervalSequence(track: Track, selectedPointIndex: number): SequenceIF<Interval> {
        let trackSequence = Util.createIntervalSequence(track, selectedPointIndex);
        if(trackSequence == null){//не выбарли ни одной точки
            return null;
        }
        let arrayOfSeq: Array<SequenceIF<Interval>> = [];
        let trackIndex;
        this.model.tracks.forEach((track: Track, index: number) => {
                if (track === track) {
                    arrayOfSeq.push(trackSequence);
                    trackIndex = index;
                } else {
                    arrayOfSeq.push(new ArraySequence(track.intervals, 0));
                }
            }
        );
        return SequenceListSequence.create(arrayOfSeq, trackIndex);

    }

    public getRouteInfo(): RouteInfo{
        if(this.intervalSequence == null) {
            return new RouteInfo(1, 1, 1, 1, 1, 1, 1, this.model.name, this.model.description)
        }

    }
}