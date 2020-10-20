import {LatLng} from "leaflet";

/**
 * Текстовая метка. Привязана по дате к точке трека.
 */
export class Mark extends LatLng{
    private _name: string;
    private _description?: string;
    private _iconUrl: string;


    constructor(name: string, description: string, lat: number, lng: number, iconUrl: string) {
        super(lat, lng);
        this._name = name;
        this._description = description;
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


    get iconUrl(): string {
        return this._iconUrl;
    }

    set iconUrl(value: string) {
        this._iconUrl = value;
    }
}