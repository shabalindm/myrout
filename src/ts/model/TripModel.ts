import {TrackPoint} from "./TrackPoint";
import {Interval} from "./Interval";
import {Track} from "./Track";
import {InfoPoint} from "./InfoPoint";

export class TripModel{
    private _tracks: Array<Track> = [];
    private _infoPoints: Array<InfoPoint> = [];


    constructor(tracks: Array<Track>, infoPoints: Array<InfoPoint>) {
        this._tracks = tracks;
        this._infoPoints = infoPoints;
    }

    get tracks(): Array<Track> {
        return this._tracks;
    }

    set tracks(value: Array<Track>) {
        this._tracks = value;
    }

    get infoPoints(): Array<InfoPoint> {
        return this._infoPoints;
    }

    set infoPoints(value: Array<InfoPoint>) {
        this._infoPoints = value;
    }


}