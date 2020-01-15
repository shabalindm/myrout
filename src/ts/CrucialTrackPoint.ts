import {MarkedTrackPoint} from "./MarkedTrackPoint";

/**
 * Точка, разделяющаяя маршрут на логические отрезки, обычно - место лагеря.
 * От такой точки начинается свой локальный отчет расстояния, времени, и т.д.
 */
export class CrucialTrackPoint extends MarkedTrackPoint {
    private arrivalTime: Date;
    private leavingTime: Date;

}