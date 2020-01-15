import {Point} from "./Point";
import {TrackPoint} from "./TrackPoint";
import {RoutInterval} from "./RoutInterval";

export class TripData{
    private _track: Array<TrackPoint> = [];
    private _infoPoints: Array<Point> = [];
    private _intervals: Array<RoutInterval> = [];


    constructor(track: Array<TrackPoint>, infoPoints: Array<Point>, intervals: Array<RoutInterval>) {
        this._track = track;
        this._infoPoints = infoPoints;
        this._intervals = intervals;
    }

    get track(): Array<TrackPoint> {
        return this._track;
    }

    set track(value: Array<TrackPoint>) {
        this._track = value;
    }

    get infoPoints(): Array<Point> {
        return this._infoPoints;
    }

    set infoPoints(value: Array<Point>) {
        this._infoPoints = value;
    }

    get intervals(): Array<RoutInterval> {
        return this._intervals;
    }

    set intervals(value: Array<RoutInterval>) {
        this._intervals = value;
    }
}