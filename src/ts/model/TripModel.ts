import {Point} from "./Point";
import {TrackPoint} from "./TrackPoint";
import {Interval} from "./Interval";
import {Track} from "./Track";

export class TripModel{
    private _tracks: Array<Track> = [];
    private _infoPoints: Array<Point> = [];


    constructor(tracks: Array<Track>, infoPoints: Array<Point>) {
        this._tracks = tracks;
        this._infoPoints = infoPoints;
    }

    get tracks(): Array<Track> {
        return this._tracks;
    }

    set tracks(value: Array<Track>) {
        this._tracks = value;
    }

    get infoPoints(): Array<Point> {
        return this._infoPoints;
    }

    set infoPoints(value: Array<Point>) {
        this._infoPoints = value;
    }


}