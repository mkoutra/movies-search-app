$(function() {
    var debounceTimeout = null

    $('#searchInput').on('input', function() {
        clearTimeout(debounceTimeout)   // Reset timer
        debounceTimeout = setTimeout(() => getMovie(this.value.trim()), 1500)   // Set Timer to 1500 msec
    })

    $('#showMore').on('click', function() {
        onShowMoreClicked()
    })
})

function getMovie(title) {
    if (!title) return
    
    onBeforeSend()  // Clean things
    
    fetchMovieFromApi(title)
}

function fetchMovieFromApi(title) {
    let xhr = new XMLHttpRequest()
    // API key is placed inside .env.
    // To get your own API KEY visit: http://www.omdbapi.com/apikey.aspx
    let OMDB_API_KEY
    xhr.open('GET', `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${title}`)
    xhr.timeout = 5000
    xhr.ontimeout = (e) => onApiError(e)
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                handleResults(JSON.parse(xhr.responseText))
            } else {
                onApiError()
            }
        }
    }
    xhr.send()
}

/**
 * 
 * @param {Object} response 
 */
function handleResults(response) {
    if (response.Response == 'True') {
        let transformed = transform(response)
        buildMovie(transformed)
    } else if (response.Response == 'False') {
        hideComponent('#waiting')
        showNotFound()
    }
}

/**
 * 1. Transforms to camelCase
 * 2. Removes N/A
 * 3. Creates imdb link from imdb id 
 *
 * @param {Object} response 
 * @returns  The response with camelCase attributes
 */
function transform(response) {
    let camelCaseKeysResponse = camelCaseKeys(response)
    clearNotAvailableInformation(camelCaseKeysResponse)
    buildImdbLink(camelCaseKeysResponse)
    return camelCaseKeysResponse
}

function camelCaseKeys(response) {
    return _.mapKeys(response, (v, k) => _.camelCase(k))
}

function clearNotAvailableInformation(response) {
    for (const key in response) {
        if (response.hasOwnProperty(key) && response[key] === 'N/A') {
            response[key] = '-'
        }
    }
}

function buildImdbLink(response) {
    if (response.imdbId && response.imdbId !== 'N/A') {
        response.imdbId = `https://www.imdb.com/title/${response.imdbId}/`
    }
}

function buildMovie(response) {
    if (response.poster) {
        // After poster loading
        $('#image').attr('src', response.poster).on('load', function() {
            buildMovieMetadata(response, $(this))   // $(this) is the poster
        })
    } else {
        // Poster does not exist
        buildMovieMetadata(response)
    }
}

function buildMovieMetadata(response, imageTag) {
    hideComponent('#waiting')
    handleImage(imageTag)
    handleLiterals(response)
    showComponent('.movie')
}

function hideComponent(selector) {
    return $(selector).addClass('hidden')
}

function handleImage(imageTag) {
    // Remove previous image and replace it in case an image is available 
    imageTag ? $('#image').replaceWith(imageTag) : $('#image').removeAttr('src')
}

function handleLiterals(response) {

    $('.movie').find('[id]').each((index, item) =>  {
        if ($(item).is('a')) {
            // ids must be te same as those on the API response
            $(item).attr('href', response[item.id])
        } else {
            let valueElement = $(item).children('span')
            let metadataValue = response[item.id]
            
            // if span exists insert metadata to span, otherwise insert metadata to item
            valueElement.length ? valueElement.text(metadataValue) : $(item).text(metadataValue)
        }
    })
}

function showNotFound() {
    $('.not-found').clone().removeClass('hidden').appendTo($('.center'))
}

function hideNotFound() {
    $('.center').find('.not-found').remove()
}

function showError() {
    $('.error').clone().removeClass('hidden').appendTo($('.center'))
}

function hideError() {
    $('.center').find('.error').remove()
}

function hideExtras() {
    // jQuery's hide()
    $('.extended').hide()
}

function collapsePlot() {
    $('#plot').removeClass('expanded')
}

function showComponent(selector) {
    return $(selector).removeClass('hidden')
}

function onBeforeSend() {
    showComponent('#waiting')
    hideComponent('.movie')
    hideNotFound()
    hideError()
    collapsePlot()
    hideExtras()
}

function onApiError() {
    hideComponent('#waiting')
    showError()
}

function onShowMoreClicked() {
    $('#plot').toggleClass('expanded')

    if ($('.extended').is(':visible')) {
        $('.extended').hide(700)
    } else {
        $('.extended').show(700)
    }
}