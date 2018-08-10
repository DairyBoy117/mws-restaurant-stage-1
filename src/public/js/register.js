if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then( function(reg) { 
        console.log("Service Worker Registered! :D");
    }).catch( function(error) {
        console.log("Registration failed :(");
    })
}