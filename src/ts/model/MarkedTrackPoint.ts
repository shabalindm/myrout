import {TrackPoint} from "./TrackPoint";

/**
 * Точка, разделяющаяя маршрут на логические отрезки, обычно - место лагеря.
 * От такой точки начинается свой локальный отчет расстояния, времени, и т.д.
 */
export class MarkedTrackPoint extends TrackPoint {
    private type: String;
    private description: String;
}