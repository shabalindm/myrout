import {LatLng} from "leaflet";

/**
 * Текстовая метка. Привязана по дате к точке трека.
 */
export class Mark {
    private _name: string;
    private _description?: string;
    private _lat: number;
    private _lng: number;
    private _iconUrl: string;


    constructor(name: string, description: string, lat: number, lng: number, iconUrl: string) {
        this._name = name;
        this._description = description;
        this._lat = lat;
        this._lng = lng;
        this._iconUrl = iconUrl;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get lat(): number {
        return this._lat;
    }

    set lat(value: number) {
        this._lat = value;
    }

    get lng(): number {
        return this._lng;
    }

    set lng(value: number) {
        this._lng = value;
    }

    get iconUrl(): string {
        return this._iconUrl;
    }

    set iconUrl(value: string) {
        this._iconUrl = value;
    }
}