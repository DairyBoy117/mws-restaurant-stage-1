let restaurant;
var map;
let isFavorite;
let reviews;
let pendingReviews;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fetchIfFavorite(id);
      fetchReviews();
      fetchPendingReviews();
      fillRestaurantHTML();

      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const div = document.getElementById("maincontent");
  
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  var altTag = 'Image of ' + restaurant.name + "restaurant";
  image.setAttribute('alt', altTag);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const addReview = document.getElementById('add-review');
  const reviewButton = document.createElement("a");
  reviewButton.setAttribute('href', `/review.html?id=${restaurant.id}`);
  addReview.append(reviewButton);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

}

fetchReviews = () => {
  let oldReviews;
  DBHelper.fetchRestaurantReviews(self.restaurant, (error, reviews) => {
    if (!reviews) {
      console.log('No reviews found');
      return;
    } else {
      self.reviews = reviews;
      fillReviewsHTML();
    }
  })
}
fetchPendingReviews = () => {
  DBHelper.fetchPendingReviews(self.restaurant, (tempReview, review) => {
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');
    if (review) {
      ul.appendChild(createReviewHTML(review));
      container.appendChild(ul);
    } else if (tempReview) {
      ul.appendChild(createReviewHTML(tempReview));
      container.appendChild(ul);
    } else {
      console.log("No pending reviews")
    }
  })
}

fetchIfFavorite = (id) => {
  DBHelper.fetchFavoriteById(id, (error, restaurant) => {
    let favorite = restaurant;
    if (!favorite) {
      console.log("Not favorite :(");
      return;
    } else {
      setFavorite();
    }
  });
}

setFavorite = () => {
  let checkbox = document.getElementById('isFavorited');
  checkbox.checked = true;
  checkbox.setAttribute("checked", "true");
  checkbox.setAttribute("aria-checked", "true");
  let header = document.getElementById('favoriteHeader');
  header.innerHTML = "Favorited";
}


let checkbox = document.getElementById('isFavorited');
checkbox.addEventListener("click", function() {
  if (checkbox.checked === true) {
    // add to favorites dbhelper
    DBHelper.favoriteRestaurantById(self.restaurant, (error, restaurant) => {
      let favorite = restaurant;
      if (!favorite) {
        console.log('Did not favorite successfully')
        return;
      } else {
        let checkbox = document.getElementById('isFavorited');
        checkbox.checked = true;
        checkbox.setAttribute("checked", "true");
        checkbox.setAttribute("aria-checked", "true");
        let header = document.getElementById('favoriteHeader');
        header.innerHTML = "Favorited";
      }
    })
  } else {
    DBHelper.unfavoriteRestaurantById(self.restaurant, (error, restaurant) => {
      let favorite = restaurant;
      if (!favorite) {
        console.log('Did not unfavorite successfully')
        return;
      } else {
        let checkbox = document.getElementById('isFavorited');
        checkbox.checked = false;
        checkbox.setAttribute("checked", "false");
        checkbox.setAttribute("aria-checked", "false");
        let header = document.getElementById('favoriteHeader');
        header.innerHTML = "Add to Favorites";
      }
    })
  }
})

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.setAttribute('tabindex', '0');
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

let formReview = document.getElementById('reviewForm');
formReview.addEventListener('submit', function(e) {
  e.preventDefault();
})

let submitReview = document.getElementById('reviewSubmitBtn');
submitReview.addEventListener('click', function(event) {
  let userName = document.getElementById('reviewUserName').value;
  let rating = document.getElementById('reviewRating').value;
  let comments = document.getElementById('restaurantComments').value;
  let oldReview = {
    name: userName,
    restaurant_id: self.restaurant.id,
    rating: rating,
    comments: comments
  }
  DBHelper.submitReview(oldReview, (error, review) => {
    let newReview = review;
    let formReview = document.getElementById('reviewForm');
    const container = document.getElementById('reviews-container');
    const ul = document.getElementById('reviews-list');
    if (!newReview) {
      console.warn('No connectivity')
      formReview.reset();
      ul.appendChild(createReviewHTML(oldReview));
      container.appendChild(ul);
    } else {
      formReview.reset();
      ul.appendChild(createReviewHTML(review));
      container.appendChild(ul);
    }
  })
})

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', '0');

  const name = document.createElement('h4');
  name.setAttribute('tabindex', '0');
  name.innerHTML = review.name;
  li.appendChild(name);
/*
  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);
*/
  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute('tabindex', '0');
  li.appendChild(comments);

  li.setAttribute('aria-label', 'Review from ' + review.name);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.innerHTML = restaurant.name;
  a.setAttribute('aria-current', 'page');
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Hide / Show map.
 */

function showMap() {
  let element = document.getElementById("map");
  element.classList.toggle("hidden");
}