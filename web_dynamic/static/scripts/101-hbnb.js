const selectedAmenities = {};
const selectedStates = {};
const selectedCities = {};

$(document).ready(function () {
  /* check api status */
    $.get('http://0.0.0.0:5001/api/v1/status', function (res, status) {
	if (status === 'success') {
	    if (res.status === 'OK') {
		$('div#api_status').addClass('available');
	    } else {
		$('div#api_status').removeClass('available');
	    }
	} else {
	    if ($('div#api_status').hasClass('available')) {
		$('div#api_status').removeClass('available');
	    }
	}
    });

  /* amenity filter system */
    $('.amenities input').each(function () {
	$(this).bind('change', function (e) {
	    if (e.target.checked) {
		if (!Object.prototype.hasOwnProperty.call(selectedAmenities, e.target.getAttribute('data-name'))) {
		    selectedAmenities[e.target.getAttribute('data-name')] = (e.target.getAttribute('data-id'));
		}
	    } else {
		if (Object.prototype.hasOwnProperty.call(selectedAmenities, e.target.getAttribute('data-name'))) {
		    delete selectedAmenities[e.target.getAttribute('data-name')];
		}
	    }
	    if (Object.keys(selectedAmenities).length > 0) {
		$('.amenities h4').text(Object.keys(selectedAmenities).join(', '));
	    } else {
		$('.amenities h4').html('&nbsp;');
	    }
	});
    });

  /* states filter system */
    $('.locations ul li h2 input').each(function () {
	$(this).bind('change', function (e) {
	    if (e.target.checked) {
		if (!Object.prototype.hasOwnProperty.call(selectedStates, e.target.getAttribute('data-name'))) {
		    selectedStates[e.target.getAttribute('data-name')] = (e.target.getAttribute('data-id'));
		}
	    } else {
		if (Object.prototype.hasOwnProperty.call(selectedStates, e.target.getAttribute('data-name'))) {
		    delete selectedStates[e.target.getAttribute('data-name')];
		}
	    }
	    $('.locations h4').text([Object.keys(selectedStates).join(', '), Object.keys(selectedCities).join(', ')].join(', '));
	    if ($('.locations h4').text === '') {
		$('.locations h4').html('&nbsp;');
	    }
	});
    });

  /* cities filter system */
    $('.locations ul li ul li input').each(function () {
	$(this).bind('change', function (e) {
	    if (e.target.checked) {
		if (!Object.prototype.hasOwnProperty.call(selectedCities, e.target.getAttribute('data-name'))) {
		    selectedCities[e.target.getAttribute('data-name')] = (e.target.getAttribute('data-id'));
		}
	    } else {
		if (Object.prototype.hasOwnProperty.call(selectedCities, e.target.getAttribute('data-name'))) {
		    delete selectedCities[e.target.getAttribute('data-name')];
		}
	    }
	    $('.locations h4').text([Object.keys(selectedStates).join(', '), Object.keys(selectedCities).join(', ')].join(', '));
	    if ($('.locations h4').text === '') {
		$('.locations h4').html('&nbsp;');
	    }
	});
    });

  /* render places */
    getPlaces()

  /* review show/hide feature */
	.then(function () {
	    $('.rev_toggle').each(function () {
		$(this).click(function (e) {
		    e.stopPropagation();
		    if (e.target.innerText === 'show') {
			getReviews(e.target.getAttribute('place-id'))
			    .then(reviews => {
				Array.prototype.forEach.call(reviews, review => {
				    $(this).parent().find('.reviews_list').append(`<li>
                <h3>${review.from}</h3>
                <p>${review.text}</p>
              </li>`);
				});
				e.target.innerText = 'hide';
			    });
		    } else {
			e.target.innerText = 'show';
			$(this).parent().find('.reviews_list').html('');
		    }
		});
	    });
	}).catch(err => console.log(err));

  /* rerender places after submitting filters */
    $('.filters button').click(function () {
	getPlaces({
	    amenities: Object.values(selectedAmenities),
	    cities: Object.values(selectedCities),
	    states: Object.values(selectedStates)
	})
    /* review show/hide feature */
	    .then(function () {
		$('.rev_toggle').each(function () {
		    $(this).click(function (e) {
			e.stopPropagation();
			if (e.target.innerText === 'show') {
			    getReviews(e.target.getAttribute('place-id'))
				.then(reviews => {
				    Array.prototype.forEach.call(reviews, review => {
					$(this).parent().find('.reviews_list').append(`<li>
                    <h3>${review.from}</h3>
                    <p>${review.text}</p>
                  </li>`);
				    });
				    e.target.innerText = 'hide';
				});
			} else {
			    e.target.innerText = 'show';
			    $(this).parent().find('.reviews_list').html('');
			}
		    });
		});
	    }).catch(err => console.log(err));
    });
});

async function getReviews (placeId) {
    const users = {};
    const reviews = [];

    await $.ajax({
	url: 'http://0.0.0.0:5001/api/v1/users',
	type: 'GET',
	dataType: 'json',
	success: function (data, status) {
	    if (status === 'success') {
		data.forEach(user => {
		    users[user.id] = user.first_name + ' ' + user.last_name;
		});
	    }
	}
    });

    await $.ajax({
	url: `http://0.0.0.0:5001/api/v1/places/${placeId}/reviews`,
	type: 'GET',
	dataType: 'json',
	success: function (data, status) {
	    if (status === 'success') {
		data.forEach(rev => {
		    const res = {};
		    let time = rev.updated_at.split('T')[0];
		    time = time.split('-');
		    let date = new Date(time[0], time[1], time[2]).toString();
		    date = date.split(' ');
		    res.from = `From ${users[rev.user_id]} the ${date[2]}${GetDaySuffix(date[2])} ${date[1]} ${date[3]}`;
		    res.text = rev.text;
		    reviews.push(res);
		});
	    }
	}
    });

    return (reviews);
}

function getPlaces (dataa = {}) {
  /* render places */
    return new Promise(function (resolve, reject, data = dataa) {
	$.ajax({
	    url: 'http://0.0.0.0:5001/api/v1/places_search/',
	    type: 'POST',
	    data: JSON.stringify(data),
	    contentType: 'application/json',
	    dataType: 'json',
	    error: function (err) {
		reject(err);
	    },
	    success: function (data, status) {
		if (status === 'success') {
		    $('section.places').html('');
		    data.forEach((place) => $('section.places').append(`<article>
          <div class="title_box">
            <h2>${place.name}</h2>
            <div class="price_by_night">${place.price_by_night}</div>
          </div>
          <div class="information">
            <div class="max_guest">${place.max_guest} Guests</div>
                  <div class="number_rooms">${place.number_rooms} Bedrooms</div>
                  <div class="number_bathrooms">${place.number_bathrooms} Bathrooms</div>
          </div>
          <div class="user">
          </div>
          <div class="description">
            ${place.description}
          </div>
          <div class="reviews">
            <h2>Reviews</h2>
            <span class="rev_toggle" place-id=${place.id}>show</span>
            <ul class="reviews_list"></ul>
          </div>
        </article>`));
		    resolve('places loaded');
		}
		reject(new Error('failed to load places'));
	    }
	});
    });
}

function GetDaySuffix (day) {
    switch (day) {
    case '1':
    case '21':
    case '31':
	return 'st';
    case '2':
    case '22':
	return 'nd';
    case '3':
    case '23':
	return 'rd';
    default:
	return 'th';
    }
}
