const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const cors = require('cors');
const db = require('knex')({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
});

// require controllers
const userController = require('./controllers/user');
// const listController = require('./controllers/list');

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
app.post('/api/user/register', userController.handleRegister(db, bcrypt));
app.post(
  '/api/user/authenticate',
  userController.handleAuthenticate(db, bcrypt)
);
app.get(
  '/api/user/profile',
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
  '/api/user/delete',
  passport.authenticate('jwt', { session: false }),
  userController.handleDelete(db)
);

// start server
app.listen(port, () => {
  console.log('Server started on port ' + port);
});
