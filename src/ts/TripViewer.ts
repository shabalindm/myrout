/**
 * Карта маршрута и панель управления.
 */
import {TripMap} from "./TripMap";
import {SequenceListSequence} from "./sequence/SequenceListSequence";
import {ArraySequence} from "./sequence/ArraySequence";
import {TripModel} from "./model/TripModel";
import {Parser} from "./Parser";

export class TripViewer {

    tripMap:TripMap;
    private btnPrev: HTMLElement = this.get("btn-prev");
    private btnNext: HTMLElement = this.get("btn-next");

    private get(id:string){
        return document.getElementById(id)
    }

    constructor(tripMap: TripMap) {
        this.tripMap = tripMap;
        this.btnNext.addEventListener('click', () => {
            if (this.tripMap.hasNextInterval()) {
                tripMap.nextInterval();
                this.highlightNavigationButtons();
            }
        });
        this.btnPrev.addEventListener('click', () => {
            if (this.tripMap.hasPrevInterval()) {
                tripMap.prevInterval();
                this.highlightNavigationButtons();
            }
        });

    }

    public setJsonData(data:any){
        let tripData = Parser.parseResponse(data);
        this.tripMap.setData(tripData);
        this.highlightNavigationButtons();
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