/**
 * Карта маршрута, панель управления, с информацией и статистикой.
 */
import {TripMap} from "./TripMap";

import {TrackSegment} from "./model/TrackSegment";
import {TrackModel} from "./model/TrackModel";

export class TripViewer {

    tripMap:TripMap;
    /**
     * родительский div, в котором сидит виджет
     * @private
     */
    private parent: Element;
    private btnPrev: HTMLElement;
    private btnNext: HTMLElement;
    private title: HTMLElement;
    private description: HTMLElement;
    // private beginning: HTMLElement = this.get("infoPanel.beginning");
    private distance: HTMLElement;
    private time: HTMLElement;
    private dates: HTMLElement;
    private deltaH: HTMLElement;



    private get(cssClass:string){
        return (<HTMLElement[]><any>this.parent.getElementsByClassName(cssClass))[0];
    }


    constructor(tripMap: TripMap, parent:Element) {
        this.tripMap = tripMap;
        this.parent = parent;
        this.btnPrev = this.get("btn-prev");
        this.btnNext = this.get("btn-next");
        this.title = this.get("infoPanel.title");
        this.description = this.get("infoPanel.text");
        // private beginning: HTMLElement = this.get("infoPanel.beginning");
        this.distance = this.get("infoPanel.distance");
        this.time = this.get("infoPanel.time");
        this.dates = this.get("infoPanel.dates");
        this.deltaH = this.get("infoPanel.deltaH");

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
        tripMap.addIntervalSelectedListener(() =>{
            this.highlightNavigationButtons();
            this.render();
        });

    }

    public setJsonData(data:any){
        // let tripData = Parser.parseResponse(data);
        // this.tripMap.setModel(tripData);
        this.highlightNavigationButtons();
        this.render();
    }

    public setModel(data:TrackModel){
        this.tripMap.setModel(data);
        this.highlightNavigationButtons();
        this.render();
    }

    private render(){
        let interval = this.tripMap.getCurrentInterval();
        const model = this.tripMap.getModel();
        if(interval) {
            this.title.innerHTML = TripViewer.stringify(interval.name);
            this.description.innerHTML = TripViewer.stringify(interval.description);
            // this.setBegingsFromField(interval, model);
            let [trackLength, timeInMotion] = TripViewer.getTrackLengthAndTime(model.segments, interval.from, interval.to);
            this.distance.innerHTML = (trackLength / 1000).toFixed(2);
            this.setDatesFields(interval.to, interval.from, timeInMotion);
            let [gain,loss] = TripViewer.getTrackDeltaH(model.segments, interval.from, interval.to);
            this.deltaH.innerHTML = Math.round(gain) + " / " + Math.round(loss);

        } else {
            this.title.innerHTML = TripViewer.stringify(model.name);
            this.description.innerHTML = TripViewer.stringify(model.description);
            // this.setBegingsFromField(interval, model);
            let [trackLength, timeInMotion] = TripViewer.getTrackLengthAndTime(model.segments);
            this.distance.innerHTML = (trackLength / 1000).toFixed(2);
            const lastSegment = model.segments[model.segments.length-1];
            this.setDatesFields(lastSegment.points[lastSegment.points.length -1].date, model.segments[0].points[0].date, timeInMotion);
            let [gain,loss] = TripViewer.getTrackDeltaH(model.segments);
            this.deltaH.innerHTML = Math.round(gain) + " / " + Math.round(loss);
        }

    }

    private static stringify(s: String):string {
        if(s === undefined)
            return '';
        return String(s);
    }

    private setDatesFields(endDate: Date, beginDate: Date, timeInMotion:number) {
        const deltaTMillis = endDate.getTime() - beginDate.getTime();
        this.time.innerHTML = TripViewer.timeIntervalToString(deltaTMillis) + '(' + TripViewer.timeIntervalToString(timeInMotion)+')';
        if (TripViewer.datesAreOnSameDay(beginDate, endDate)) {
            this.dates.innerHTML = this.formatDate(beginDate) + " - " + this.formatTime(endDate);
        } else {
            this.dates.innerHTML = this.formatDate(beginDate) + " - " + this.formatDate(endDate);
        }
    }

    private static timeIntervalToString(deltaTMillis: number) {
        let minutesTotal = Math.round(deltaTMillis / 60000);
        let hours = Math.floor(minutesTotal / 60);
        var minutes = minutesTotal % 60;
        return (hours == 0 ? '' : hours + ' ч ') + minutes + ' мин';
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
    //
    // private setBegingsFromField(interval: Interval, model: TripModel) {
    //     var length = 0;
    //     for (let i = 0; i < model.tracks.length; i++) {
    //         let track = model.tracks[i];
    //         if (track === interval.track) {
    //             break;
    //         }
    //         length += TripViewer.getTrackLengthAndTime(track);
    //     }
    //     length += TripViewer.getTrackLengthAndTime(interval.track, 0, interval.from + 1);
    //     this.beginning.innerHTML = (length / 1000).toFixed(2);
    // }

    private static getTrackLengthAndTime(track: TrackSegment[], from: Date = null, to: Date = null): [number, number] {
        let distance = 0;
        let timeInMotion = 0;
        //todo - оптимизировать
        for (const trackSegment of track) {
            for (var i = 0; i < trackSegment.points.length-2; i++) {
                let p1 = trackSegment.points[i];
                let p2 = trackSegment.points[i+1];
                if((from == null || p1.date >= from) && (to == null || p2.date <= to)){
                    const deltaL = p1.distanceTo(p2);
                    distance += deltaL;
                    const deltaT = p2.date.getTime() - p1.date.getTime();
                    if(deltaL > 50 || deltaT < 180000){//все, что меньше 3 мин - не считаем за остановку движения
                        timeInMotion += deltaT;
                    }
                }
            }
        }

        return [distance, timeInMotion];
    }

    private static getTrackDeltaH(track: TrackSegment[], from: Date = null, to: Date = null): [number, number] {
        let gain = 0;
        let loss = 0;
        //todo - оптимизировать
        for (const trackSegment of track) {
            let deltaH = 0;
            for (var i = 0; i < trackSegment.points.length-2; i++) {
                let p1 = trackSegment.points[i];
                let p2 = trackSegment.points[i+1];
                if((from == null || p1.date >= from) && (to == null || p2.date <= to)){
                    deltaH += (p2.alt - p1.alt);
                    //перепады меньше 10 м не учитываем.
                    if(deltaH > 10){
                        gain += deltaH;
                        deltaH = 0;
                    } else if ((deltaH < -10)){
                        loss += deltaH;
                        deltaH = 0;
                    }
                }
            }
            if(deltaH > 0){
                gain += deltaH;
            } else if ((deltaH < 0)){
                loss += deltaH;
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