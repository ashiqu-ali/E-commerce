const tickContainer = document.getElementById("tick-container");
    const banner = document.getElementById("banner");
    const tick = document.getElementById("tick");
    const img = document.getElementById("img");

    setTimeout(() => {
        tickContainer.classList.add("hide");
        setTimeout(() => {
            img.classList.add("show");
            banner.classList.add("show");
        }, 1000);
    }, 5000);