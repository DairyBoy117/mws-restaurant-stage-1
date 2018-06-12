/* Registering the service worker */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(reg => { 
        console.log("Service Worker Registered!");
    }).catch(error => {
        console.log("Registration failed :( ");
    })
}