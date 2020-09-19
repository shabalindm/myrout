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


const widgets = document.getElementsByClassName("trip-interactive-map");

for (const widget of widgets) {
    const trackUrl = widget.getAttribute('track-url');
    const trackDescriptionsUrl = widget.getAttribute('track-descriptions-url');
    const photoDescriptionsUrl = widget.getAttribute('photo-descriptions-url');
    const from = new Date(widget.getAttribute('from'));
    const to = new Date(widget.getAttribute('to'));
    const objectsUrl = widget.getAttribute('objects-url');
    const startCoords = widget.getAttribute('center').split(",").map(s => parseFloat(s));
    const zoomString = widget.getAttribute('zoom');
    const startZoom = parseInt(zoomString);


    var xhr = new XMLHttpRequest();//todo - переделать на асинхронный запрос
    const widgetHtmlUrl = Util.getUrl('trip-map-widget.html');
    xhr.open('GET', widgetHtmlUrl, false);//todo-переместить файл
    xhr.send();
    if (xhr.status != 200) {
        throw new Error('cannot get ' + widgetHtmlUrl + '. ' + xhr.status + ': ' + xhr.statusText);
    }
    widget.innerHTML = xhr.responseText;
    const mapElement: HTMLElement = (<HTMLElement[]><any>widget.getElementsByClassName('myrout__map'))[0];
    const map = L.map(mapElement).setView([startCoords[0], startCoords[1]], startZoom);

    L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
    let tMap = new TripMap(map);
    let tripViewer = new TripViewer(tMap, widget);

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
        const trackInterval = new Interval(new Date(interval.from), new Date(interval.to), interval.name, interval.description);
        trackModel.intervals.push(trackInterval);
    }

    for (const m of trackDescription.marks) {
        const mark = new Mark(m.name, m.description, m.lat, m.lng, null);
        trackModel.marks.push(mark);
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
        const photo = new Photo("photos/" + desc.file, desc.number, desc.name, desc.accuracy, desc.lat, desc.lng);//todo - hardcode photos/
        trackModel.photos.set(desc.number, photo);
    }


    tripViewer.setModel(trackModel);

}




