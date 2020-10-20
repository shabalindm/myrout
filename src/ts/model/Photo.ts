import {Mark} from "./Mark";
import {LatLng} from "leaflet";


export class Photo extends LatLng{
    private _url: String;
    /**
     * Номер фотографии (в соответсвии с нумерацией фотографий в документе)
     */
    private _number: String;
    private _name:String
    private _accuracy: number;


    constructor(url: String, number: String, name: String, accuracy: number, lat: number, lng: number) {
        super(lat, lng);
        this._url = url;
        this._number = number;
        this._name = name;
        this._accuracy = accuracy;
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


}