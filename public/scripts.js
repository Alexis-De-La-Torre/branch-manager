function encode(data) {
    let ret = []
    for (let d in data)
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]))
    return ret.join('&')
}

function get (url, fn) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function () {
        if (req.readyState === 4 && req.status === 200) {
            fn(req.responseText)
        }
    }
    return req.send();
}

function post (url, data, fn) {
    var req = new XMLHttpRequest();
    req.open('POST', url, true);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    req.onreadystatechange = function () {
        if (req.readyState === 4 && req.status === 200) {
            fn(req.responseText)
        }
    }
    return req.send(JSON.stringify(data))
}

function parse (text) { return JSON.parse(text) } 

function validateSignin (form) {
    var inputs = [
        { instance: form.full_name, display: 'Nombre Completo' },
        { instance: form.email, display: 'Coreo Electronico' },
        { instance: form.rfc, display: 'RFC' },
        { instance: form.company_name, display: 'Nombre de la Empresa' },
        { instance: form.password, display: 'Contrasena' },
        { instance: form.password_confirm, display: 'Confirmar Contrasena' },
    ]

    //clean all inputs
    for (let i = 0; i < inputs.length; i++) {
        var el = inputs[i].instance
        el.classList.remove('invalid')
    }

    var errorBox = document.getElementById('errors')

    //clean error box
    errorBox.innerHTML = ''
    errorBox.style.display = 'none'

    var emptyElements = []

    //check for empty inputs and put them in an invalid state
    for (let i = 0; i < inputs.length; i++) {
        var el = inputs[i].instance
        var display = inputs[i].display

        if (el.value === '') {
            el.classList.add('invalid')
            emptyElements.push(display)
        }
    }

    if (emptyElements > 0) {
        var msg = ''

        //populate error box
        for (let i = 0; i < emptyElements.length; i++) {
            msg += '<li>' + emptyElements[i] + '</li>'
        }

        msg = '<p>Los siguientes campos no pueden estar vacios:</p>' 
            + '<ul>' + msg + '</ul>'

        errorBox.innerHTML = msg
        errorBox.style.display = 'block'

        return
    }

    // check for valid RFC
    var valid = /^[A-Za-z]{4}[0-9]{6}[A-Za-z0-9]{3}$/.test(form.rfc.value)
    if (!valid) {
        errorBox.innerHTML = errorBox.innerHTML + '<p>El formato del RFC es incorrecto</p>'
        errorBox.style.display = 'block'
        form.rfc.classList.add('invalid')
        return
    }

    // check if passwords are the same
    if (form.password.value !== form.password_confirm.value) {
        errorBox.innerHTML = errorBox.innerHTML + '<p>Las contrasenas no coinciden</p>'
        errorBox.style.display = 'block'
        form.password_confirm.classList.add('invalid')
        return
    }

    // check if email/rfc aren't already registered
    var query = encode({ email: form.email.value, rfc: form.rfc.value })

    get('/validar-disponible?' + query, res => {
        var json = parse(res)
        var emailAv = json.email
        var rfcAv = json.rfc

        // if both email and rfc are avaiable send to register
        if (emailAv && rfcAv) {
            form.submit()
        }
        else {
            if (!rfcAv) errorBox.innerHTML = errorBox.innerHTML 
                + '<p>El RFC ya esta registrado</p>'

            if (!emailAv) errorBox.innerHTML = errorBox.innerHTML 
                + '<p>El Email ya esta registrado</p>'
            
            errorBox.style.display = 'block'
            
        }
    })
}

function validateBranch (form) {
    var pc = form.pc.value
    if (/^[0-9]{5}$/.test(pc)) return true
    else {
        alert('El codigo postal puede contener solo numeros y excactamente 5 caracteres')
        return false
    }
}

function validateEmployee (form) {
    if (form.branch.value === '') {
        alert('Selecciona una sucursal')
        return false
    }
    return true
}