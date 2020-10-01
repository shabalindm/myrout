import {FeatureGroup, LatLng, LeafletEvent, Map, Marker, Polyline} from "leaflet";

import L = require("leaflet");
import {TrackPoint} from "./model/TrackPoint";

import {Interval} from "./model/Interval";
import {ArraySequence} from "./sequence/ArraySequence";
import {SequenceIF} from "./sequence/SequenceIF";
import {Util} from "./Util";
import {TrackModel} from "./model/TrackModel";
import {TrackSegment} from "./model/TrackSegment";
import {LineString, MultiLineString} from "geojson";
import {TrackModelService} from "./TrackModelService";
import {Binding} from "./sequence/Binding";

/**
 * Карта с нанесенными на нее объектами
 */
export class TripMap {
    private map: Map;
    //todo -вроде не нужна
    private model: TrackModel;
    private trackModelService: TrackModelService;
    private selectionListeners: Array<() => void> = [];


    private selectedLines: Polyline[] = [];
    //привязанные к точкам трека и отсортированные в правильном порядке объекты модели
    private sequenceArray: Binding [];
    //последовательнось для пролистывания элементов модели.
    private sequence: SequenceIF<Binding>;

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
            const marker: Marker = L.marker([mark.lat,  mark.lng], {icon: markerIcon, opacity:50, title: mark.name});
            marker.addTo(map).on('click', (event: LeafletEvent) => {
             // this.clearSelection();

            }
            );
        });
        this.sequenceArray = this.getSequenceArray();

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
            const [selectedInterval, selectedIndex] = TripMap.findMinCoveringInterval(this.sequenceArray, clickedPoint.date);
            //Если тыкнули на уже выделенный интервал - снимаем выделение
            if (this.sequence != null && selectedInterval != null && selectedInterval === this.sequence.current().object) {
                this.sequence = null;
            } else if(selectedInterval){
                this.sequence = new ArraySequence(this.sequenceArray, selectedIndex);
            }
            this.highlightSelected();
            this.fireSelected();
        });
    }

    public nextInterval() {
        if (this.sequence == null) {
            this.sequence = new ArraySequence(this.sequenceArray, 0);
        } else {
            if (this.sequence.hasNext()) {
                this.sequence.next();
            }
        }
        this.highlightSelected();
    }

    public prevInterval() {
        if (this.sequence != null && this.sequence.hasPrev()) {
            this.sequence.prev();
        } else {
            this.sequence = null;
        }
        this.highlightSelected();
    }

    public hasNextInterval(): boolean {
        if (this.sequence == null) {
            return this.sequenceArray.length > 0;
        }
        return this.sequence.hasNext();
    }

    public hasPrevInterval() {
        return this.sequence != null;
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
//todo oчень похожая функция, надо оптимизировать.
    private static findNearestTrackPoint(target: LatLng, model: TrackModel): TrackPoint {
        let res = model.segments[0].points[0];
        for (const segment of model.segments) {
            let dist = TripMap.roughDistance(segment.points[0], target);//todo - может, нужна точная функция

            for (const point of segment.points) {
                const dist1 = TripMap.roughDistance(point, target);
                if (dist > dist1) {
                    dist = dist1;
                    res = point;
                }
            }
        }
        return res;
    }

    private static roughDistance(p1: LatLng, p2: LatLng) {
        return Math.abs(p1.lat - p2.lat) + Math.abs(p1.lng - p2.lng)
    }


    private highlightSelected() {
        //очишаем предыдущее выделение
        for (const line of this.selectedLines) {
            line.remove();
        }

        if (this.sequence) {
            let obj = this.sequence.current().object;
            if(obj instanceof Interval) {
                const interval = obj;
                if (interval) {
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

                }
            }
        }
    }
    private bindObjects(): Binding [] {
        const res : Binding []= [];

        for (const photo of this.model.photos.values()) {   //todo сложность алгоритма n*m
          const point = TripMap.findNearestTrackPoint(new LatLng(photo.lat, photo.lon), this.model) ;
          res.push(new Binding(point, photo));
        }
        for (const photo of this.model.marks) {   //todo сложность алгоритма n*m
            const point = TripMap.findNearestTrackPoint(new LatLng(photo.lat, photo.lng), this.model) ;
            res.push(new Binding(point, photo));
        }

        return res;
    }

    private bindIntervals(): Binding [] {
        const res = [];

        for (const interval of this.model.intervals) {
            for (const trackSegment of this.model.segments) {
                if (trackSegment.points.length == 0) {
                    continue;
                }
                const fromIndex = TrackModelService.binarySearch(trackSegment.points,
                    (point: TrackPoint): boolean => {
                        return point.date >= interval.from;
                    }
                );
                if (fromIndex != trackSegment.points.length) {
                    res.push(new Binding(trackSegment.points[fromIndex], interval));
                }

            }
        }
        return res;
    }

    public getSequenceArray() {
        return this.bindObjects().concat(this.bindIntervals()).sort(
            //Порядок сортировки:
            //1. По дате
            //2. Интервал больше объектов;
            //3. Больший интервал - больше
            (a, b) => {
                const dateDiff = a.point.date.getTime() - b.point.date.getTime();
                if(dateDiff != 0 ) {
                    return dateDiff;
                }
                else if (a.object instanceof Interval && ! (b.object instanceof Interval)){
                    return -1;
                }
                else if (!(a.object instanceof Interval) && b.object instanceof Interval){
                    return 1;
                }
                else if (a.object instanceof Interval && b.object instanceof Interval){
                    return b.object.to.getTime() - a.object.to.getTime();
                }

                return dateDiff;
            }

        );
    }

    public getSelected(): any {
        if (this.sequence)
            return this.sequence.current().object;
        return null;
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

    private static findMinCoveringInterval(arr: Array<Binding>, date: Date): [Interval, number] {
        let res: [Interval, number] = [null, undefined];

        for (let i = 0; i < arr.length; i++) {
            let binding = arr[i];
            if (binding.object instanceof Interval) {
                const interval = binding.object;
                if (interval.from <= date && interval.to >= date) {
                    const oldInterval = res[0];
                    if (!oldInterval || oldInterval.to.getTime() - oldInterval.from.getTime() > interval.to.getTime() - interval.from.getTime()) {
                        res = [interval, i];
                    }
                }
            }
        }
        return res;
    }
}