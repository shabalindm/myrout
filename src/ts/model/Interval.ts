

/**
 * Участок трека. Участки могут накладываться друг на друга, пресекаться и т.д.
 */
export class Interval {


    constructor(from: Date, to: Date, name: string, description: string) {
        this._from = from;
        this._to = to;
        this._name = name;
        this._description = description;
    }

    /**
     * Начало интервала, включительно
     */
    private _from: Date;
    /**
     * Окончание интервала, ВКЛЮЧИТЕЛЬНО
     */
    private _to: Date;
    private _name: string;
    private _description: string;
    private _id: string;


    get from(): Date {
        return this._from;
    }

    set from(value: Date) {
        this._from = value;
    }

    get to(): Date {
        return this._to;
    }

    set to(value: Date) {
        this._to = value;
    }

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

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }
}