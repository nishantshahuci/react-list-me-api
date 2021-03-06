const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = function(passport, db) {
  let opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRETORKEY || 'secret'
  };
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      db.select('id', 'name', 'email')
        .from('users')
        .where('id', jwt_payload.id)
        .then(user => {
          if (user[0]) {
            done(null, user[0]);
          } else {
            done(null, false);
          }
        })
        .catch(err => done(err, false));
    })
  );
};
