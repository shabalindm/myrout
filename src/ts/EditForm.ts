import {LatLng, Map} from "leaflet";
import L = require("leaflet");
import {Mark} from "./model/Mark";
import {Interval} from "./model/Interval";
import {Photo} from "./model/Photo";
import {Pause} from "./model/Pause";
import {Util} from "./Util";

export class EditForm {
    private map: Map;


    constructor(map: Map) {
        this.map = map;
    }

    private commonObjectHtml = "<form name=\"editForm\" style=\"padding: 20px; border: solid 1px; background-color: white; width: 300px\">\n" +
        "            <label for=\"name\">Имя:</label><br>\n" +
        "            <input type=\"text\" style=\"width: 100%\" name=\"name\"><br>\n" +
        "            <label>Описание:</label><br>\n" +
        "            <textarea style=\"width: 100%\" name=\"description\"></textarea>\n" +
        "            <br><br>\n" +
        "            <input type=\"submit\" style=\"margin-left: 220px\" value=\"OK\">\n" +
        "        </form>"


    private photoObjectHtml = "<form name=\"editForm\" style=\"padding: 20px; border: solid 1px; background-color: white; width: 300px\">\n" +
        "            <label for=\"dir\">Папка</label></label><br>\n" +
        "            <input type=\"text\" style=\"width: 100%\" name=\"dir\"><br>\n" +
        "            <input type=\"file\" style=\"width: 100%\" name=\"file\" ><br>\n" +
        "            <label>Название:</label><br>\n" +
        "            <input type=\"text\" style=\"width: 100%\" name=\"name\"><br>\n" +
        "            <br><br>\n" +
        "            <input type=\"submit\" style=\"margin-left: 220px\" value=\"OK\">\n" +
        "        </form>"


    private pauseHtml = "<form name=\"editForm\" style=\"padding: 20px; border: solid 1px; background-color: white; width: 300px\">\n" +
        "            <label for=\"name\">Начало:</label><br>\n" +
        "            <input type=\"text\" style=\"width: 100%\" name=\"from\"><br>\n" +
        "            <label>Конец:</label><br>\n" +
        "             <input type=\"text\" style=\"width: 100%\" name=\"to\"><br>\n" +
        "            <br><br>\n" +
        "            <input type=\"submit\" style=\"margin-left: 220px\" value=\"OK\">\n" +
        "        </form>"

    static lastDir:string = "/";

    public showForPhoto(latlng: LatLng, obj: Photo|null, onSave: (obj:any) => void){
        const popup = L.popup()
            .setLatLng(latlng)
            .setContent(this.photoObjectHtml)
            .openOn(this.map);
        // @ts-ignore
        const form: HTMLFormElement = document.forms.editForm;



        // @ts-ignore
        const dirField:HTMLInputElement = form.dir;

        const fileField:HTMLInputElement = form.file;
        // @ts-ignore
        const nameField:HTMLInputElement = form.name;
        if(obj){
            const url = obj.url;
            const dir = url.substring(0, url.lastIndexOf("/") + 1);
            dirField.value = dir;
            nameField.value = obj.name.toString();
        } else {
            dirField.value = EditForm.lastDir;//Подкостылим пока - будем запоминать последнее значение
        }


        form.onsubmit = () => {
            let url = "/";
            if(obj) {
                url = obj.url.toString();
            }

            if (fileField.files.length > 0) {
                url = dirField.value + fileField.files[0].name;
                EditForm.lastDir =  dirField.value;
            }
            onSave({
                url: url,
                name:nameField.value
            });
            popup.remove();
            return false;
        }

    }

    public showForCommonObject(latlng: LatLng, obj: Mark|Interval, onSave: (obj:any) => void){
      const popup = L.popup()
          .setLatLng(latlng)
          .setContent(this.commonObjectHtml)
          .openOn(this.map);
        // @ts-ignore
        const form: HTMLFormElement = document.forms.editForm;

        // @ts-ignore
        const nameField:HTMLInputElement = form.name;
        const descriptionField:HTMLInputElement = form.description;
        if(obj) {
            nameField.value = obj.name.toString();
            descriptionField.value = obj.description.toString();
        }

        form.onsubmit=() => {
            onSave({
                name: nameField.value,
                description: descriptionField.value
            });
            popup.remove();
            return false;
        }

    }

    public showPauseObject(latlng: LatLng, obj: Pause, onSave: (obj:any) => void){
        let format = (d:Date) => Util.toMoment(d).format('YYYY-MM-DD HH:mm:ss');
        const popup = L.popup()
            .setLatLng(latlng)
            .setContent(this.pauseHtml)
            .openOn(this.map);
        // @ts-ignore
        const form: HTMLFormElement = document.forms.editForm;

        // @ts-ignore
        const fromField:HTMLInputElement = form.from;
        const toField:HTMLInputElement = form.to;
        if(obj) {
            fromField.value = format(obj.from);
            toField.value = format(obj.to);
        }

        form.onsubmit=() => {
            onSave({
                from: fromField.value,
                to: toField.value
            });
            popup.remove();
            return false;
        }

    }

}