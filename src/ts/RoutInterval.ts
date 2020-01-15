import {TrackPoint} from "./TrackPoint";

/**
 * Участок маршрута.Участки маршрута могут накладываться друг на друга, пресекаться и т.д.
 */
export class RoutInterval {
    private fromPointId: string;
    private toPointId: string;
    private description: String;
}