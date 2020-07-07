import {LatLng} from "leaflet";

/**
 * Точка трека. Дата является ключом
 */
export class TrackPoint extends LatLng {
    private _date: Date;


    constructor(latitude: number, longitude: number, altitude: number, date: Date) {
        super(latitude, longitude, altitude);
        this._date = date;
    }

    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }
}