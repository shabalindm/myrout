import {FeatureGroup, LatLng, LeafletEvent, Map, Polyline} from "leaflet";

import L = require("leaflet");
import {TrackPoint} from "./model/TrackPoint";

import {Interval} from "./model/Interval";
import {ArraySequence} from "./sequence/ArraySequence";
import {SequenceIF} from "./sequence/SequenceIF";
import {Util} from "./Util";
import {RouteInfo} from "./RouteInfo";
import {TrackModel} from "./model/TrackModel";
import {TrackSegment} from "./model/TrackSegment";
import {LineString, MultiLineString} from "geojson";
import {TrackModelService} from "./TrackModelService";

/**
 * Карта с нанесенными на нее объектами
 */
export class TripMap {
    private map: Map;
    //todo -вроде не нужна
    private model: TrackModel;
    private trackModelService: TrackModelService;
    private intervalSelectedListeners: Array<() => void> = [];


    private selectedLines: Polyline[] = [];
    private intervalSequence: SequenceIF<Interval>;

    public constructor(map: Map) {
        this.map = map;
    }

    public setModel(trackModelService: TrackModelService) {
        this.trackModelService =  trackModelService;
        this.model = trackModelService.model;
        const model = this.model;
        // L.marker([51.5, -0.09]).addTo(this.map)
        //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        //     .openPopup();
        const map = this.map;
        model.segments.forEach((track: TrackSegment, index: number) => {
            const latLngs = track.points.map((tp: TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
            const trackLine = L.polyline(latLngs, {weight: 4, opacity: 0.6});
            trackLine.addTo(map);

            this.addTrackOnClickListener(trackLine, track);
        });

        const photoIcon = L.icon({
            iconUrl: Util.getUrl('ico/camera.svg'),

            iconSize:     [20, 20], // size of the icon
            // shadowSize:   [50, 64], // size of the shadow
            // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            // shadowAnchor: [4, 62],  // the same for the shadow
           // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        model.photos.forEach((photo)=>{
            const marker = L.marker([photo.lat,  photo.lon], {icon: photoIcon});
            marker.addTo(map);

            var photoImg = '<img src=' + photo.url +   ' height="120px"/>'
             + 'Фото ' + photo.number + '. ' + photo.name;


            marker.bindPopup(photoImg,  {
                // @ts-ignore
                maxWidth: "auto"
            })

        });

        const markerIcon =  L.icon({
            iconUrl: Util.getUrl('ico/location.svg'),
            iconSize:     [20, 20],
            iconAnchor:   [10, 20]
        });

        model.marks.forEach(mark =>{
            const marker = L.marker([mark.lat,  mark.lng], {icon: markerIcon, opacity:50, title: mark.name});
            marker.addTo(map);
            var popup = `<b>${mark.name}</b><br/> ${mark.description?mark.description: ''}`


            marker.bindPopup(popup,  {
                // @ts-ignore
             //   maxWidth: "auto"
            })
        });

        //В помощь разработчику, чтобы он всегда мог найти координтаты места на карте
        map.on('click', event => {
            // @ts-ignore
            const latlng = event.latlng;
            console.log(`"lat": ${latlng.lat.toFixed(6)}, "lng": ${latlng.lng.toFixed(6)}`)
        })

        L.control.scale().addTo(map);

        // map.whenReady(() => {
        //     console.log('Map ready');
        //     setTimeout(() => {
        //         debugger;
        //         map.invalidateSize();
        //     }, 3000);
        // });
    }



    private addTrackOnClickListener(trackLine: Polyline<LineString | MultiLineString, any>, track: TrackSegment) {
        trackLine.on('click', (event: LeafletEvent) => {
            // @ts-ignore
            let lat = event.latlng.lat;
            // @ts-ignore
            let lng = event.latlng.lng;
            let clickedPoint: TrackPoint = TripMap.findNearestPointIndex(new LatLng(lat, lng), track);
            const intervalSequence = Util.createIntervalSequence(this.model.intervals, clickedPoint.date);
            //Если тыкнули на уже выделенный интервал - снимаем выделение
            if (this.intervalSequence != null && intervalSequence != null && intervalSequence.current() === this.intervalSequence.current()) {
                this.intervalSequence = null;
            } else {
                this.intervalSequence = intervalSequence;
            }
            this.highlightSelectedInterval();
            this.intervalSelected();
        });
    }

    public nextInterval() {
        if (this.intervalSequence == null) {
            this.intervalSequence = new ArraySequence(this.model.intervals, 0);
        } else {
            if (this.intervalSequence.hasNext()) {
                this.intervalSequence.next();
            }
        }
        this.highlightSelectedInterval();
    }

    public prevInterval() {
        if (this.intervalSequence != null && this.intervalSequence.hasPrev()) {
            this.intervalSequence.prev();
        } else {
            this.intervalSequence = null;
        }
        this.highlightSelectedInterval();
    }

    public hasNextInterval(): boolean {
        if (this.intervalSequence == null) {
            return this.model.intervals.length > 0;
        }
        return this.intervalSequence.hasNext();
    }

    public hasPrevInterval() {
        return this.intervalSequence != null;
    }

    /**
     * Находит ближайшую к заданной точку трека
     * @param target точка на карте.
     * @param segment - сегмент трека
     *
     */
    //Здесь в принципе можно выдавать пару точке, и интевал затем определять по паре, может быть так оно будет симпатичнее смотреться
    private static findNearestPointIndex(target: LatLng, segment: TrackSegment): TrackPoint {
        let res = segment.points[0];
        let dist = TripMap.roughDistance(segment.points[0], target);

        for (const point of segment.points) {
            const dist1 = TripMap.roughDistance(point, target);
            if (dist > dist1) {
                dist = dist1;
                res = point;
            }
        }
        return res;

    }

    private static roughDistance(p1: LatLng, p2: LatLng) {
        return Math.abs(p1.lat - p2.lat) + Math.abs(p1.lng - p2.lng)
    }


    private highlightSelectedInterval() {
        //очишаем предыдущее выделение
        for (const line of this.selectedLines) {
            line.remove();
        }

        if (this.intervalSequence) {
            let interval = this.intervalSequence.current();
            if (interval) {
                for (const segment of this.model.segments) {
                    let latLngs = [];
                    //todo - можно оптимизировать
                    for (const point of segment.points) {
                        if(point.date >= interval.from && point.date <= interval.to){
                            latLngs.push(new LatLng(point.lat, point.lng));
                        }
                    }
                    let trackLine = L.polyline(latLngs, {color: "yellow", weight: 7, opacity: 0.8, bubblingMouseEvents: true});
                    this.selectedLines.push(trackLine);
                    trackLine.addTo(this.map);
                    //новая линия перекрывает старую, так что на нее надо слушатель таки повесить (как сделать по-другому не разобрался)
                    this.addTrackOnClickListener(trackLine, segment);
                }

            }
        }
    }

    public getCurrentInterval(): Interval {
        if (this.intervalSequence)
            return this.intervalSequence.current();
        return null;
    }

    public getModel(): TrackModel {
        return this.model;
    }

    public getRouteInfo(): RouteInfo {
        if (this.intervalSequence == null) {
            return new RouteInfo(1, 1, 1, 1, 1, 1, 1, this.model.name, this.model.description)
        }

    }

    addIntervalSelectedListener(param: () => void) {
        this.intervalSelectedListeners.push(param);
    }

    intervalSelected() {
        this.intervalSelectedListeners.forEach(l => l());
    }

}