import {FeatureGroup, LatLng, LeafletEvent, Map, Marker, Polyline} from "leaflet";

import L = require("leaflet");
import {TrackPoint} from "./model/TrackPoint";

import {Interval} from "./model/Interval";
import {ArraySequence} from "./sequence/ArraySequence";
import {Util} from "./Util";
import {TrackModel} from "./model/TrackModel";
import {TrackSegment} from "./model/TrackSegment";
import {LineString, MultiLineString} from "geojson";
import {TrackModelService} from "./TrackModelService";
import {Binding} from "./sequence/Binding";
import {Mark} from "./model/Mark";
import {Photo} from "./model/Photo";

/**
 * Карта с нанесенными на нее объектами
 */
export class TripMap {
    private map: Map;
    //todo -вроде не нужна
    private model: TrackModel;
    private trackModelService: TrackModelService;
    //последовательнось для пролистывания элементов модели.
    private sequence: ArraySequence<Binding>;
    private selectedObject: Interval|Marker = null;

    //Подсветка объектов на карте
    private selectedLines: Polyline[] = [];
    private selectedMarker: Marker;


    //Срабатывают при выделение/снятии выделения элемента карты.
    private selectionListeners: Array<() => void> = [];

    public constructor(map: Map) {
        this.map = map;
    }

    public setModel(trackModelService: TrackModelService) {
        this.trackModelService =  trackModelService;
        this.model = trackModelService.model;
        const model = this.model;
        const map = this.map;

        //наносим трек
        model.segments.forEach((track: TrackSegment, index: number) => {
            const latLngs = track.points.map((tp: TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
            const trackLine = L.polyline(latLngs, {weight: 4, opacity: 0.6});
            trackLine.addTo(map);
            this.addTrackOnClickListener(trackLine, track);
        });

        //фотографии
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

            marker.addTo(map).on('click', (event: LeafletEvent) => {
                    this.select(photo);
                    this.fireSelected();
                }
            );

        });

        //маркеры
        const markerIcon =  L.icon({
            iconUrl: Util.getUrl('ico/location.svg'),
            iconSize:     [20, 20],
            iconAnchor:   [10, 20]
        });

        model.marks.forEach(mark =>{
            const marker: Marker = L.marker([mark.lat,  mark.lng], {icon: markerIcon, opacity:50, title: mark.name});
            marker.addTo(map).on('click', (event: LeafletEvent) => {
                this.select(mark);
                this.fireSelected();
            }
            );
        });

        this.sequence = new ArraySequence<Binding>(this.trackModelService.getSequenceArray());

        //В помощь разработчику, чтобы он всегда мог найти координтаты места на карте
        map.on('click', event => {
            // @ts-ignore
            const latlng = event.latlng;
            console.log(`"lat": ${latlng.lat.toFixed(6)}, "lng": ${latlng.lng.toFixed(6)}`)
        })

        L.control.scale().addTo(map);

    }

    private addTrackOnClickListener(trackLine: Polyline, track: TrackSegment) {
        trackLine.on('click', (event: LeafletEvent) => {
            // @ts-ignore
            let lat = event.latlng.lat;
            // @ts-ignore
            let lng = event.latlng.lng;
            let clickedPoint: TrackPoint = TripMap.findNearestPointIndex(new LatLng(lat, lng), track);
            if (!TripMap.findMinCoveringInterval(this.sequence, clickedPoint.date)) {
                this.sequence.begin();
                this.selectedObject = null;
            } else {
                const object = this.sequence.current().object;
                if (object === this.selectedObject) { //Если тыкнули на уже выделенный интервал - снимаем выделение
                    this.selectedObject = null;
                    this.sequence.begin();
                } else {
                    this.selectedObject = object;
                }
            }
            this.highlightSelected();
            this.fireSelected();
        });
    }

    public next() {
        if (!this.selectedObject) {
            this.sequence.begin();
        } else {
            if (this.sequence.hasNext()) {
                this.sequence.next();
            }
        }
        this.selectedObject = this.sequence.current().object
        this.highlightSelected();
    }

    public prev() {
        if (this.sequence.hasPrev()) {
            this.sequence.prev();
            this.selectedObject = this.sequence.current().object;
        } else {
            this.selectedObject = null;
        }

        this.highlightSelected();
    }

    public hasNext(): boolean {
        if (!this.selectedObject) {
            return this.sequence.array.length > 0;
        }
        return this.sequence.hasNext();
    }

    public hasPrev() {
        return !!this.selectedObject;
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

    public select(obj: any) {
        this.sequence.goTo(b => b.object == obj);
        this.selectedObject = this.sequence.current().object;
        this.highlightSelected();
    }

    private highlightSelected() {
        //очищаем предыдущее выделение
        for (const line of this.selectedLines) {
            line.remove();
        }
        this.selectedLines =[];

        if(this.selectedMarker) {
            this.selectedMarker.remove();
            this.selectedMarker = null;
        }

        if (this.selectedObject) {
            let obj = this.selectedObject;

            if (obj instanceof Interval) {
                const interval = obj;

                for (const segment of this.model.segments) {
                    let latLngs = [];
                    //todo - можно оптимизировать
                    for (const point of segment.points) {
                        if (point.date >= interval.from && point.date <= interval.to) {
                            latLngs.push(new LatLng(point.lat, point.lng));
                        }
                    }
                    let trackLine = L.polyline(latLngs, {
                        color: "yellow",
                        weight: 7,
                        opacity: 0.8,
                        bubblingMouseEvents: true
                    });
                    this.selectedLines.push(trackLine);
                    trackLine.addTo(this.map);
                    //новая линия перекрывает старую, так что на нее надо слушатель таки повесить (как сделать по-другому не разобрался)
                    this.addTrackOnClickListener(trackLine, segment);
                }

            } else if (obj instanceof Mark) {//не используется
                const markerIcon = L.icon({
                    iconUrl: Util.getUrl('ico/location-highlite.svg'),
                    iconSize: [20, 20],
                });

                const marker: Marker = L.marker([obj.lat, obj.lng], {
                    icon: markerIcon,
                    opacity: 50,
                    title: obj.name
                });
                marker.addTo(this.map).on('click', (event: LeafletEvent) => {
                        this.clearSelection();
                    }
                );
                this.selectedMarker = marker;
            }
            else if (obj instanceof Photo) {
                const markerIcon = L.icon({
                    iconUrl: Util.getUrl('ico/camera-selected.svg'),
                    iconSize: [30, 30],
                });

                const marker: Marker = L.marker([obj.lat, obj.lon], {
                    icon: markerIcon,
                    opacity: 50
                });
                marker.addTo(this.map).on('click', (event: LeafletEvent) => {
                        this.clearSelection();
                    }
                );
                this.selectedMarker = marker;
            }
        }
    }

    public getSelected(): any {
        return this.selectedObject;
    }

    public getModel(): TrackModel {
        return this.model;
    }


    addSelectionListener(param: () => void) {
        this.selectionListeners.push(param);
    }

    fireSelected() {
        this.selectionListeners.forEach(l => l());
    }

    private static findMinCoveringInterval(sequence: ArraySequence<Binding>, date: Date): boolean {
        const arr = sequence.array;
        let resIndex = undefined;

        for (let i = 0; i < arr.length; i++) {
            let binding = arr[i];
            if (binding.object instanceof Interval) {
                const interval = binding.object;
                if (interval.from <= date && interval.to >= date) {
                    if (!resIndex) {
                        resIndex = i;
                    } else {
                        const oldInterval = arr[resIndex].object;
                        if (!oldInterval || oldInterval.to.getTime() - oldInterval.from.getTime() > interval.to.getTime() - interval.from.getTime()) {
                            resIndex = i
                        }
                    }
                }
            }
        }
        if(resIndex){
            sequence.cur = resIndex;
            return true;
        }
        return false;
    }

    private clearSelection() {
        this.selectedObject = null;
        this.highlightSelected();
        this.fireSelected();
    }

    getMap() {
        return this.map;
    }
}