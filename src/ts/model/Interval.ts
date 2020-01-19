import {TrackPoint} from "./TrackPoint";
import {Track} from "./Track";

/**
 * Участок трека. Участки могут накладываться друг на друга, пресекаться и т.д.
 */
export class Interval {
    /**
     * Начало интевала, включительно
     */
    private _from: number;
    /**
     * Окончание интервала, не включаяя
     */
    private _to: number;
    private _name: String;
    private _description: String;

    /**
     * Ссылка на объект Track
     */
    private _track: Track;


    get track(): Track {
        return this._track;
    }

    set track(value: Track) {
        this._track = value;
    }

    get name(): String {
        return this._name;
    }

    set name(value: String) {
        this._name = value;
    }

    get from(): number {
        return this._from;
    }

    set from(value: number) {
        this._from = value;
    }

    get to(): number {
        return this._to;
    }

    set to(value: number) {
        this._to = value;
    }

    get description(): String {
        return this._description;
    }

    set description(value: String) {
        this._description = value;
    }
}