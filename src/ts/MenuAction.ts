export class MenuAction{
    private _name: string;
    private _callback: ()=> void;


    constructor(name: string, callback: () => void) {
        this._name = name;
        this._callback = callback;
    }

    get name(): string {
        return this._name;
    }

    get callback(): () => void {
        return this._callback;
    }
}