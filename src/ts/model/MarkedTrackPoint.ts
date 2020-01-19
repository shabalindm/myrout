/**
 * Точка, разделяющаяя маршрут на логические отрезки, обычно - место лагеря.
 * От такой точки начинается свой локальный отчет расстояния, времени, и т.д.
 */
import {TrackPoint} from "./TrackPoint";


export class MarkedTrackPoint extends TrackPoint {
    private _description: String;
    private _name: String;

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
}