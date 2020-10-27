/**
 * Карта маршрута, панель управления, с информацией и статистикой.
 */
import {TripMap} from "./TripMap";
import {TrackModelService} from "./TrackModelService";
import {Interval} from "./model/Interval";
import {Bounds, LatLng, LatLngBounds} from "leaflet";
import L = require("leaflet");
import {IntervalStatistic} from "./IntervalStatistic";
import moment = require("moment");
import {Settings} from "./Settings";
import {Util} from "./Util";
import {ArraySequence} from "./sequence/ArraySequence";

/**
 * Обрамление карты и управляющие элементы.
 */
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
    private distance: HTMLElement;
    private time: HTMLElement;
    private dates: HTMLElement;
    private deltaH: HTMLElement;
    private intervalBlock: HTMLElement;
    private photoBlock: HTMLElement;
    private photoText: HTMLElement;
    private photoImg: HTMLElement;
    private trackModelService: TrackModelService;
    //последовательнось для пролистывания элементов модели. (там сейчас только интервалы)
    private sequence: ArraySequence<Interval>;

    private mounts={
        0:'янв',
        1:'фев',
        2:'мар',
        3:'апр',
        4:'мая',
        5:'июн',
        6:'июл',
        7:'авг',
        8:'сен',
        9:'окт',
        10:'ноя',
        11:'дек',

    }



    private get(cssClass:string){
        return (<HTMLElement[]><any>this.parent.getElementsByClassName(cssClass))[0];
    }


    constructor(tripMap: TripMap, parent:Element) {
        this.tripMap = tripMap;
        this.parent = parent;
        this.trackModelService = tripMap.trackModelService;
        this.btnPrev = this.get("btn-prev");
        this.btnNext = this.get("btn-next");
        this.title = this.get("infoPanel.title");
        this.description = this.get("infoPanel.text");
        // private beginning: HTMLElement = this.get("infoPanel.beginning");
        this.distance = this.get("infoPanel.distance");
        this.time = this.get("infoPanel.time");
        this.dates = this.get("infoPanel.dates");
        this.deltaH = this.get("infoPanel.deltaH");
        this.intervalBlock = this.get("infoPanel.interval-block");
        this.photoBlock = this.get("infoPanel.photo-block");
        this.photoImg = this.get("infoPanel.photo-img");
        this.photoText = this.get("infoPanel.photo-text");

        this.sequence = new ArraySequence<Interval>([this.trackModelService.getGlobalInterval()]
            .concat(this.trackModelService.getSequenceArray()));

        this.btnNext.addEventListener('click', () => {
            if (this.sequence.hasNext()) {
                this.tripMap.selectInterval(this.sequence.next())
                this.render();
            }
        });
        this.btnPrev.addEventListener('click', () => {
            if (this.sequence.hasPrev()) {
               const interval = this.sequence.prev();
               if(interval === this.trackModelService.getGlobalInterval()){
                   this.tripMap.selectInterval(null);
               } else {
                   this.tripMap.selectInterval(interval);
               }

               this.render();
            }
        });
        tripMap.addSelectionListener(() =>{
            const selectedInterval = this.tripMap.getSelectedInterval();
            if(this.sequence.current() !== selectedInterval){
                this.sequence.goTo((i) => i === selectedInterval);
            } else if(!selectedInterval){
                this.sequence.begin();
            }
            this.render();
        });
        this.render();
    }

    private render() {
        this.highlightNavigationButtons();
        let interval = this.tripMap.getSelectedInterval();
        const model = this.trackModelService.model;
        const selectedPhoto = this.tripMap.selectedPhoto;
        if (selectedPhoto) {
            this.intervalBlock.style.display = 'none';
            this.photoBlock.style.display = 'block';
            this.title.innerHTML = 'Фото ' + TripViewer.stringify(selectedPhoto.number);
            this.photoText.innerHTML = 'Фото ' + TripViewer.stringify(selectedPhoto.number) + '. ' + TripViewer.stringify(selectedPhoto.name);
            this.photoImg.setAttribute("src", selectedPhoto.url);
        } else {
            this.intervalBlock.style.display = 'block';
            this.photoBlock.style.display = 'none';
            if (!interval || interval == this.trackModelService.getGlobalInterval()) {
                const globalInterval = this.trackModelService.getGlobalInterval();
                const stat = this.trackModelService.getIntervalStatistic(globalInterval);
                this.title.innerHTML = TripViewer.stringify(model.name);
                this.description.innerHTML = TripViewer.stringify(model.description);
                this.setStat(stat);
            } else {
                const stat = this.trackModelService.getIntervalStatistic(interval);
                this.title.innerHTML = TripViewer.stringify(interval.name);
                this.description.innerHTML = TripViewer.stringify(interval.description);
                this.setStat(stat);
            }
        }

    }

    private setStat(stat: IntervalStatistic) {
        this.distance.innerHTML = TripViewer.getDistanceText(stat.distance);
        this.setDatesFields(stat.realEnd, stat.realBegin, stat.timeInMotion);
        this.deltaH.innerHTML = TripViewer.getDeltaHText(stat.altitudeGain, stat.altitudeLoss);
    }

    private static getInnerBounds(map: L.Map) {
        let bounds = map.getBounds();
        const w = bounds.getEast() - bounds.getWest();
        const h = bounds.getNorth() - bounds.getSouth();
        bounds = new LatLngBounds(
            new LatLng(bounds.getSouth() - h / 10, bounds.getWest()  - w / 10),
            new LatLng(bounds.getNorth()  + w / 5, bounds.getEast()  + w / 10));
        return bounds;
    }

    private static getDistanceText(trackLength: number) {
        if(trackLength >= 1000) {
            return (trackLength / 1000).toFixed(1) + ' км';
        }
        else {
            return (trackLength / 1000).toFixed(2) + ' км';
        }
    }

    private static getDeltaHText(gain: number, loss: number) {
        return `+${Math.round(gain)}/${Math.round(loss)} м`;
    }

    private static stringify(s: string):string {
        if(!s)
            return '';
        return s;
    }

    private setDatesFields(endDate: Date, beginDate: Date, timeInMotion:number) {
        const deltaTMillis = endDate.getTime() - beginDate.getTime();
        this.time.innerHTML = TripViewer.timeIntervalToString(deltaTMillis) + '(' + TripViewer.timeIntervalToString(timeInMotion)+')';
        if (TripViewer.datesAreOnSameDay(beginDate, endDate)) {
            this.dates.innerHTML = TripViewer.formatTime(beginDate) + " - " + TripViewer.formatTime(endDate);
        } else {
            this.dates.innerHTML = this.formatDateInterval(beginDate, endDate);
        }
        this.dates.title = TripViewer.formatDateTime(beginDate) + " - " + TripViewer.formatDateTime(endDate);
    }

    private static timeIntervalToString(deltaTMillis: number) {
        let minutesTotal = Math.round(deltaTMillis / 60000);
        let hours = Math.floor(minutesTotal / 60);
        var minutes = minutesTotal % 60;
        return (hours == 0 ? '' : hours + ' ч ') + minutes + ' мин';
       // return  hours + ':' + minutes;
    }

    static datesAreOnSameDay(first: Date, second: Date): boolean {
        const m1 = Util.toMoment(first);
        const m2 = Util.toMoment(second);
        return m1.year() === m2.year() &&
            m1.dayOfYear() === m2.dayOfYear();
    }

    private static formatDateTime(date: Date) {
       return  Util.toMoment(date).format('DD.MM.YYYY HH:mm');
    }

    private formatDateInterval(first: Date, second: Date) {
        const m1 = Util.toMoment(first);
        const m2 = Util.toMoment(second);

        const month1 = m1.month();
        const month2 = m2.month();
        if (month1 == month2) {
            return m1.format('DD') + ' - ' + m2.format('DD') + ' ' +
                // @ts-ignore
                this.mounts[month1];
        }
        else {
            return (m1.format('DD')  + ' ' +
                // @ts-ignore
                this.mounts[month1]  +
                ' - ' + m2.format('DD')  + ' ' +
                // @ts-ignore
                this.mounts[month2]);
        }


    }
    private static formatTime(date: Date) {
         return  moment(date).utcOffset(Settings.utcOffset).format('HH:mm');
    }


    private highlightNavigationButtons() {
            this.enableNavigateButton(this.btnNext, this.sequence.hasNext());
            this.enableNavigateButton(this.btnPrev,  this.sequence.hasPrev());
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

    public selectInterval(startInterval: Interval) {
        this.tripMap.selectInterval(this.sequence.next());
        this.render();
    }
}