import {LeafletEvent, Map, Point} from "leaflet";
import {MenuAction} from "./MenuAction";

export class ContextMenu {
    private map: Map;
    private menu:HTMLElement = document.getElementById("ctxMenu");


    constructor(map: Map) {
        this.map = map;
        map.addEventListener("click",(event)=>{
            this.hideMenu();
        },false)
    }

    private hideMenu() {
        const menu = this.menu;
        menu.style.display = "";
        menu.style.left = "";
        menu.style.top = "";
    }

    public showContextMenu(e:LeafletEvent, actions: Array<MenuAction>){
        let menu = this.menu;
        menu.innerHTML =''
        actions.forEach(action => {
            const item = document.createElement('menu');
            item.title = action.name;
            menu.appendChild(item);
            item.addEventListener('click', () => {
                this.hideMenu();
                action.callback()
            })

        })
        menu.style.display = "block";
        // @ts-ignore
        var latlng = e.latlng;
        var pixelPosition: Point = this.map.latLngToContainerPoint(latlng);
        menu.style.left = (pixelPosition.x) + "px";
        menu.style.top = (pixelPosition.y) + "px";
    }



}