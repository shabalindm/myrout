import {TrackModelService} from "./TrackModelService";
import {TripViewer} from "./TripViewer";
import {Settings} from "./Settings";
import {Util} from "./Util";
import {TrackModel} from "./model/TrackModel";
import {TrackSegment} from "./model/TrackSegment";
import {TrackPoint} from "./model/TrackPoint";
import {Interval} from "./model/Interval";
import {Mark} from "./model/Mark";
import {Pause} from "./model/Pause";
import {Photo} from "./model/Photo";
import {ContextMenu} from "./ContextMenu";
import {TripMap} from "./TripMap";
import {Toolbar} from "./Toolbar";
import L = require("leaflet");
import {LatLng} from "leaflet";
const xml2js = require('xml2js');

export class API {
    private trackModelService: TrackModelService;

    constructor(trackModelService: TrackModelService) {
        this.trackModelService = trackModelService;
    }

    public createWidgetLazyHolder(widget: HTMLElement, params: any) {
        const holder: any = {};//todo потокобезопасность
        return {
            getWidget: () => {
                if (!holder.value) {
                    holder.value = this.initWidget(widget, params);
                }
                return holder.value;
            }
        }
    }

    public initWidget(widget: HTMLElement, params:any): TripViewer{
        const startZoom:number = params.zoom;
        const trackDescriptionsUrl = params.track_descriptions_url;
        const photoDescriptionsUrl = params.photo_descriptions_url;
        const centerLat:number = params.centerLat;
        const centerLng:number = params.centerLng;
        var xhr = new XMLHttpRequest();//todo - переделать на асинхронный запрос
        const widgetHtmlUrl = Util.getUrl('trip-map-widget.html');
        xhr.open('GET', widgetHtmlUrl, false);//todo-переместить файл
        xhr.send();
        if (xhr.status != 200) {
            throw new Error('cannot get ' + widgetHtmlUrl + '. ' + xhr.status + ': ' + xhr.statusText);
        }
        if(Settings.editMode){
            const html = xhr.responseText
            const widgetHtmlUrl = Util.getUrl('toolbar.html');
            xhr.open('GET', widgetHtmlUrl, false);
            xhr.send();
            if (xhr.status != 200) {
                throw new Error('cannot get ' + widgetHtmlUrl + '. ' + xhr.status + ': ' + xhr.statusText);
            }
            widget.innerHTML = xhr.responseText + html;
        } else {
            widget.innerHTML = xhr.responseText;
        }
        const mapElement: HTMLElement = (<HTMLElement[]><any>widget.getElementsByClassName('myrout__map'))[0];
        const map = L.map(mapElement);
        map.setView(new LatLng(centerLat, centerLng), startZoom);

        L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);

        map.zoomControl.setPosition("bottomright");
        const contextMenu = new ContextMenu(map);
        let tMap = new TripMap(map, this.trackModelService, contextMenu);
        let tripViewer = new TripViewer(tMap, widget);
        if(Settings.editMode){

            new Toolbar(tMap, widget, trackDescriptionsUrl, photoDescriptionsUrl)
        }
        return tripViewer;

    }

    private photoTemplatePromise = Util.httpGet(Util.getUrl('photo-template.html'));

    public initPhoto(photoDiv: Element, photoTempatePath: string) {
        const url = photoTempatePath ? photoTempatePath: Util.getUrl('photo-template.html');
        Util.httpGet(url).then((template: string) => {
                const src = photoDiv.getAttribute("file");
                const photo = this.trackModelService.getPhoto(src);
                if (photo) {
                    const src = photo.file;
                    photoDiv.innerHTML = Util.format(template, {src: src, number: photo.number, name: photo.name});
                }
            }
        );
    }

    public selectIntervalById(intervalId: string, viewer: TripViewer) {
        const interval = this.trackModelService.getInterval(intervalId);
        if (interval) {
            const stat = this.trackModelService.getIntervalStatistic(interval);
            viewer.selectInterval(interval)
        } else {
            throw Error("Итервал не найден" + intervalId)
        }
    }
    
    public static create(params:any,
                         getPhotoUrl: (file: string)=>string = s=>s,
                         getPhotoPreviewUrl: (file: string)=>string = s=>s
    ):Promise<API>{
        const trackUrl = params.track_url;
        const trackDescriptionsUrl = params.track_descriptions_url;
        const photoDescriptionsUrl = params.photo_descriptions_url;
        Settings.utcOffset = params.utcOffset;
        const fromAttr = params.from;
        const from = fromAttr ? Util.parseDate(fromAttr): null;
        const toAttr = params.to;
        const to = toAttr ? Util.parseDate(toAttr) : null;

        var xhr = new XMLHttpRequest();//todo - переделать на асинхронный запрос
        const trackModel: TrackModel = new TrackModel();
        let parser = new xml2js.Parser();
        xhr = new XMLHttpRequest();
        xhr.open('GET', trackUrl, false);
        xhr.send();
        if (xhr.status != 200) {
            throw new Error(xhr + '. ' + xhr.status + ': ' + xhr.statusText);
        }
        //парсим тяжело и хардкодно, без всяких оптимизаций все потом
        parser.parseString(xhr.responseText, (err: any, xml: any) => {
            if (err) {
                throw new Error('cannot parse track' + err);
            } else {
                for (const segment of xml.gpx.trk) {
                    const trackSegment = new TrackSegment();
                    for (const point of segment.trkseg[0].trkpt) {
                        const date = new Date(point.time[0]);
                        if (!(from && date < from || to && date > to)) {
                            const trackPoint: TrackPoint = new TrackPoint(parseFloat(point.$.lat), parseFloat(point.$.lon), parseInt(point.ele[0]), date);
                            trackSegment.points.push(trackPoint);
                        }
                    }
                    if (trackSegment.points.length > 1) {
                        trackModel.segments.push(trackSegment)
                    }
                }
            }
        });

        xhr = new XMLHttpRequest();
        xhr.open('GET', trackDescriptionsUrl, false);
        xhr.send();
        if (xhr.status != 200) {
            throw new Error(xhr + '. ' + xhr.status + ': ' + xhr.statusText);
        }
        const trackDescription = JSON.parse(xhr.responseText);

        for (const interval of trackDescription.intervals) {
            const trackInterval = new Interval(Util.parseDate(interval.from), Util.parseDate(interval.to), interval.name, interval.description);
            trackInterval.id = interval.id;
            trackModel.intervals.push(trackInterval);
        }

        for (const m of trackDescription.marks) {
            const mark = new Mark(m.name, m.description, m.lat, m.lng, null);
            trackModel.marks.push(mark);
        }
        for (const p of trackDescription.pauses) {
            const pause = new Pause(Util.parseDate(p[0]), Util.parseDate(p[1]));
            trackModel.pauses.push(pause);
        }

        trackModel.name = trackDescription.name;
        trackModel.description = trackDescription.description;


        xhr = new XMLHttpRequest();
        xhr.open('GET', photoDescriptionsUrl, false);
        xhr.send();
        if (xhr.status != 200) {
            throw new Error(xhr + '. ' + xhr.status + ': ' + xhr.statusText);
        }
        const photoDescriptions = JSON.parse(xhr.responseText);

        for (const desc of photoDescriptions) {
            const photo = new Photo(desc.file, desc.number, desc.name, desc.accuracy, desc.lat, desc.lng);
            trackModel.photos.push( photo);
        }

        const trackModelService = new TrackModelService(trackModel);
        return new Promise((resolve, reject) => {resolve(new API(trackModelService))});

        
    }
}