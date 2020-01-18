import {TrackPoint} from "./TrackPoint";

/**
 * Участок маршрута.Участки маршрута могут накладываться друг на друга, пресекаться и т.д.
 */
export class RoutInterval {
    private _fromPoint: TrackPoint;
    private _toPoint: TrackPoint;
    private _description: String;


    get fromPoint(): TrackPoint {
        return this._fromPoint;
    }

    set fromPoint(value: TrackPoint) {
        this._fromPoint = value;
    }

    get toPoint(): TrackPoint {
        return this._toPoint;
    }

    set toPoint(value: TrackPoint) {
        this._toPoint = value;
    }

    get description(): String {
        return this._description;
    }

    set description(value: String) {
        this._description = value;
    }
}