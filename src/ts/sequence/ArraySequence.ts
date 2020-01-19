import {SequenceIF} from "./SequenceIF";

export class ArraySequence <T> implements SequenceIF<T> {

    private array:Array<T>;
    private cur : number;
    private _from:number;
    private _to:number;


    constructor(array: Array<T>, cur: number, ) {
        this.array = array;
        this.cur = cur;
        this._from = 0;
        this._to = array.length;
    }


    set from(value: number) {
        this._from = value;
    }

    set to(value: number) {
        this._to = value;
    }

    hasNext(): boolean {
        return this.cur < this._to - 1;
    }

    hasPrev(): boolean {
        return this.cur > this._from;
    }

    next(): T {
        this.cur++;
        return this.array[this.cur]
    }

    prev(): T {
        this.cur--;
        return this.array[this.cur]
    }

    begin(): T {
        this.cur = this._from;
        return this.array[this.cur]
    }

    end(): T {
        this.cur = this._to;
        return this.array[this.cur]
    }

    current(): T {
        return this.array[this.cur];
    }


}
