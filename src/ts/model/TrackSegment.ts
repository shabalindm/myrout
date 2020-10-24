/**
 * Сегмент трека
 */
import {TrackPoint} from "./TrackPoint";
import {Pause} from "./Pause";


export class TrackSegment{
    /**
     * Сегметны трека.
     */
    private _points: Array<TrackPoint> = [];


    get points(): Array<TrackPoint> {
        return this._points;
    }

    set points(value: Array<TrackPoint>) {
        this._points = value;
    }
}