const path = require('path')

var express = require('express')
var passport = require('passport')
var Strategy = require('passport-local').Strategy

const mysql = require('mysql2')
const crypto = require('crypto')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'alexis',
  database: 'timbox',
})

connection.connect()

passport.use(new Strategy((username, password, cb) => {
  connection.query('select * from users where email = ?', [username], (err, results) => {
    if (err) return cb(err)
    const user = results[0]
    if (!user) return cb(null, false)
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    if (user.hash !== hash) return cb(null, false)
    return cb(null, user)
  })
}))

passport.serializeUser((user, cb) => cb(null, user.email))

passport.deserializeUser((email, cb) => {
  connection.query('select * from users where email = ?', [email], (err, results) => {
    if (err) return cb(err)
    cb(null, results[0])
  })
})

var app = express()

app.engine('mustache', require('mustache-express')())
app.set('view engine', 'mustache')
app.set('views', __dirname + '/templates')

// app.use(require('cookie-parser')())
app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}))
app.use(require('cors')())

app.use(passport.initialize())
app.use(passport.session())

const ensureLogin = require('connect-ensure-login').ensureLoggedIn('/iniciar-sesion.html')

app.get('/', (req, res) => {
  if (!req.user) res.redirect('/iniciar-sesion.html')
  else res.redirect('/administracion')
})

async function getAdmValues (user) {
  const query = 'select * from branches where user_email = ?'
  const branches = await connection.promise().query(query, [user.email])
    .then(x => x[0])
    .then(branches => Promise.all(branches.map(async b => {
      const query = 'select * from employees where branch_id = ?'
      const employees = await connection.promise().query(query, [b.id])
        .then(x => x[0])
      return { ...b, employee_num: employees.length }
    })))

  return { ...user, has_branches: branches.length > 0, branches }
}

app.get(
  '/administracion',
  ensureLogin,
  (req, res) => {
    getAdmValues(req.user)
      .then(x => res.render('administracion', { ...x, user: req.user }))
  }
)

app.get(
  '/registrar-usuario',
  ensureLogin,
  (req, res) => res.render('registrar-usuario', { user: req.user })
)

app.post('/registrar-usuario', (req, res) => {
  const values = [
    req.body.email,
    crypto.createHash('sha256').update(req.body.password).digest('hex'),
    req.body.full_name,
    req.body.rfc,
    req.body.company_name,
  ]

  connection.query('insert into users values (?, ?, ?, ?, ?)', values, err => {
    if (err) res.send('Hubo un error guardando el Usuario, intenta de nuevo')
    else res.send(`Usuario guardado ahora puedes <a href="/iniciar-sesion.html">authenticarte</a>`)
  })
})

app.get(
  '/registrar-sucursal',
  ensureLogin,
  (req, res) => res.render('registrar-sucursal', { user: req.user })
)

app.post(
  '/registrar-sucursal',
  ensureLogin,
  (req, res) => {
    const values = [
      req.user.email,
      req.body.name,
      req.body.address,
      req.body.colonia,
      req.body.pc,
      req.body.city,
      req.body.country,
    ]

    const query = `
      insert into branches (user_email, name, address, colonia, pc, city, country)
      values (?, ?, ?, ?, ?, ?, ?)
    `

    connection.query(query, values, err => {
      if (err) res.send('Hubo un error guardando la Sucursal, intenta de nuevo')
      else res.redirect('/')
    })
  }
)

async function getBranchData (id) {
  const branch_q = 'select * from branches where id = ?'
  const branch = await connection.promise().query(branch_q, [id])
    .then(x => x[0][0])

  // const employees_q = 'select * from employees where branch_id = ?'
  const employees_q = `
    select employees.*, branches.name as branch_name 
    from employees
    left join branches on branches.id = employees.branch_id
    where employees.branch_id = ?
  `
  const employees = await connection.promise().query(employees_q, [branch.id])
    .then(x => x[0])

  return { ...branch, has_employees: employees.length > 0, employees }
    
}

app.get(
  '/editar-sucursal/:id',
  ensureLogin,
  (req, res) => {
    const branchId = req.params.id
    getBranchData(branchId)
      .then(branch => {
        res.render('editar-sucursal', { ...branch, user: req.user})
      })
  }
)

app.post(
  '/editar-sucursal/:id',
  ensureLogin,
  (req, res) => {
    const values = [
      req.body.name,
      req.body.address,
      req.body.colonia,
      req.body.pc,
      req.body.city,
      req.body.country,
      req.params.id
    ]

    const query = `
      update branches set
        name = ?,
        address = ?,
        colonia = ?,
        pc = ?,
        city = ?,
        country = ?
      where id = ?
    `

    connection.query(query, values, err => {
      if (err) res.send('Hubo un error editando la Sucursal, intenta de nuevo')
      else res.redirect('/')
    })
  }
)

app.get(
  '/registrar-empleado',
  ensureLogin,
  (req, res) => {
    connection.query(
      'select * from branches where user_email = ?', 
      [req.user.email],
      (err, results) => {
        const branches = results.map(x => ({ name: x.name, id: x.id }))
        res.render('registrar-empleado', { branches, user: req.user })
      }
    )
  }
)

app.post('/registrar-empleado', (req, res) => {
  const values = [
    req.user.email,
    req.body.name,
    req.body.rfc,
    req.body.branch_id,
    req.body.job,
  ]

  const query = `
    insert into employees (user_email, name, rfc, branch_id, job)
    values (?, ?, ?, ?, ?)
  `

  connection.query(query, values, err => {
    if (err) res.send('Hubo un error guardando el Empleado, intenta de nuevo')
    else res.redirect('/')
  })
})

app.get(
  '/editar-empleado/:id',
  ensureLogin,
  (req, res) => {
    const query = `
      select employees.*, branches.name as branch_name 
      from employees
      left join branches on branches.id = employees.branch_id
      where employees.id = ? 
    `
    connection.query(query, [req.params.id], (err, results) => {
      const employee = results[0]
      connection.query('select * from branches where user_email = ?', [req.user.email], (err, results) => {
        const branches = results
        console.log({ ...employee, branches })
        res.render('editar-empleado', { ...employee, branches, user: req.user })  
      })
      // console.log(results)
      // res.render('editar-empleado', results[0])
    })
  }
)

app.post(
  '/editar-empleado/:id',
  ensureLogin,
  (req, res) => {
    const values = [
      req.body.name,
      req.body.rfc,
      req.body.branch_id,
      req.body.job,
      req.params.id
    ]

    const query = `
      update employees set
        name = ?,
        rfc = ?,
        branch_id = ?,
        job = ?
      where id = ?
    `

    connection.query(query, values, err => {
      if (err) {
        console.log(err)
        res.send('Hubo un error editando el Empleado, intenta de nuevo')
      }
      else res.redirect('/')
    })
  }
)
  
app.post(
  '/iniciar-sesion',
  passport.authenticate('local', { failureRedirect: '/iniciar-sesion.html?failure=true' }),
  (req, res) => res.redirect('/')
)

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

async function validateAv(_email, _rfc) {
  let email = true
  let rfc = true

  const emails = await connection.promise().query('select * from users where email = ?', [_email])
  if (emails[0].length > 0) email = false

  const rfcs = await connection.promise().query('select * from users where rfc = ?', [_rfc])
  if (rfcs[0].length > 0) rfc = false

  return { email, rfc }
}

app.get('/validar-disponible', (req, res) => {
  validateAv(req.query.email, req.query.rfc)
    .then(res.json.bind(res))
})

app.use(express.static('public'))

app.listen(3000);