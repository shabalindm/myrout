import {SequenceIF} from "./SequenceIF";
import {Interval} from "../model/Interval";
import {TripModel} from "../model/TripModel";

export class SequenceListSequence<T> implements SequenceIF<T> {

    private sequences:Array<SequenceIF<T>>;
    private cur : number;

    constructor(sequenses: Array<SequenceIF<T>>, cur: number) {
        //отфильтровываме пустые, без них проще
        this.sequences = sequenses.filter((i) => i.hasNext() || i.hasPrev());
        this.cur = cur;
    }

    hasNext(): boolean {
       return  this.sequences[this.cur].hasNext() || this.cur <this.sequences.length -1;
    }

    hasPrev(): boolean {
        return  this.sequences[this.cur].hasPrev() || this.cur > 0;
    }

    next(): T {
        if(this.sequences[this.cur].hasNext()){
            return this.sequences[this.cur].next();
        } else {
            this.cur++;
            return this.sequences[this.cur].begin();
        }
    }

    prev(): T {
        if(this.sequences[this.cur].hasPrev()){
            return this.sequences[this.cur].prev();
        } else {
            this.cur--;
            return this.sequences[this.cur].end();
        }
    }

    begin(): T {
        this.cur = 0;
        return this.sequences[0].begin()
    }

    end(): T {
        this.cur = 0;
        return this.sequences[0].begin()
    }

    current(): T {
         return this.sequences[this.cur].current();
    }



}
