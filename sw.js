var cacheID = "restaraunt-001";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheID).then(cache => {
            return cache
                .addAll([
                    "/",
                    "/index.html",
                    "/css/styles.css",
                    "/css/responsive.css",
                    "/data/restaurants.json",
                    "/js/",
                    "/js/dbhelper.js",
                    "/js/main.js",
                    "/js/restaurant_info.js",
                    "/js.register.js"
                ])
                .catch(error => {
                    console.log("Caches open failed: " + error);
                });
        })
    );
});
