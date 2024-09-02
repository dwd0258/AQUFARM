var mysql = require('mysql')
var localStrategy = require('passport-local').Strategy;
var crypto = require('crypto');

module.exports = function (passport, options) {
    const db = mysql.createConnection(options);

    passport.use(new localStrategy(
    {
        usernameField: 'uid',
        passwordField: 'upw'
    },
    function(username, password, done) {
        db.query('select * from members where id=?', [username],
        function (err, res) {
            var base64crypto = (password) => { return crypto.createHash('sha512').update(password).digest('base64') };
            if (err) return done(err);
            if (!res[0]) return done(null, false, { message: '아이디를 확인해주세요.' });
            if (res[0].pw !== base64crypto(password)) return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
            var user = res[0];
            return done(null, user);
        }
        )
    }
    ));
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    // 로그인 이후 검증 필요한 페이지마다 검사
    passport.deserializeUser(function(user, done) {
    db.query('select * from members where id=?', [user],
        function (err, res) {
            if (err) done(err);
            if (!res[0]) done(err);
            var user = res[0];
            done(null, user);
        }
    )
    });
}
  