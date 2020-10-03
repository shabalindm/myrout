import {SequenceIF} from "./SequenceIF";

export class ArraySequence <T> implements SequenceIF<T> {

    private readonly _array:Array<T>;
    private _cur : number = 0;
    private readonly maxIndex:number;

    constructor(array: Array<T>) {
        this._array = array;
        this.maxIndex = this._array.length - 1;
    }


    set cur(value: number) {
        this._cur = value;
    }

    public goTo(predicate: (arg0: T) => boolean){
        const arr = this._array;
        for (let i = 0; i < arr.length; i++) {
            if (predicate(arr[i])) {
                this._cur = i;
                break;
            }
        }
    }

    hasNext(): boolean {
        return this._cur < this.maxIndex;
    }

    hasPrev(): boolean {
        return this._cur > 0;
    }

    next(): T {
        this._cur++;
        return this._array[this._cur]
    }

    prev(): T {
        this._cur--;
        return this._array[this._cur]
    }

    begin(): T {
        this._cur = 0;
        return this._array[this._cur]
    }

    end(): T {
        this._cur = this._array.length - 1;
        return this._array[this._cur]
    }

    current(): T {
        return this._array[this._cur];
    }


    get array(): Array<T> {
        return this._array;
    }
}
