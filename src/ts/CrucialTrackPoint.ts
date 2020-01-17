/**
 * Точка, разделяющаяя маршрут на логические отрезки, обычно - место лагеря.
 * От такой точки начинается свой локальный отчет расстояния, времени, и т.д.
 */
import {NamedTrackPoint} from "./NamedTrackPoint";


export class CrucialTrackPoint extends NamedTrackPoint {
    private _arrivalTime: Date;
    private _leavingTime: Date;


    get arrivalTime(): Date {
        return this._arrivalTime;
    }

    set arrivalTime(value: Date) {
        this._arrivalTime = value;
    }

    get leavingTime(): Date {
        return this._leavingTime;
    }

    set leavingTime(value: Date) {
        this._leavingTime = value;
    }
}