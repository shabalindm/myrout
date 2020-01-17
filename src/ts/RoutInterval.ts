import {TrackPoint} from "./TrackPoint";

/**
 * Участок маршрута.Участки маршрута могут накладываться друг на друга, пресекаться и т.д.
 */
export class RoutInterval {
    private _fromPointId: string;
    private _toPointId: string;
    private _name: string;
    private _description: string;


    get fromPointId(): string {
        return this._fromPointId;
    }

    set fromPointId(value: string) {
        this._fromPointId = value;
    }

    get toPointId(): string {
        return this._toPointId;
    }

    set toPointId(value: string) {
        this._toPointId = value;
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
}