import {Mark} from "./Mark";


export class Photo extends Mark {
    private _url: String;
    /**
     * Номер фотографии (в соответсвии с нумерацией фотографий в документе)
     */
    private _number: String;


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
}