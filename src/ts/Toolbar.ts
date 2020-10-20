import {TripMap} from "./TripMap";

export class Toolbar{
    tripMap:TripMap;
    /**
     * родительский div, в котором сидит виджет
     * @private
     */
    private parent: Element;
    private addMarkBtn: HTMLElement;
    private addPhotoBtn: HTMLElement;
    private addIntervalBtn: HTMLElement;
    private addStopBtn: HTMLElement;



    constructor(tripMap: TripMap, parent: Element) {
        this.tripMap = tripMap;
        this.parent = parent;
        this.addMarkBtn = this.get("btn-add-mark");
        this.addPhotoBtn = this.get("btn-add-photo");
        this.addIntervalBtn = this.get("btn-add-interval");
        this.addStopBtn = this.get("btn-add-stop");

        this.addMarkBtn.addEventListener('click', () => {
           this.tripMap.addMark();
        });
        this.addPhotoBtn.addEventListener('click', () => {
            this.tripMap.addPhoto();
        });
        this.addIntervalBtn.addEventListener('click', () => {
            this.tripMap.addInterval();
        });
    }



    private get(cssClass:string){
        return (<HTMLElement[]><any>this.parent.getElementsByClassName(cssClass))[0];
    }


    private save(){

    }

}