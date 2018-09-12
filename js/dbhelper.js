let dbPromise;


/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      }
    };

    dbPromise = idb.open('restaurant-db', 1, function(upgradeDB) {
      const store = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
      const reviewsValStore = upgradeDB.createObjectStore('reviews');
      const tempReviewsValStore = upgradeDB.createObjectStore('tempReviews');
      const favoriteValStore = upgradeDB.createObjectStore('favorites');
      if (!upgradeDB.objectStoreNames.contains('restaurants')) {
        upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
        store.createIndex('by-neighborhood', 'neighborhood');
        store.createIndex('by-cuisine', 'cuisine_type');
      }
    });

    dbPromise.then(function(db) {
        const tx = db.transaction('restaurants', 'readwrite');
        const resp = tx.objectStore('restaurants');
        return resp.getAll();
      })
      .then(function(restaurants) {
        if(restaurants.length !== 0) {
          callback(null, restaurants)
        } else {
          fetch(DBHelper.DATABASE_URL, options)
            .then(resp => resp.json())
            .then(restaurants => {
              dbPromise.then(function(db) {
                const tx = db.transaction('restaurants', 'readwrite');
                const resp = tx.objectStore('restaurants');
                restaurants.forEach(restaurant => resp.put(restaurant));
                callback(null, restaurants);
                return tx.complete;
              });
            })
            .catch(error => callback(error, null));
        }
      });
  }

  /**
   * Fetch reviews.
   */

  static fetchRestaurantReviews(restaurant, callback) {
    fetch(`http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`)
      .then(response => response.json())
      .then(function(reviews) {
        dbPromise.then( (db) => {
          let reviewsValStore = db.transaction('reviews', 'readwrite').objectStore('reviews')
          reviewsValStore.put(reviews, restaurant.id)
        })
        callback(null, reviews)
      }).catch(function (err) {
        dbPromise.then( (db) => {
          let reviewsValStore = db.transaction('reviews').objectStore('reviews')
          return reviewsValStore.get(restaurant.id);
        }).then(val => {
          console.log('Failed to fetch reviews, pulled from cache');
          callback(null, val)
        })
      })
  }
  
  /**
   * Submit reviews.
   */

  static submitReview(review, callback) {
    dbPromise.then((db) => {
      let tempReviewsValStore = db.transaction('tempReviews', 'readwrite').objectStore('tempReviews')
      tempReviewsValStore.put(review, review.restaurant_id)
    })
    fetch( `http://localhost:1337/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(review)
    }).then(response => response.json())
      .then(function(newReview) {
        dbPromise.then((db) => {
          let tempReviewsValStore = db.transaction('tempReviews', 'readwrite').objectStore('tempReviews')
          tempReviewsValStore.delete(review.restaurant_id)
        })
        console.log("added Review, removed from cache")
        callback(null, newReview);
      }).catch(function(err) {
        console.log("Connection Issue, failed");
        window.alert("Currently Offline!")
        callback(err, null);
      })
  }

  /**
   * Fetch pending reviews.
   */

   static fetchPendingReviews(restaurant, callback) {
     dbPromise.then((db) => {
       let tempReviewsValStore = db.transaction('tempReviews', 'readwrite').objectStore('tempReviews')
       return tempReviewsValStore.get(restaurant.id.toString())
     }).then(tempReview => {
       if (!tempReview) {
         callback(null, null)
         return
       }
       this.submitReview(tempReview, (error, review) => {
         if (error) {
           console.log("Offline again, returning tempReview")
           console.log(tempReview)
           callback(tempReview, null)
         } else {
           console.log("successful POSTing tempReview")
           callback(null, review)
         }
       })
     })
   }


  /**
   * Fetch favorite restaurants.
   */
   
   static fetchFavorites(callback) {
     fetch(`${DBHelper.DATABASE_URL}/?is_favorite=true`)
     .then(response => response.json())
     .then(function(favorites){
       dbPromise.then( (db) => {
         let favoriteValStore = db.transaction('favorites', 'readwrite').objectStore('favorites')
         for (const favorite of favorites) {
           favoriteValStore.put(favorite, favorite.id);
         }
       })
       callback(null, favorites);
     }).catch(function (err) {
      dbPromise.then( (db) => {
        let favoriteValStore = db.transaction('favorites').objectStore('favorites')
        return favoriteValStore.getAll();
      }).then(val => {
        console.log("Failed to catch favorites from server, pulled from cache");
        callback(null, val);
      })
     })
   }

  /**
   * Fetch favorite restaurants by ID
   */
  static fetchFavoriteById(id, callback) {
    DBHelper.fetchFavorites((error, restaurants) => {
      if (error) {
        callback(error, null)
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          callback(null, restaurant);
        } else {
          callback('restaurant does not exist', null);
        }
      }
    })
  }

  static favoriteRestaurantById(restaurant, callback) {
    fetch(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=true`, {
      method: "PUT"
    }).then(response => response.json())
      .then(function(newRestaurant) {
        console.log("added Favorite")
        callback(null, newRestaurant);
      }).catch(function (err) {
        console.log("Connection issue, failed to favorite it");
        callback(err, null);
      })
    dbPromise.then( (db) => {
        let favoriteValStore = db.transaction('favorites', 'readwrite').objectStore('favorites')
        favoriteValStore.put(restaurant, restaurant.id); 
    }) 
  }

  static unfavoriteRestaurantById(restaurant, callback) {
    fetch(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=false`, {
      method: "PUT"
    }).then(response => response.json())
      .then(function(newRestaurant) {
        console.log("removed Favorite")
        callback(null, newRestaurant);
      }).catch(function (err) {
        console.log("Connection issue, failed to unfavorite it");
        callback(err, null);
      })
    dbPromise.then( (db) => {
        let favoriteValStore = db.transaction('favorites', 'readwrite').objectStore('favorites')
        favoriteValStore.delete(restaurant.id); 
    }) 
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }



}