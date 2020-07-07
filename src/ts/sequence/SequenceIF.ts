
export interface SequenceIF<T> {

    next(): T;
    prev(): T;
    current():T;
    hasNext():boolean;
    hasPrev():boolean;
    begin():T;
    end():T;

}