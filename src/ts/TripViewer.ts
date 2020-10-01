/**
 * Карта маршрута, панель управления, с информацией и статистикой.
 */
import {TripMap} from "./TripMap";
import {TrackSegment} from "./model/TrackSegment";
import {TrackModelService} from "./TrackModelService";
import {Interval} from "./model/Interval";

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
    private trackModelService: TrackModelService;



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
        tripMap.addSelectionListener(() =>{
            this.highlightNavigationButtons();
            this.render();
        });


    }

    public setJsonData(data:any){
        this.highlightNavigationButtons();
        this.render();
    }

    public setModel(trackModelService: TrackModelService) {
        this.trackModelService = trackModelService;
        this.tripMap.setModel(trackModelService);
        this.highlightNavigationButtons();
        this.render();
    }

    private render(){
        let obj = this.tripMap.getSelected();
        const model = this.tripMap.getModel();

        if(!obj){
            const globalInterval = this.trackModelService.getGlobalInterval();
            const stat = this.trackModelService.getIntervalStatistic(globalInterval);
            this.title.innerHTML = TripViewer.stringify(model.name);
            this.description.innerHTML = TripViewer.stringify(model.description);
            this.distance.innerHTML = TripViewer.getDistanceText(stat.distance);
            this.setDatesFields(stat.realEnd, stat.realBegin, stat.timeInMotion);
            this.deltaH.innerHTML = TripViewer.getDeltaHText(stat.altitudeGain, stat.altitudeLoss);
        }

        if(obj instanceof Interval) {
            const interval = obj;
            if (interval) {
                const stat = this.trackModelService.getIntervalStatistic(interval);
                this.title.innerHTML = TripViewer.stringify(interval.name);
                this.description.innerHTML = TripViewer.stringify(interval.description);
                this.distance.innerHTML = TripViewer.getDistanceText(stat.distance);
                this.setDatesFields(stat.realEnd, stat.realBegin, stat.timeInMotion);
                this.deltaH.innerHTML = TripViewer.getDeltaHText(stat.altitudeGain, stat.altitudeLoss);

            }
        }

    }

    private static getDistanceText(trackLength: number) {
        return (trackLength / 1000).toFixed(2) + ' км';
    }

    private static getDeltaHText(gain: number, loss: number) {
        return `+${Math.round(gain)} / ${Math.round(loss)} м`;
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