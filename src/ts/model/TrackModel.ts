/**
 * Модель данных для трека
 */

import {Mark} from "./Mark";
import {Photo} from "./Photo";
import {Interval} from "./Interval";
import {TrackSegment} from "./TrackSegment";


export class TrackModel{
    private _name: string;
    private _description: string;

    /**
     * Сегметны трека.
     */
    private _segments: Array<TrackSegment> = [];

    /**
     * Метки на треке. Каждая метка обязана быть привязана к точке трека, но может быть смещена относительно нее.
     */
    private _marks: Array<Mark> = [];

    /**
     * Фотографии. Каждая фотография обязана быть привязана к точке трека, но может быть смещена относительно нее.
     * Дата и время точки трека, к которой привязана фотография, может не совпадать с датой и временем фотографии.
     */
    private _photos: Array<Photo> = [];

    /**
     * Участки пути на треке. Участки могут накладываться друг на друга, пресекаться и т.д.
     */
    private _intervals: Array<Interval> = [];


    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get segments(): Array<TrackSegment> {
        return this._segments;
    }

    set segments(value: Array<TrackSegment>) {
        this._segments = value;
    }

    get marks(): Array<Mark> {
        return this._marks;
    }

    set marks(value: Array<Mark>) {
        this._marks = value;
    }


    get photos(): Array<Photo> {
        return this._photos;
    }

    set photos(value: Array<Photo>) {
        this._photos = value;
    }

    get intervals(): Array<Interval> {
        return this._intervals;
    }

    set intervals(value: Array<Interval>) {
        this._intervals = value;
    }
}