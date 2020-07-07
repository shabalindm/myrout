import {LatLng} from "leaflet";

/**
 * Текстовая метка. Привязана по дате к точке трека.
 */
export class Mark {
    private _date: Date;
    private _name: String;
    private _description?: String;

    /**
     * Координаты точки, если она смещена относительно трека.
     */
    private _position?: LatLng;

    get description(): String {
        return this._description;
    }

    set description(value: String) {
        this._description = value;
    }


    get name(): String {
        return this._name;
    }

    set name(value: String) {
        this._name = value;
    }


    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }

    get position(): LatLng {
        return this._position;
    }

    set position(value: LatLng) {
        this._position = value;
    }
}