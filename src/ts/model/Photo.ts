import {Mark} from "./Mark";
import {LatLng} from "leaflet";


export class Photo extends LatLng{
    private _url: string;
    /**
     * Номер фотографии (в соответсвии с нумерацией фотографий в документе)
     */
    private _number: string;
    private _name:string
    private _accuracy: number;


    constructor(url: string, number: string, name: string, accuracy: number, lat: number, lng: number) {
        super(lat, lng);
        this._url = url;
        this._number = number;
        this._name = name;
        this._accuracy = accuracy;
    }

    get url(): string {
        return this._url;
    }

    set url(value: string) {
        this._url = value;
    }

    get number(): string {
        return this._number;
    }

    set number(value: string) {
        this._number = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get accuracy(): number {
        return this._accuracy;
    }

    set accuracy(value: number) {
        this._accuracy = value;
    }


}