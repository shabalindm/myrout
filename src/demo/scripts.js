var modal = initModal();

document.MY_ROUTE.setEditMode();
document.MY_ROUTE.createAPI({
    track_url: "track_kavkaz_2020_clean.gpx",
    utcOffset: "180",
    from: "2020-08-01 10:00:00",
    to: "2020-08-03 18:00:00",
    track_descriptions_url: "part-1.json",
    photo_descriptions_url: "photos-1.json"
})
    .then((api) => {
        //Сразу инициализировать карту не получиться, ибо она скрыта. Поэтому идем через ленивую инициализацию.
        const widgetLazyHolder = api.createWidgetLazyHolder(document.getElementById("trip-interactive-map"),
            {
                centerLat: 43.131232,
                centerLng: 43.349606,
                zoom: 12,
                track_descriptions_url: "part-1.json",
                photo_descriptions_url: "photos-1.json"
            });


        const photos = document.getElementsByClassName("photo");
        for (const photoElement of photos) {
            api.initPhoto(photoElement)
        }

        const intervalLinks =  document.getElementsByClassName("interval");
        for (const intervalLink of intervalLinks) {
            intervalLink.onclick = ()=>{
                try {
                    modal.show();
                    const widget = widgetLazyHolder.getWidget();
                    api.selectIntervalById(intervalLink.getAttribute("data-id"), widget);
                } catch (e) {
                    console.log(e);
                }
                return false
            };
        }

    });








var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if(content.init){
            content.init();
        }
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
            for(const img of content.getElementsByTagName("img")){
                if(!img.getAttribute("src")){
                    img.setAttribute("src", img.getAttribute("data-src"))
                }
            }
        }
    });
}

function initModal() {
    var modal = document.getElementById("modal");
    var span = document.getElementsByClassName("close")[0];


    var showModal = function () {
        modal.style.display = "block";
    }

// When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

// When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    return {show: showModal};
}