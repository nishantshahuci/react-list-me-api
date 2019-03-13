const jwt = require('jsonwebtoken');

// routes for Users API

module.exports.handleRegister = (db, bcrypt) => (req, res) => {
  const { name, email, password } = req.body;

  // check if name, email, and password are given
  if (!name)
    return res.status(400).json({
      success: false,
      message: 'Missing name'
    });
  if (!email)
    return res.status(400).json({
      success: false,
      message: 'Missing email'
    });
  if (!password)
    return res.status(400).json({
      success: false,
      message: 'Missing password'
    });

  // check if the user already exists
  db.select('email')
    .from('login')
    .where('email', email)
    .then(data => {
      if (data[0]) {
        return res.status(400).json({
          success: false,
          message: 'User with email ' + email + ' already exists'
        });
      }

      // encrypt password and add user
      const hash = bcrypt.hashSync(password);
      db.transaction(trx => {
        trx
          .insert({
            hash: hash,
            email: email
          })
          .into('login')
          .returning('email')
          .then(loginEmail => {
            return trx
              .insert({
                name: name,
                email: loginEmail[0]
              })
              .into('users')
              .returning(['id', 'name', 'email'])
              .then(user => {
                return res.status(201).json({
                  success: true,
                  user: user[0]
                });
              });
          })
          .then(trx.commit)
          .catch(trx.rollback);
      }).catch(err => res.status(500).json('Unable to register'));
    })
    .catch(err => res.status(500).json('Unable to register'));
};

module.exports.handleAuthenticate = (db, bcrypt) => (req, res) => {
  const { email, password } = req.body;

  // check if name, email, and password are given
  if (!email)
    return res.status(400).json({
      success: false,
      message: 'Missing email'
    });
  if (!password)
    return res.status(400).json({
      success: false,
      message: 'Missing password'
    });

  // get email record from login table
  db.select('email', 'hash')
    .from('login')
    .where('email', email)
    .then(data => {
      // compare the hash
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db
          .select('id', 'name', 'email')
          .from('users')
          .where('email', email)
          .then(user => {
            // create token
            const token = jwt.sign(user[0], process.env.SECRETORKEY, {
              expiresIn: 3600 // 1 hour
            });
            res.status(200).json({
              success: true,
              user: user[0],
              token: token
            });
          })
          .catch(err =>
            res.status(400).json({
              success: false,
              message: 'Uable to retrieve user'
            })
          );
      } else {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid credentials' });
      }
    })
    .catch(() =>
      res.status(400).json({ success: false, message: 'Invalid credentials' })
    );
};

module.exports.handleDelete = db => (req, res) => {
  const { email } = req.user.email;
  db.select('id')
    .from('lists')
    .where('owner', email)
    .then(lists => {
      db.transaction(trx => {
        trx('items')
          .whereIn('list', lists)
          .del()
          .then(num => {
            trx('lists')
              .whereIn('id', lists)
              .del()
              .then(num => {
                trx('login')
                  .where('email', email)
                  .del()
                  .then(num => {
                    trx('users')
                      .where('email', email)
                      .del()
                      .then(num => {
                        res.status(200).json({
                          success: true,
                          message: 'Successfully deleted user'
                        });
                      });
                  });
              });
          })
          .then(trx.commit)
          .catch(trx.rollback);
      }).catch(err =>
        res.status(500).json({
          success: false,
          message: 'Unable to delete user'
        })
      );
    })
    .catch(err =>
      res.status(500).json({
        success: false,
        message: 'Unable to delete user'
      })
    );
};
