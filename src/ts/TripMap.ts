import {
    FeatureGroup,
    latLng,
    LatLng,
    LatLngExpression,
    LayerGroup,
    LeafletEvent,
    Map,
    Marker,
    Point,
    Polyline
} from "leaflet";

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
import {Settings} from "./Settings";
import {ContextMenu} from "./ContextMenu";
import {MenuAction} from "./MenuAction";
import {EditForm} from "./EditForm";
import {makeResolver} from "ts-loader/dist/resolver";

/**
 * Карта с нанесенными на нее объектами
 */
export class TripMap {
    private map: Map;
    private _trackModelService: TrackModelService;
    //последовательнось для пролистывания элементов модели. (там сейчас только интервалы)
    private sequence: ArraySequence<Binding>;
    private _contextMenu: ContextMenu;
    private selectedObject: Interval = null;
    private _selectedPhoto: Photo = null;//фото выделяется независимо от интервалов.
    private markerLayer: LayerGroup;
    private photoLayer: LayerGroup;


    //Подсветка объектов на карте
    private selectedLines: Polyline[] = [];
    private selectedPhotoMarker: Marker = null;


    //Срабатывают при выделение/снятии выделения элемента карты.
    private selectionListeners: Array<() => void> = [];

    public constructor(map: Map, trackModelService: TrackModelService, contextMenu: ContextMenu) {
        this.map = map;
        this._contextMenu = contextMenu;
        this.markerLayer = new LayerGroup().addTo(map);
        this.photoLayer = new LayerGroup().addTo(map)
        this.setModel(trackModelService)
    }

    private setModel(trackModelService: TrackModelService) {
        this._trackModelService =  trackModelService;
        const model = trackModelService.model;
        const map = this.map;

        this.map.addEventListener('click', (event: LeafletEvent) => {
                    this.deselectPhoto();
        });

        //наносим трек
        model.segments.forEach((track: TrackSegment, index: number) => {
            const latLngs = track.points.map((tp: TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
            const trackLine = L.polyline(latLngs, {weight: 4, opacity: 0.6});
            trackLine.addTo(map);
            this.addTrackOnClickListener(trackLine, track);
        });
        this.drawMarkers();

        this.sequence = new ArraySequence<Binding>(this._trackModelService.getSequenceArray());

        if (Settings.editMode) {
            this.applyDevMode(trackModelService, map);
        }

        L.control.scale().addTo(map);

    }

    private drawMarkers() {
        let model =this._trackModelService.model;
        let map= this.map;
        this.renerPhotos();
        this.renderMarkers();
    }

    private renderMarkers() {
        let model = this._trackModelService.model;
        let map = this.map;
        this.markerLayer.clearLayers();
        //маркеры
        const markerIcon = L.icon({
            iconUrl: Util.getUrl('ico/location.svg'),
            iconSize: [20, 20],
            iconAnchor: [10, 20]
        });

        model.marks.forEach(mark => {
            const marker: Marker = L.marker([mark.lat, mark.lng], {icon: markerIcon, opacity: 50, title: mark.name});
            var popup = `<b>${mark.name}</b><br/> ${mark.description ? mark.description : ''}`
            marker.addTo(this.markerLayer);
            if (Settings.editMode) {
                this.rightMenuOnMark(marker, mark);
            }
            marker.bindPopup(popup, {
                // @ts-ignore
                //   maxWidth: "auto"
            });
            marker.on('click', (event: LeafletEvent) => {
                    this.deselectPhoto();
                }
            );
        });
    }


    private renerPhotos() {
        let model = this._trackModelService.model;
        let map = this.map;
        this.photoLayer.clearLayers();
        const photoIcon = L.icon({
            iconUrl: Util.getUrl('ico/camera.svg'),

            iconSize: [20, 20], // size of the icon
            // shadowSize:   [50, 64], // size of the shadow
            // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            // shadowAnchor: [4, 62],  // the same for the shadow
            // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        model.photos.forEach((photo) => {
            const marker = L.marker([photo.lat, photo.lng], {icon: photoIcon});
            marker.addTo(this.photoLayer);
            marker.on('click', (event: LeafletEvent) => {
                    if (this.selectedPhotoMarker) {
                        this.selectedPhotoMarker.remove();
                    }
                    this._selectedPhoto = photo;
                    const markerIcon = L.icon({
                        iconUrl: Util.getUrl('ico/camera-selected.svg'),
                        iconSize: [30, 30]
                    });

                    const marker: Marker = L.marker([photo.lat, photo.lng], {
                        icon: markerIcon,
                        opacity: 50,
                        zIndexOffset: 100
                    });
                    this.selectedPhotoMarker = marker;
                    marker.addTo(this.map).on('click', (event: LeafletEvent) => {
                            this.deselectPhoto();
                        }
                    );
                if (Settings.editMode) {
                    this.rightMenuOnPhotoMarker(marker, photo);
                }

                this.fireSelected();
                }
            );
            if (Settings.editMode) {
                this.rightMenuOnPhotoMarker(marker, photo);
            }


        });
    }


    private moveObjAction(obj: LatLng, renderFunction: () => void) {
        this.choosePosition((newPosition => {
            obj.lng = newPosition.lng;
            obj.lat = newPosition.lat;
            renderFunction()
        }));
    }

    private choosePosition(onEndFuntion: (newPosition:LatLng) => void) {
        this.map.getContainer().style.cursor = 'crosshair';
        const eventCancelled = [false]
        this.map.addOneTimeEventListener("click", (e) => {
            this.map.getContainer().style.cursor = '';
            if (!eventCancelled[0]) {
                // @ts-ignore
                var latlng = e.latlng;
                onEndFuntion(latlng);
            }
        });
        this.map.addOneTimeEventListener("contextmenu", (e) => {
            this.map.getContainer().style.cursor = '';
            eventCancelled[0] = true;
        });
    }

    private applyDevMode(trackModelService: TrackModelService, map: Map) {
       trackModelService.model.segments.forEach(segment => {
           trackModelService.getPauses(segment).forEach(([a, b]) => {
               const latLngs: Array<LatLngExpression> = [];
               for(let i = a; i <=b; i++){
                  latLngs.push(segment.points[i]);
               }
               const line = L.polyline(latLngs, {weight: 4, opacity: 0.6, color:'red'});
               line.addTo(map);
               //todo - это не надо вычислять сразу
               var dateFormat = {
                   hour: 'numeric',
                   minute: 'numeric',
                   second: 'numeric',
               };
               line.bindPopup("Остановка " + segment.points[a].date.toLocaleTimeString() +  " - " +  segment.points[b].date.toLocaleTimeString());

           })

       })


    }

    private deselectPhoto() {
        if(this.selectedPhoto) {
            this._selectedPhoto = null;
            this.selectedPhotoMarker.remove();
            this.selectedPhotoMarker = null;
            this.fireSelected();
        }
    }

    private addTrackOnClickListener(trackLine: Polyline, track: TrackSegment) {
        trackLine.on('click', (event: LeafletEvent) => {
            this.deselectPhoto();
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

    private  findNearestPointIndexForTrack(target: LatLng): TrackPoint {
        let res = this.trackModelService.model.segments[0].points[0];
        let dist = TripMap.roughDistance(res, target);
        this.trackModelService.model.segments.forEach(segment => {
            for (const point of segment.points) {
                const dist1 = TripMap.roughDistance(point, target);
                if (dist > dist1) {
                    dist = dist1;
                    res = point;
                }
            }
        });
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

        if (this.selectedObject) {
            let obj = this.selectedObject;

            if (obj instanceof Interval) {
                const interval = obj;

                for (const segment of this.trackModelService.model.segments) {
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
                    if(Settings.editMode) {
                        this.rightMenuOnTrackLine(trackLine, interval);
                    }


                }

            }
        }
    }

    public addMark(){
        this.choosePosition(latLng =>{
            new EditForm(this.map).showForCommonObject(latLng, null, (obj) => {
                const mark = new Mark(obj.name, obj.description, latLng.lat, latLng.lng, null);
                this.trackModelService.addMark(mark);
                this.renderMarkers();
            })
        })
    }
    public addPhoto(){
        this.choosePosition(latLng =>{
            new EditForm(this.map).showForPhoto(latLng, null, (obj) => {
                const photo = new Photo(obj.url,'1', obj.name, undefined, latLng.lat, latLng.lng);
                this.trackModelService.addPhoto(photo);
                this.renerPhotos();
            })
        })
    }

    public addInterval(){
        this.choosePosition(latLng1 =>{
            this.choosePosition(latLng2 =>{
                new EditForm(this.map).showForCommonObject(latLng2, null, (obj => {
                    let point1 = this.findNearestPointIndexForTrack(latLng1);
                    let point2 = this.findNearestPointIndexForTrack(latLng2);
                    if(point1.date==point2.date){
                        return
                    }
                    if (point1.date > point2.date) {
                        const tmp = point1;
                        point1 = point2;
                        point2 = tmp;
                    }
                    const interval = new Interval(point1.date, point2.date, obj.name, obj.description);
                    this.trackModelService.addInterval(interval);
                    this.trackModelService.clearStatistic();
                    this.sequence = new ArraySequence<Binding>(this._trackModelService.getSequenceArray());
                    this.select(interval);
                }))
            })
        })
    }

    private rightMenuOnMark(marker: Marker<any>, mark: Mark) {
        marker.on('contextmenu', (event: LeafletEvent) => {
                this._contextMenu.showContextMenu(event,
                    [
                        new MenuAction("Переместить", () => {
                            this.moveObjAction(mark, () => this.renderMarkers());
                        }),
                        new MenuAction("Изменить", () => {
                            new EditForm(this.map).showForCommonObject(mark, mark, (obj) => {
                                mark.description = obj.description;
                                mark.name = obj.name;
                                this.renderMarkers();
                            })

                        }),
                        new MenuAction("Удалить", () => {
                            this._trackModelService.removeMark(mark);
                            this.renderMarkers();
                        }),
                    ])
            }
        );
    }


    private rightMenuOnPhotoMarker(marker:Marker, photo:Photo){
        marker.on('contextmenu', (event: LeafletEvent) => {
                this._contextMenu.showContextMenu(event,
                    [
                        new MenuAction("Переместить", () => {
                            this.moveObjAction(photo, () => this.renerPhotos());
                        }),
                        new MenuAction("Изменить", () => {
                            new EditForm(this.map).showForPhoto(photo, photo, (obj) => {
                                photo.name = obj.name;
                                photo.url = obj.url;
                                this.fireSelected();
                            })
                        }),
                        new MenuAction("Удалить", () => {
                            this._trackModelService.removePhoto(photo);
                            this.renerPhotos();
                        }),
                    ])
            }
        );

    }

    private rightMenuOnTrackLine(trackLine: Polyline<LineString | MultiLineString, any>, interval: Interval) {
        trackLine.addEventListener('contextmenu', (e) => {
            this._contextMenu.showContextMenu(e,
                [
                    new MenuAction("Начало", () => {
                        this.choosePosition((latlng) => {
                            const point = this.findNearestPointIndexForTrack(latlng);
                            interval.from = point.date;
                            this.trackModelService.clearStatistic();
                            this.select(interval);
                        });
                    }),
                    new MenuAction("Конец", () => {
                        this.choosePosition((latlng) => {
                            const point = this.findNearestPointIndexForTrack(latlng);
                            interval.to = point.date;
                            this.trackModelService.clearStatistic();
                            this.select(interval);
                        });
                    }),
                    new MenuAction("Изменить", () => {
                        // @ts-ignore
                        var latlng = e.latlng;
                        new EditForm(this.map).showForCommonObject(latlng, interval, (obj) => {
                            interval.description = obj.description;
                            interval.name = obj.name;
                            this.fireSelected();
                            this.highlightSelected();
                        });
                    }),
                    new MenuAction("Удалить", () => {
                        this.selectedObject = null;
                        this.trackModelService.removeInterval(interval);
                        this.sequence = new ArraySequence<Binding>(this._trackModelService.getSequenceArray());
                        this.fireSelected();
                        this.highlightSelected();
                    }),
                ])
        });
    }




    public getSelected(): any {
        return this.selectedObject;
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
        if(typeof resIndex != 'undefined'){
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

    get selectedPhoto(): Photo {
        return this._selectedPhoto;
    }


    get trackModelService(): TrackModelService {
        return this._trackModelService;
    }

    selectInterval(startInterval: Interval) {
        this.select(startInterval);
    }
}