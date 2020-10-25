import {InitMapWiget} from "./InitMapWiget";
import {TripViewer} from "./TripViewer";
import {Util} from "./Util";
import * as util from "util";

const widgets = document.getElementsByClassName("trip-interactive-map");
InitMapWiget.initWiget(widgets[0])
    .then(
    (tripViewer: TripViewer) => {
        const trackModelService = tripViewer.tripMap.trackModelService;
        const photos = document.getElementsByClassName("photo");
        Util.httpGet(Util.getUrl('photo-template.html')).then((template: string) => {
            for (const photoElement of photos) {
                const src = photoElement.getAttribute("file");
                const photo = trackModelService.getPhoto(src);
                if(photo){
                    const src = photo.url;
                    photoElement.innerHTML = Util.format(template, {src: src, number: photo.number, name: photo.name});
                }
            }
        });

        const listings = document.getElementsByClassName("listing");

        for (const listing of listings) {
            // @ts-ignore
            listing.init = () => {
                const from = Util.parseDate(listing.getAttribute("from"));
                const to = Util.parseDate(listing.getAttribute("to"));
                listing.innerHTML =
                    '<tr>' +
                    '<th width="30%">Название</th>' +
                    '<th>Начало движения</th>' +
                    '<th>Время полное</th>' +
                    '<th>Время в движении</th>' +
                    '<th>Расстояние, км</th>' +
                    '<th>Набор высоты, м</th>' +
                    '<th>Сброс высоты, м</th>' +
                    '<th>Координаты начала</th>' +
                    '<th>Координаты конца</th>'
                    '</tr> '
                for (const interval of trackModelService.model.intervals) {
                    if (interval.from >= from && interval.from <= to || interval.to >= from && interval.to <= to) {
                        const tr = document.createElement("tr")
                        const stat = trackModelService.getIntervalStatistic(interval);
                        let format = (d: Date) => Util.toMoment(d).format('HH:mm DD.MM').replace(" ", '&nbsp');
                        const begin = format(stat.realBegin);
                        const end = format(stat.realEnd);
                        const distance = (stat.distance / 1000).toFixed(2);
                        const time = timeIntervalToString(stat.timeInMotion);
                        const timeFull = timeIntervalToString(stat.realEnd.getTime() - stat.realBegin.getTime());
                        const gain = Math.round(stat.altitudeGain);
                        const loss =  Math.round(stat.altitudeLoss)
                        tr.innerHTML =
                            `<td>${interval.name}</td> 
<td>${begin}</td>
<td>${timeFull}</td>
<td>${time}</td>
<td>${distance}</td>
<td>${gain}</td>
<td>${loss}</td>
<td>${stat.begin.lat}, ${stat.begin.lng}</td>
<td>${stat.end.lat}, ${stat.end.lng}</td>
    `;


                        listing.appendChild(tr);

                    }
                }
                // @ts-ignore
                listing.init = undefined;
            }
        }
    }
)

function timeIntervalToString(deltaTMillis: number) {
    let minutesTotal = Math.round(deltaTMillis / 60000);
    let hours = Math.floor(minutesTotal / 60);
    var minutes = minutesTotal % 60;
    if (hours < 10) {
        // @ts-ignore
        hours = "0" + hours;
    }
    if (minutes < 10) {
        // @ts-ignore
        minutes = "0" + minutes;
    }

    return hours + ':' + minutes;
    // return  hours + ':' + minutes;
}




