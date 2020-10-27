import {
    LatLng, LatLngBounds,
    LatLngExpression, Layer,
    LayerGroup,
    LeafletEvent,
    Map,
    Marker,
    Polyline
} from "leaflet";

import L = require("leaflet");
import {TrackPoint} from "./model/TrackPoint";

import {Interval} from "./model/Interval";

import {Util} from "./Util";
import {TrackSegment} from "./model/TrackSegment";
import {TrackModelService} from "./TrackModelService";
import {Mark} from "./model/Mark";
import {Photo} from "./model/Photo";
import {Settings} from "./Settings";
import {ContextMenu} from "./ContextMenu";
import {MenuAction} from "./MenuAction";
import {EditForm} from "./EditForm";
import {Pause} from "./model/Pause";

/**
 * Карта с нанесенными на нее объектами
 */
export class TripMap {
    private map: Map;
    private _trackModelService: TrackModelService;
    private _contextMenu: ContextMenu;
    private selectedInterval: Interval = null;
    private _selectedPhoto: { photo: Photo, marker: Marker, prevPosition:LatLng};
    private markerLayer: LayerGroup;
    private photoLayer: LayerGroup;
    private pauseLayer: LayerGroup;
    private trackLayer: LayerGroup;
    private intervalLayer: LayerGroup;

    //Срабатывают при выделение/снятии выделения элемента карты.
    private selectionListeners: Array<() => void> = [];

    public constructor(map: Map, trackModelService: TrackModelService, contextMenu: ContextMenu) {
        this.map = map;
        this._contextMenu = contextMenu;
        this.markerLayer = new LayerGroup().addTo(map);
        this.photoLayer = new LayerGroup().addTo(map);
        this.trackLayer = new LayerGroup().addTo(map);
        this.intervalLayer = new LayerGroup().addTo(map);
        this.pauseLayer = new LayerGroup().addTo(map);
        this.setModel(trackModelService)
    }

    private setModel(trackModelService: TrackModelService) {
        this._trackModelService =  trackModelService;
        const model = trackModelService.model;
        const map = this.map;

        this.addDeselectPhotoEventListener(map);
        //наносим трек
        model.segments.forEach((track: TrackSegment, index: number) => {
            const latLngs = track.points.map((tp: TrackPoint) => new LatLng(tp.lat, tp.lng, tp.alt));
            const trackLine = L.polyline(latLngs, {weight: 4, opacity: 0.6});
            trackLine.addTo(this.trackLayer);
            this.addTrackOnClickListener(trackLine, track);
        });

        this.renderPhotos();
        this.renderMarkers();

        if (Settings.editMode) {
            this.renderPauses();
        }

        L.control.scale().addTo(map);
    }

    private addDeselectPhotoEventListener(o:Map|Layer){
        o.addEventListener('click', (event: LeafletEvent) => {
            this._deSelectPhoto();
            return true;
        });
    }

    private renderMarkers() {
        let model = this._trackModelService.model;
        this.markerLayer.clearLayers();

        const markerIcon = L.icon({
            iconUrl: Util.getUrl('ico/location.svg'),
            iconSize: [20, 20],
            iconAnchor: [10, 20]
        });

        model.marks.forEach(mark => {
            const marker: Marker = L.marker([mark.lat, mark.lng], {icon: markerIcon, opacity: 50, title: mark.name});
            var popup = `<b>${mark.name}</b><br/> ${mark.description ? mark.description : ''}`
            marker.addTo(this.markerLayer);
            this.addDeselectPhotoEventListener(marker);
            if (Settings.editMode) {
                this.rightMenuOnMark(marker, mark);
            }
            marker.bindPopup(popup, {
                // @ts-ignore
                //   maxWidth: "auto"
            });
        });

    }


    private renderPhotos() {
        let model = this._trackModelService.model;
        this.photoLayer.clearLayers();

        const photoIcon = L.icon({
            iconUrl: Util.getUrl('ico/camera.svg'),
            iconSize: [20, 20],
        });

        model.photos.forEach((photo) => {
            const marker = L.marker([photo.lat, photo.lng], {icon: photoIcon});
            marker.addTo(this.photoLayer);
            marker.on('click', (event: LeafletEvent) => {
                    this._selectPhoto(photo, true);
                }
            );
            if (Settings.editMode) {
                this.rightMenuOnPhotoMarker(marker, photo);
            }
        });
    }


    public renderPauses() {
        this.pauseLayer.clearLayers();
        const pauses = this.trackModelService.model.pauses;
        this.trackModelService.model.segments.forEach(segment => {
            pauses.forEach((p) => {
                const latLngs: Array<LatLngExpression> = [];
                const points = segment.points;

                let toIndex = TrackModelService.binarySearch(points,
                    (point: TrackPoint): boolean => {
                        return point.date > p.to;
                    }
                );
                let fromIndex = TrackModelService.binarySearch(points,
                    (point: TrackPoint): boolean => {
                        return point.date >= p.from;
                    }
                );
                if (fromIndex < points.length && toIndex > 0) {
                    for (let i = fromIndex; i <= toIndex; i++) {
                        latLngs.push(segment.points[i]);
                    }
                    if(latLngs.length == 0){
                        latLngs.push(segment.points[fromIndex]);
                    }
                    if(latLngs.length == 1){
                        latLngs.push(latLngs[0]);
                    }
                    const line = L.polyline(latLngs, {weight: 7, opacity: 0.6, color: 'red'});

                    line.addTo(this.pauseLayer);
                    //todo - это не надо вычислять сразу
                    var dateFormat = {
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                    };
                    line.bindPopup("Остановка " + p.from.toLocaleTimeString() + " - " + p.to.toLocaleTimeString());
                    this.rightMenuOnPause(line, p);
                }

            })

        })
    }

    private _selectPhoto(photo: Photo, fire:boolean = true) {
        const map = this.map;
        const selectedPhoto = this._selectedPhoto;

        if (selectedPhoto) {
            selectedPhoto.marker.remove();
        }

        const markerIcon = L.icon({
            iconUrl: Util.getUrl('ico/camera-selected.svg'),
            iconSize: [30, 30]
        });

        const marker: Marker = L.marker([photo.lat, photo.lng], {
            icon: markerIcon,
            opacity: 50,
            zIndexOffset: 100
        });

        this._selectedPhoto = {
            photo: photo,
            marker: marker,
            prevPosition: selectedPhoto ? selectedPhoto.prevPosition : this.map.getCenter()
        }

        marker.addTo(this.map).on('click', (event: LeafletEvent) => {
            this._deSelectPhoto();
        });

        const bounds = map.getBounds();
        map.panTo(new LatLng(photo.lat - (bounds.getSouth() - bounds.getNorth()) / 4, photo.lng), {animate: true});

        if (Settings.editMode) {
            this.rightMenuOnPhotoMarker(marker, photo);
        }
        if (fire) {
            this.fireSelected();
        }
    }

    private _deSelectPhoto(fire: boolean = true, panback: boolean = true) {
        const selectedPhoto = this._selectedPhoto;
        if (selectedPhoto) {
            selectedPhoto.marker.remove();
            // if(selectedPhoto.prevPosition && panback){
            //     this.map.panTo(selectedPhoto.prevPosition, {animate: true})
            // }
            this._selectedPhoto = null;
            if(fire) {
                this.fireSelected();
            }
        }
    }

    private addTrackOnClickListener(trackLine: Polyline, track: TrackSegment) {
        trackLine.on('click', (event: LeafletEvent) => {
            this._deSelectPhoto();
            // @ts-ignore
            let lat = event.latlng.lat;
            // @ts-ignore
            let lng = event.latlng.lng;
            let clickedPoint: TrackPoint = this.findNearestPointIndexForTrack(new LatLng(lat, lng));
            const interval = this.findMinCoveringInterval(clickedPoint.date);

            if (!interval || interval === this.selectedInterval || interval === this.trackModelService.getGlobalInterval()) {
                this._deSelectInterval(true);
            } else {
                this._selectInterval(interval, true)
            }
        });
    }

    /**
     * Находит ближайшую к заданной точку трека
     * @param target точка на карте.
     *
     *
     */
    private findNearestPointIndexForTrack(target: LatLng): TrackPoint {
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

    private _deSelectInterval(fire:boolean = true){
        this.intervalLayer.clearLayers();
        this.selectedInterval = null;
        if(fire){
            this.fireSelected()
        }
    }

    private _selectInterval(interval: Interval, fire = true) {
        this.intervalLayer.clearLayers();
        this.selectedInterval = interval;

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
            trackLine.addTo(this.intervalLayer);
            this.addDeselectPhotoEventListener(trackLine);
            //новая линия перекрывает старую, так что на нее надо слушатель таки повесить (как сделать по-другому не разобрался)
            this.addTrackOnClickListener(trackLine, segment);

            const stat = this.trackModelService.getIntervalStatistic(interval)
            const map = this.map;
            const bounds = map.getBounds();
            const w = bounds.getEast() - bounds.getWest();
            const h = bounds.getNorth() - bounds.getSouth();
            const innerSouth = bounds.getSouth() + h / 10;
            const innerWest = bounds.getWest() + w / 10;
            const innerNorth = bounds.getNorth() - h / 5;
            const innerEast = bounds.getEast() - w / 10;

            const ratio = Math.max((stat.maxLat - stat.minLat) / (innerNorth - innerSouth),
                (stat.maxLng - stat.minLng) / (innerEast - innerWest)
            )
            if (ratio > 1) {
                const w1 = stat.maxLng - stat.minLng;
                const h1 = stat.maxLat - stat.minLat;
                map.fitBounds(new LatLngBounds(
                    new LatLng(stat.minLat - h1 / 10, stat.minLng - w1 / 10),
                    new LatLng(stat.maxLat + h1 / 3, stat.maxLng + w1 / 10)
                ), {
                    animate: true,
                });
            } else if (ratio < 0.1) {
                const w1 = stat.maxLng - stat.minLng;
                const h1 = stat.maxLat - stat.minLat;
                const k = 3;//подбираем экспериментально
                map.fitBounds(new LatLngBounds(
                    new LatLng(stat.minLat - h1 * k, stat.minLng - w1 * k),
                    new LatLng(stat.maxLat + h1 * k, stat.maxLng + w1 * k)
                ), {
                    animate: true,
                });
            } else {
                if (stat.maxLat > innerNorth || stat.minLat < innerSouth || stat.maxLng > innerEast || stat.minLng < innerWest) {
                    map.panTo(new LatLng((stat.maxLat + stat.minLat) / 2, (stat.maxLng + stat.minLng) / 2));
                }
            }

            if (Settings.editMode) {
                this.rightMenuOnInterval(trackLine, interval);
            }
        }
        if(fire){
            this.fireSelected();
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
                this.renderPhotos();
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
                    this._selectInterval(interval, true);
                    this.fireSelected();
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

    private rightMenuOnPause(line: Polyline<any>, pause: Pause) {
        line.on('contextmenu', (event: LeafletEvent) => {
                this._contextMenu.showContextMenu(event,
                       [
                           new MenuAction("Изменить", () => {
                            // @ts-ignore
                            const latlng = event.latlng;
                            new EditForm(this.map).showPauseObject(latlng, pause, (obj) => {
                                pause.from = Util.parseDate(obj.from);
                                pause.to = Util.parseDate(obj.to);
                                this.trackModelService.clearStatistic();
                                this.renderPauses();
                            })

                        }),
                        new MenuAction("Удалить", () => {
                            this._trackModelService.removePause(pause);
                            this.trackModelService.clearStatistic();
                            this.renderPauses();
                        })
                    ])
            }
        );
    }

    private rightMenuOnPhotoMarker(marker:Marker, photo:Photo){
        marker.on('contextmenu', (event: LeafletEvent) => {
                this._contextMenu.showContextMenu(event,
                    [
                        new MenuAction("Переместить", () => {
                            this.moveObjAction(photo, () => this.renderPhotos());
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
                            this.renderPhotos();
                        }),
                    ])
            }
        );

    }

    private rightMenuOnInterval(trackLine: Polyline, interval: Interval) {
        trackLine.addEventListener('contextmenu', (e) => {
            this._contextMenu.showContextMenu(e,
                [
                    new MenuAction("Начало", () => {
                        this.choosePosition((latlng) => {
                            const point = this.findNearestPointIndexForTrack(latlng);
                            interval.from = point.date;
                            this.trackModelService.clearStatistic();
                            this._selectInterval(interval, true);
                        });
                    }),
                    new MenuAction("Конец", () => {
                        this.choosePosition((latlng) => {
                            const point = this.findNearestPointIndexForTrack(latlng);
                            interval.to = point.date;
                            this.trackModelService.clearStatistic();
                            this._selectInterval(interval, true);
                        });
                    }),
                    new MenuAction("Изменить", () => {
                        // @ts-ignore
                        var latlng = e.latlng;
                        new EditForm(this.map).showForCommonObject(latlng, interval, (obj) => {
                            interval.description = obj.description;
                            interval.name = obj.name;
                            this._selectInterval(interval, true);
                        });
                    }),
                    new MenuAction("Удалить", () => {
                        this._deSelectInterval(true);
                        this.trackModelService.removeInterval(interval);


                    }),
                ])
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



    public getSelectedInterval(): Interval {
        return this.selectedInterval;
    }



   public addSelectionListener(param: () => void) {
        this.selectionListeners.push(param);
    }

    private fireSelected() {
        this.selectionListeners.forEach(l => l());
    }

    private findMinCoveringInterval(date: Date): Interval {
        const arr = this.trackModelService.model.intervals;
        let resIndex = undefined;

        for (let i = 0; i < arr.length; i++) {
            const interval = arr[i];

            if (interval.from <= date && interval.to >= date) {
                if (!resIndex) {
                    resIndex = i;
                } else {
                    const oldInterval = arr[resIndex];
                    if (!oldInterval || oldInterval.to.getTime() - oldInterval.from.getTime() > interval.to.getTime() - interval.from.getTime()) {
                        resIndex = i
                    }
                }
            }
        }

        if (typeof resIndex != 'undefined') {
            return arr[resIndex];
        }
        return null;
    }


    getMap() {
        return this.map;
    }

    get selectedPhoto(): Photo {
      return  this._selectedPhoto ? this._selectedPhoto.photo: null;
    }


    get trackModelService(): TrackModelService {
        return this._trackModelService;
    }


    public selectInterval(interval: Interval) {
        if(interval) {
            this._selectInterval(interval, false);
        } else {
            this._deSelectInterval(false);
        }
    }
}