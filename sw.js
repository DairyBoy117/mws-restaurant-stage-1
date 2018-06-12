/* Create static cache */
var staticCache = "static-cache-v1";

/* Installing the service worker */
self.addEventListener('install', function(event) {
    event.waitUntil( //App is instructed to wait 
        caches.open(staticCache).then(function(cache) {
            return cache.addAll([ //adds items into new static-cache-v1
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
            ]).catch(function(error){
                console.log("Failed to open cache D:")
            });
        })
    );
});