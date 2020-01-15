import {Point} from "./Point";

export class TrackPoint extends Point{
    private _alt: number;
    private _date: Date;
    private id: String;



    constructor(lat: number, lng: number, alt: number, date: Date) {
        super();
        this.lat = lat;
        this.lng = lng;
        this._alt = alt;
        this._date = date;
    }


    get alt(): number {
        return this._alt;
    }

    set alt(value: number) {
        this._alt = value;
    }

    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }
}