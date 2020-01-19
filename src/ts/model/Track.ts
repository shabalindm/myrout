import {TrackPoint} from "./TrackPoint";
import {Interval} from "./Interval";

export class Track{
    private _points: Array<TrackPoint>= [];
    private _intervals: Array<Interval> = [];

    get points(): Array<TrackPoint> {
        return this._points;
    }

    set points(value: Array<TrackPoint>) {
        this._points = value;
    }

    get intervals(): Array<Interval> {
        return this._intervals;
    }

    set intervals(value: Array<Interval>) {
        this._intervals = value;
        this.intervals.forEach((i) => {i.track = this})
    }

}