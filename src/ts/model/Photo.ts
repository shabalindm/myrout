import {Mark} from "./Mark";


export class Photo  {
    private _url: String;
    /**
     * Номер фотографии (в соответсвии с нумерацией фотографий в документе)
     */
    private _number: String;
    private _name:String
    private _accuracy: number;
    private _lat: number;
    private _lon: number;


    constructor(url: String, number: String, name: String, accuracy: number, lat: number, lon: number) {
        this._url = url;
        this._number = number;
        this._name = name;
        this._accuracy = accuracy;
        this._lat = lat;
        this._lon = lon;
    }

    get url(): String {
        return this._url;
    }

    set url(value: String) {
        this._url = value;
    }

    get number(): String {
        return this._number;
    }

    set number(value: String) {
        this._number = value;
    }

    get name(): String {
        return this._name;
    }

    set name(value: String) {
        this._name = value;
    }

    get accuracy(): number {
        return this._accuracy;
    }

    set accuracy(value: number) {
        this._accuracy = value;
    }


    get lat(): number {
        return this._lat;
    }

    set lat(value: number) {
        this._lat = value;
    }

    get lon(): number {
        return this._lon;
    }

    set lon(value: number) {
        this._lon = value;
    }
}