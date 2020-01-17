import {Point} from "./Point";

export class TrackPoint extends Point{
    private _alt: number;
    private _date: Date;
    private _id: String;


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

    get id(): String {
        return this._id;
    }

    set id(value: String) {
        this._id = value;
    }
}