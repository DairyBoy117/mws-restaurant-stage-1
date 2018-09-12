var staticCache = "static-cache-v1";


self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(staticCache).then(function(cache) {
            return cache.addAll([
                "/",
                "/index.html",
                "/restaurant.html",
                "/css/styles.css",
                "/css/responsive.css",
                "/data/restaurants.json",
                "/js/",
                "/js/dbhelper.js",
                "/js/main.js",
                "/js/restaurant_info.js",
                "/js/register.js",
                "/js/idb.js",
                "/img/logo.png"
            ]).catch(function(error){
                console.log("Failed to open cache D:")
            });
        })
    );
});


self.addEventListener("fetch", function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return ( response || fetch(event.request).then(function(fetchResponse) {
                return caches.open(staticCache).then(function(cache) {
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