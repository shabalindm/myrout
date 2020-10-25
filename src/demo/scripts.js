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