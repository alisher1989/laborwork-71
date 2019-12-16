const baseUrl = 'http://localhost:8000/api/v1/';

function getFullPath(path) {
    path = path.replace(/^\/+|\/+$/g, '');
    path = path.replace(/\/{2,}/g, '/');
    return baseUrl + path + '/';
}

function makeRequest(path, method, auth=true, data=null) {
    let settings = {
        url: getFullPath(path),
        method: method,
        dataType: 'json'
    };
    if (data) {
        settings['data'] = JSON.stringify(data);
        settings['contentType'] = 'application/json';
    }
    if (auth) {
        settings.headers = {'Authorization': 'Token ' + getToken()};
    }
    return $.ajax(settings);
}

function saveToken(token) {
    localStorage.setItem('authToken', token);
}

function getToken() {
    return localStorage.getItem('authToken');
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function logIn(username, password) {
    const credentials = {username, password};
    let request = makeRequest('login', 'post', false, credentials);
    request.done(function(data, status, response) {
        console.log('Received token');
        saveToken(data.token);
        formModal.modal('hide');
        enterLink.addClass('d-none');
        exitLink.removeClass('d-none');
    }).fail(function(response, status, message) {
        console.log('Could not get token');
        console.log(response.responseText);
    });
}

function logOut() {
    let request = makeRequest('logout', 'post', true);
    request.done(function(data, status, response) {
        console.log('Cleaned token');
        removeToken();
        enterLink.removeClass('d-none');
        exitLink.addClass('d-none');
    }).fail(function(response, status, message) {
        console.log('Could not clean token');
        console.log(response.responseText);
    });
}

function createQuote(text, author_name, author_email) {
    const credentials = {text, author_name, author_email};
    let request = makeRequest('quote/', 'post', true, credentials);
    request.done(function(data, status, response) {
        console.log(data);
        formModal.modal('hide');
    }).fail(function(response, status, message) {
        console.log('Could not add quote');
        console.log(response.responseText);
    });
}


function deleteQuote() {
    let request = makeRequest('quote/', 'delete', true).done(function(data)
    {console.log(data);}).fail(function(response) {console.log(response.responseJSON);});
}

let logInForm, quoteForm, homeLink, enterLink, exitLink, formSubmit, formTitle, content, formModal, createLink,
    usernameInput, passwordInput, authorInput, textInput, emailInput, editQuote;

function setUpGlobalVars() {
    logInForm = $('#log_in_form');
    editQuote = $('#update_quote');
    quoteForm = $('#quote_form');
    homeLink = $('#home_link');
    enterLink = $('#enter_link');
    exitLink = $('#exit_link');
    formSubmit = $('#form_submit');
    formTitle = $('#form_title');
    createLink = $('#create_link');
    content = $('#content');
    formModal = $('#form_modal');
    usernameInput = $('#username_input');

passwordInput = $('#password_input');
    authorInput = $('#author_input');
    textInput = $('#text_input');
    emailInput = $('#email_input');
}

function setUpAuth() {
    logInForm.on('submit', function(event) {
        event.preventDefault();
        logIn(usernameInput.val(), passwordInput.val());
    });

    enterLink.on('click', function(event) {
        event.preventDefault();
        console.log('yes');
        logInForm.removeClass('d-none');
        quoteForm.addClass('d-none');
        formTitle.text('Войти');
        formSubmit.text('Войти');
        formSubmit.off('click');
        formSubmit.on('click', function(event) {
            logInForm.submit();
        });
    });

    exitLink.on('click', function(event) {
        event.preventDefault();
        logOut();
    });
}

function createQuoteForm() {
    quoteForm.on('submit', function (event) {
        event.preventDefault();
        createQuote(textInput.val(), authorInput.val(), emailInput.val());
    });

    createLink.on('click', function (event) {
        event.preventDefault();
        console.log('yes');
        quoteForm.removeClass('d-none');
        logInForm.addClass('d-none');
        formTitle.text('Добавить');
        formSubmit.text('Добавить');
        formSubmit.off('click');
        formSubmit.on('click', function (event) {
            quoteForm.submit()
        });
    });
}

function checkAuth() {
    let token = getToken();
    if(token) {
        enterLink.addClass('d-none');
        exitLink.removeClass('d-none');
    } else {
        enterLink.removeClass('d-none');
        exitLink.addClass('d-none');
    }
}

function rateUp(id) {
    let request = makeRequest('quote/' + id + '/rate_up', 'post', false);
    request.done(function(data, status, response) {
        console.log('Rated up quote with id ' + id + '.');
        $('#rating_' + id).text(data.rating);
    }).fail(function(response, status, message) {
        console.log('Could not rate up quote with id ' + id + '.');
        console.log(response.responseText);
    });
}

function rateDown(id) {
    let request = makeRequest('quote/' + id + '/rate_down', 'post', false);
    request.done(function(data, status, response) {
        console.log('Rated down quote with id ' + id + '.');
        $('#rating_' + id).text(data.rating);
    }).fail(function(response, status, message) {
        console.log('Could not rate down quote with id ' + id + '.');
        console.log(response.responseText);
    });
}

function updateQuote(id) {
    quoteForm.on('submit', function (event) {
        event.preventDefault();
        createQuote(authorInput.val(id), emailInput.val(id), textInput.val(id));
    });
    editQuote.on('click', function (event) {
        event.preventDefault();
        console.log('edit');
        quoteForm.removeClass('d-none');
        logInForm.addClass('d-none');
        formTitle.text('Обновить');
        formSubmit.text('Обновить');
        formModal.modal('hide');
        formSubmit.off('click');
        formSubmit.on('click', function (event) {
            makeRequest('quote/' + id, 'patch', true, {
                'author_name': authorInput.val(id),
                'author_email': emailInput.val(id),
                'text': textInput.val(id)
            }).done(function (data) {
                console.log(data);
            }).fail(function (response) {
                console.log(response.responseJSON);
            }).submit();
        });
    });

}

function getQuotes() {
    let request = makeRequest('quote', 'get', false);
    request.done(function(data, status, response) {
        console.log(data);
        data.forEach(function(item, index, array) {
            content.append($(`<div class="card" id="quote_${item.id}">
                <p>${item.text}</p>
                <p id="rating_${item.id}">${item.rating}</p>
                <p><a href="#" class="btn btn-success" id="rate_up_${item.id}">+</a></p>
                <p><a href="#" class="btn btn-danger" id="rate_down_${item.id}">-</a></p>
                <p><a href="${'qoute/'}" class="btn btn-primary" id="update_quote${item.id}">Update</a></p>
            </div>`));
            $('#rate_up_' + item.id).on('click', function(event) {
                console.log('click');
                event.preventDefault();
                rateUp(item.id);
            });
            $('#rate_down_' + item.id).on('click', function(event) {
                console.log('click');
                event.preventDefault();
                rateDown(item.id);
            });
        });
    }).fail(function(response, status, message) {
        console.log('Could not get quotes.');
        console.log(response.responseText);function createQuote(text, author_name, author_email) {
    const credentials = {text, author_name, author_email};
    let request = makeRequest('quote/', 'post', true, credentials);
    request.done(function(data, status, response) {
        console.log(data);
        formModal.modal('hide');
    }).fail(function(response, status, message) {
        console.log('Could not add quote');
        console.log(response.responseText);
    });
}
    });
}

$(document).ready(function() {
    setUpGlobalVars();
    setUpAuth();
    checkAuth();
    getQuotes();
    createQuoteForm();
    updateQuote();
});