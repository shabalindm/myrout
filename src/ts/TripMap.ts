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


export class TripMap {
    private map: Map;
    private data:TripModel;
    private btnPrev: HTMLElement = this.get("btn-prev");
    private btnNext: HTMLElement = this.get("btn-next");
    private selectedLine: Polyline;
    private intervalSequence: SequenceIF<Interval>;

    public constructor(map: Map) {
        this.map = map;
    }

    private get(id:string){
        return document.getElementById(id)
    }

    public setData(data: TripModel) {
         this.data = data;
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
                this.highlightInterval(this.intervalSequence.current());
                this.highlightNavigationButtons();
            });
        });

        this.btnNext.addEventListener('click', () => {
            if(this.intervalSequence == null){
                this.intervalSequence = new SequenceListSequence(this.data.tracks
                    .map((track) => new ArraySequence(track.intervals, 0)), 0);
            } else {
                if(this.intervalSequence.hasNext()){
                    this.intervalSequence.next();
                }
            }
            this.highlightInterval(this.intervalSequence.current());
            this.highlightNavigationButtons();
        });
        this.btnPrev.addEventListener('click', () => {
            if (this.intervalSequence != null && this.intervalSequence.hasPrev()) {
                this.intervalSequence.prev();
                this.highlightInterval(this.intervalSequence.current());
            } else {
                this.intervalSequence = null;
                this.highlightInterval(null);
            }
            this.highlightNavigationButtons();
        });

        this.highlightNavigationButtons();

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



    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.setData(tripData);
    }


    private highlightInterval(interval: Interval) {
        if (this.selectedLine) {
            this.selectedLine.remove();
        }
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

    createMutiTrackedIntervalSequence(track: Track, selectedPointIndex: number): SequenceIF<Interval> {
        let trackIndex;
        let arrayOfSeq: Array<SequenceIF<Interval>> = [];

        this.data.tracks.forEach((track: Track, index: number) => {
                if (track === track) {
                    arrayOfSeq.push(TripMap.createIntervalSequence(track, selectedPointIndex));
                    trackIndex = index;
                } else {
                    arrayOfSeq.push(new ArraySequence(track.intervals, 0));
                }
            }
        );
        return new SequenceListSequence(arrayOfSeq, trackIndex);

    }



    /**
     * Берем точку на треку, и выстраиваем от нее последовательность интервалов, которые ее покрывают.
     * Последовательность такая: сначала все интервалы, покрывающие точку, начиная с самого малого,
     * затем все остальныe в естественной последовательности.
     * @param selectedPointIndex
     * @param track
     */
    static createIntervalSequence(track:Track, selectedPointIndex: number): SequenceIF<Interval>{
        var before: Array<Interval> = [];
        var after: Array<Interval> = [];
        var covering: Array<Interval> = [];

        for (var i = 0; i < track.intervals.length; i++) {
            let interval = track.intervals[i];
            if(interval.to  <= i){//заканчиваются до выбаранной точки
                before.push(interval)
            } else if(interval.from > i){//начинаюстя после выбранной точки
                after.push(interval)
            } else {
                covering.push(interval);
            }
        }
        debugger;
        if(covering.length == 0){
            return null;
        }
        covering.sort((a, b) =>  (a.to - a.from) - (b.to - b.from));//Начиная с самых коротких

        var cur = before.length;
        return new ArraySequence(before.concat(covering).concat(after), cur);
    }


    private highlightNavigationButtons() {
        if(this.intervalSequence == null){
            this.enableNavigateButton(this.btnNext, true);
            this.enableNavigateButton(this.btnPrev, false);
        } else {
            this.enableNavigateButton(this.btnNext, this.intervalSequence.hasNext());
            this.enableNavigateButton(this.btnPrev, true);
        }
    }

    private enableNavigateButton(btn: HTMLElement, enable: boolean) {
        if (enable) {
            btn.classList.remove("disabled");
            btn.classList.add("enabled");
            //btn.setAttribute("disabled", "false");
        } else {
            btn.classList.remove("enabled");
            btn.classList.add("disabled");
           // btn.setAttribute("disabled", "true");
        }
    }
}