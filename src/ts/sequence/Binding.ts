import {SequenceIF} from "./SequenceIF";
import {Interval} from "../model/Interval";
import {TrackPoint} from "../model/TrackPoint";

/**
 * Привязка объекта карты к точке трека
 */
export class Binding {
    public readonly point: TrackPoint;
    public readonly object: any;

    constructor(point: TrackPoint, object: any) {
        this.point = point;
        this.object = object;
    }
}