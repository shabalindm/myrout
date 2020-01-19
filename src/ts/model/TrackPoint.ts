import {LatLng} from "leaflet";

export class TrackPoint extends LatLng{
    private _date: Date;
    private _id: String;

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