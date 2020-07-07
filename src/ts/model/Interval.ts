

/**
 * Участок трека. Участки могут накладываться друг на друга, пресекаться и т.д.
 */
export class Interval {
    /**
     * Начало интевала, включительно
     */
    private _from: Date;
    /**
     * Окончание интервала, ВКЛЮЧИТИТЕЛЬНО
     */
    private _to: Date;
    private _name: String;
    private _description: String;


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

    get name(): String {
        return this._name;
    }

    set name(value: String) {
        this._name = value;
    }

    get description(): String {
        return this._description;
    }

    set description(value: String) {
        this._description = value;
    }
}