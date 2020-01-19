/**
 * Карта маршрута и панель управления.
 */
import {TripMap} from "./TripMap";
import {TripModel} from "./model/TripModel";
import {Parser} from "./Parser";
import {Track} from "./model/Track";
import {Interval} from "./model/Interval";

export class TripViewer {

    tripMap:TripMap;
    private btnPrev: HTMLElement = this.get("btn-prev");
    private btnNext: HTMLElement = this.get("btn-next");
    private title: HTMLElement = this.get("infoPanel.title");
    private description: HTMLElement = this.get("infoPanel.text");
    private beginning: HTMLElement = this.get("infoPanel.beginning");
    private distance: HTMLElement = this.get("infoPanel.distance");
    private time: HTMLElement = this.get("infoPanel.time");
    private dates: HTMLElement = this.get("infoPanel.dates");
    private deltaH: HTMLElement = this.get("infoPanel.deltaH");



    private get(id:string){
        return document.getElementById(id)
    }

    constructor(tripMap: TripMap) {
        this.tripMap = tripMap;
        this.btnNext.addEventListener('click', () => {
            if (this.tripMap.hasNextInterval()) {
                tripMap.nextInterval();
                this.highlightNavigationButtons();
                this.render();
            }
        });
        this.btnPrev.addEventListener('click', () => {
            if (this.tripMap.hasPrevInterval()) {
                tripMap.prevInterval();
                this.highlightNavigationButtons();
                this.render();
            }
        });

    }

    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.tripMap.setData(tripData);
        this.highlightNavigationButtons();
        this.render();
    }

    private render(){
        let interval = this.tripMap.getCurrentInterval();
        let model = this.tripMap.getModel();
        if(interval) {
            this.title.innerHTML = TripViewer.stringify(interval.name);
            this.description.innerHTML = TripViewer.stringify(interval.description);
            this.setBegingsFromField(interval, model);
            let trackLength = TripViewer.getTrackLength(interval.track, interval.from, interval.to);
            this.distance.innerHTML = (trackLength / 1000).toFixed(2);
            let beginDate = interval.track.points[interval.from].date;
            let endDate = interval.track.points[interval.to-1].date;
            this.setDatesFields(endDate, beginDate);
            let [gain,loss] = TripViewer.getTrackDeltaH(interval.track, interval.from, interval.to);
            this.deltaH.innerHTML = Math.round(gain) + " / " + Math.round(loss);

        } else {
            this.beginning.innerHTML = "-";
            let totalDistance = model.tracks
                .map((track) => TripViewer.getTrackLength(track))
                .reduce((a, b) => a + b, 0);
            this.distance.innerHTML = (totalDistance / 1000).toFixed(2);
            let lastTrack = model.tracks[model.tracks.length - 1];
            this.setDatesFields(lastTrack.points[lastTrack.points.length - 1].date, model.tracks[0].points[0].date);

            let [gain, loss] = [0, 0];
            model.tracks.forEach((track) => {
                let [g, l] = TripViewer.getTrackDeltaH(track);
                gain += g;
                loss += g;
            });
            this.deltaH.innerHTML = Math.round(gain) + " / " + Math.round(loss);

            this.title.innerHTML = TripViewer.stringify(model.name);
            this.description.innerHTML = TripViewer.stringify(model.description);


        }

    }

    private static stringify(s: String):string {
        if(s === undefined)
            return '';
        return String(s);
    }

    private setDatesFields(endDate: Date, beginDate: Date) {
        let minutesTotal = Math.round((endDate.getTime() - beginDate.getTime()) / 60000);
        let hours = Math.floor(minutesTotal / 60);
        var minutes = minutesTotal % 60;
        this.time.innerHTML = (hours == 0 ? '' : hours + ' ч ') + minutes + ' мин';
        if (TripViewer.datesAreOnSameDay(beginDate, endDate)) {
            this.dates.innerHTML = this.formatDate(beginDate) + " / " + this.formatTime(endDate);
        } else {
            this.dates.innerHTML = this.formatDate(beginDate) + " / " + this.formatDate(endDate);
        }
    }

    static datesAreOnSameDay(first:Date, second:Date):boolean {
        return first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();
    }

    private formatDate(beginDate: Date) {
        // порнография
        return beginDate.getFullYear() + '-' + ('0' + (beginDate.getMonth() + 1)).slice(-2) + '-' + ('0' + beginDate.getDate()).slice(-2)
            + ' ' + ('0' + beginDate.getHours()).slice(-2) + ':' + ('0' + beginDate.getMinutes()).slice(-2);
    }
    private formatTime(beginDate: Date) {
        // порнография
        return ('0' + beginDate.getHours()).slice(-2) + ':' + ('0' + beginDate.getMinutes()).slice(-2);
    }

    private setBegingsFromField(interval: Interval, model: TripModel) {
        var length = 0;
        for (let i = 0; i < model.tracks.length; i++) {
            let track = model.tracks[i];
            if (track === interval.track) {
                break;
            }
            length += TripViewer.getTrackLength(track);
        }
        length += TripViewer.getTrackLength(interval.track, 0, interval.from + 1);
        this.beginning.innerHTML = (length / 1000).toFixed(2);
    }

    private static getTrackLength(track: Track, from = 0, to = track.points.length):number {
        let res = 0;
        for (var i = from + 1; i < to; i++) {
            res += track.points[i].distanceTo(track.points[i-1])
        }
        return res;
    }

    private static getTrackDeltaH(track: Track, from = 0, to = track.points.length): Array<number> {
        let gain = 0;
        let loss = 0;
        for (var i = from + 1; i < to; i++) {
            let deltaH = track.points[i].alt - track.points[i-1].alt;
            if(deltaH > 0){
                gain += deltaH;
            } else {
                loss -= deltaH;
            }
        }
        return [gain, loss];
    }


    private highlightNavigationButtons() {
            this.enableNavigateButton(this.btnNext, this.tripMap.hasNextInterval());
            this.enableNavigateButton(this.btnPrev,  this.tripMap.hasPrevInterval());
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