const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const cors = require('cors');
/*
const db = require('knex')({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
});
*/
const db = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'nishant',
    password: '',
    database: 'listme'
  }
});

// require controllers
const userController = require('./controllers/user');
const listController = require('./controllers/list');

// initialize express app
const app = express();

// port number
const port = process.env.PORT || 3000;

// helmet middleware - secure apps by setting various HTTP headers
app.use(helmet());

// cors middleware - Cross Origin Resource Sharing, allows external domains to access API
app.use(cors());

// body-parser middleware - converts request body to json object
app.use(bodyParser.json());

// passport middleware - allows creation of tokens for protected routes
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport, db);

// user routes
app.get('/api', (req, res) => res.status(200).send('API is working'));
app.post('/api/user', userController.handleRegister(db, bcrypt));
app.post(
  '/api/user/authenticate',
  userController.handleAuthenticate(db, bcrypt)
);
app.get(
  '/api/user',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.status(200).json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
  }
);
app.delete(
  '/api/user',
  passport.authenticate('jwt', { session: false }),
  userController.handleDelete(db)
);

// list routes
app.post(
  '/api/list',
  passport.authenticate('jwt', { session: false }),
  listController.handleCreate(db)
);
app.get(
  '/api/list',
  passport.authenticate('jwt', { session: false }),
  listController.handleGetAll(db)
);
app.get(
  '/api/list/:id',
  passport.authenticate('jwt', { session: false }),
  listController.handleGet(db)
);
app.patch(
  '/api/list/:id',
  passport.authenticate('jwt', { session: false }),
  listController.handleUpdate(db)
);
app.post(
  '/api/item/',
  passport.authenticate('jwt', { session: false }),
  listController.handleAddItem(db)
);
app.patch(
  '/api/item/:id',
  passport.authenticate('jwt', { session: false }),
  listController.handleUpdateItem(db)
);
app.delete(
  '/api/item/:id',
  passport.authenticate('jwt', { session: false }),
  listController.handleDeleteItem(db)
);
app.delete(
  '/api/list/:id',
  passport.authenticate('jwt', { session: false }),
  listController.handleDeleteList(db)
);

// start server
app.listen(port, () => {
  console.log('Server started on port ' + port);
});
