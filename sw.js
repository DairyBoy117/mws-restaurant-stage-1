/* Create static cache */
var staticCache = "static-cache-v1";

/* Installing the service worker */
self.addEventListener("install", function(event) {
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

/* Listen for fetch event */
self.addEventListener("fetch", function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return ( response || fetch(event.request).then(function(fetchResponse) {
                return caches.open(staticCache).then(function(cache) { //returns cached items if it has them
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                }).catch(function(error) {
                    return new Response("Not connected to internet ._.", {
                        status: 404,
                        statusText: "Not connected to internet ._."
                    });
                })
            );
        })
    );
});