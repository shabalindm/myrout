import {TripMap} from "./TripMap";
import {TrackModel} from "./model/TrackModel";
import {TrackModelService} from "./TrackModelService";
import {util} from "fabric/fabric-impl";
import {Util} from "./Util";

export class Toolbar {
    tripMap: TripMap;
    trackDescriptionsUrl: string;
    photoDescriptionsUrl: string;
    /**
     * родительский div, в котором сидит виджет
     * @private
     */
    private parent: Element;
    private addMarkBtn: HTMLElement;
    private addPhotoBtn: HTMLElement;
    private addIntervalBtn: HTMLElement;
    private findStopsBtn: HTMLElement;
    private saveBtn: HTMLElement;

    constructor(tripMap: TripMap, parent: Element,
                trackDescriptionsUrl: string,
                photoDescriptionsUrl: string) {
        this.trackDescriptionsUrl = trackDescriptionsUrl;
        this.photoDescriptionsUrl = photoDescriptionsUrl;
        this.tripMap = tripMap;
        this.parent = parent;
        this.addMarkBtn = this.get("btn-add-mark");
        this.addPhotoBtn = this.get("btn-add-photo");
        this.addIntervalBtn = this.get("btn-add-interval");
        this.findStopsBtn = this.get("btn-find-stops");
        this.saveBtn = this.get("btn-save");

        this.addMarkBtn.addEventListener('click', () => {
           this.tripMap.addMark();
        });
        this.addPhotoBtn.addEventListener('click', () => {
            this.tripMap.addPhoto();
        });
        this.addIntervalBtn.addEventListener('click', () => {
            this.tripMap.addInterval();
        });
        this.saveBtn.addEventListener('click', () => {
            this.save();
        });

        this.findStopsBtn.addEventListener('click', () => {
            this.findPauses();
        });

    }

    private findPauses() {
        const model = this.tripMap.trackModelService.model;
        model.segments.forEach((segment) => {
            const pauses = TrackModelService.findPauses(segment);
            model.pauses = model.pauses.concat(pauses);
        })
        this.tripMap.trackModelService.clearStatistic();
        this.tripMap.renderPauses();
    }


    private get(cssClass:string){
        return (<HTMLElement[]><any>this.parent.getElementsByClassName(cssClass))[0];
    }


    private save() {
        const model = this.tripMap.trackModelService.model;
        this.savePhoto(model);
        this.saveData(model);


    }

    private saveData(model: TrackModel) {
        let format = (d:Date) => Util.toMoment(d).format('YYYY-MM-DD HH:mm:ss');
        const intervals: Array<any> = [];
        model.intervals.forEach(interval => {
            intervals.push({
                name: interval.name,
                description: interval.description,
                from: format(interval.from),
                to: format(interval.to)
            })
        });

        const marks:Array<any> =[];
        model.marks.forEach(mark =>{
            marks.push({
                name: mark.name,
                description: mark.description,
                lat: mark.lat,
                lng: mark.lng
            })
        })
        const pauses:Array<any> =[];
        model.pauses.forEach(pause =>{
            pauses.push([format(pause.from), format(pause.to)]
            )
        })

        const dataJson = {
            name: model.name,
            description: model.description,
            intervals: intervals,
            marks: marks,
            pauses: pauses
        }

        const xhr = new XMLHttpRequest();
        const url = this.trackDescriptionsUrl;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log("data saved")
            }
        };
        // @ts-ignore
        const data = JSON.stringify(dataJson, null, 2);
        xhr.send(data);
    }

    private savePhoto(model: TrackModel) {
        const photoJson: Array<any> = [];

        model.photos.forEach(photo => {
            photoJson.push({
                number: photo.number,
                name: photo.name,
                lat: photo.lat,
                lng: photo.lng,
                file: photo.url
            })
        });
        var xhr = new XMLHttpRequest();
        var url = this.photoDescriptionsUrl;
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log("photos saved")
            }
        };
        // @ts-ignore
        var data = JSON.stringify(photoJson, null, 2);
        xhr.send(data);
    }
}