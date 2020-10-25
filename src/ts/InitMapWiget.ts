import L = require("leaflet");

const xml2js = require('xml2js');
import {TripMap} from "./TripMap";
import {TripViewer} from "./TripViewer";
import {TrackModel} from "./model/TrackModel";
import {TrackSegment} from "./model/TrackSegment";
import {TrackPoint} from "./model/TrackPoint";
import {Interval} from "./model/Interval";
import {Photo} from "./model/Photo";
import {Mark} from "./model/Mark";
import {Util} from "./Util";
import {TrackModelService} from "./TrackModelService";
import {Settings} from "./Settings";
import {parseBooleans} from "xml2js/lib/processors";
import {LatLng, LatLngBounds} from "leaflet";
import {ContextMenu} from "./ContextMenu";
import {Toolbar} from "./Toolbar";
import {Pause} from "./model/Pause";

export class InitMapWiget{
    static initWiget(widget: Element): Promise<TripViewer>{
        const trackUrl = widget.getAttribute('track-url');
        const trackDescriptionsUrl = widget.getAttribute('track-descriptions-url');
        const photoDescriptionsUrl = widget.getAttribute('photo-descriptions-url');

        Settings.utcOffset = parseInt( widget.getAttribute('utcOffset'));
        const fromAttr = widget.getAttribute('from');
        const from = fromAttr ? Util.parseDate(fromAttr): null;
        const toAttr = widget.getAttribute('to');
        const to = toAttr ? Util.parseDate(toAttr) : null;
        const objectsUrl = widget.getAttribute('objects-url');
        const center = widget.getAttribute('center');
        const zoomString = widget.getAttribute('zoom');
        const startZoom = parseInt(zoomString);
        const startIntervalName =  widget.getAttribute('start-interval');
        const editMode = widget.getAttribute('edit-mode');
        if(editMode) {
            Settings.editMode = parseBooleans(editMode);
        }


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
                        if (date >= from && date <= to) {
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
            const photo = new Photo(desc.file, desc.number, desc.name, desc.accuracy, desc.lat, desc.lng);//todo - hardcode photos/
            trackModel.photos.push( photo);
        }

        const trackModelService = new TrackModelService(trackModel);

        let startInterval;
        let startIntervalBounds;
        if(startIntervalName) {
            startInterval = trackModel.intervals.find(i => i.name == startIntervalName);
            if(startInterval){
                const stat = trackModelService.getIntervalStatistic(startInterval);
                startIntervalBounds = new LatLngBounds(
                    new LatLng(stat.minLat, stat.minLng),
                    new LatLng(stat.maxLat, stat.maxLng)
                );
            }
            else {
                throw new Error("Интервал не найден " +startIntervalName);
            }
        }

        const mapElement: HTMLElement = (<HTMLElement[]><any>widget.getElementsByClassName('myrout__map'))[0];
        const map = L.map(mapElement);

        if (!startIntervalName) {
            const startCoords = center.split(",").map(s => parseFloat(s));
            map.setView([startCoords[0], startCoords[1]], startZoom);
        } else {
            map.fitBounds(startIntervalBounds, {animate:false})
        }

        L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);
        //todo - это не должно быть здесь
        map.zoomControl.setPosition("bottomright");

        const contextMenu = new ContextMenu(map);
        let tMap = new TripMap(map, trackModelService, contextMenu);
        if(startInterval){
            tMap.selectInterval(startInterval);
        }
        let tripViewer = new TripViewer(tMap, widget);
        if(Settings.editMode){
            new Toolbar(tMap, widget, trackDescriptionsUrl, photoDescriptionsUrl)
        }
        return new Promise<TripViewer>((resolve, reject) => {
            resolve(tripViewer);
        });

    }

}