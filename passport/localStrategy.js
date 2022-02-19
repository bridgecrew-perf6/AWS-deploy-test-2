const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');
 
module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',  // req.body.email
    passwordField: 'password', // req.body.password
  }, async (email, password, done) => {
    try {
      const exUser = await User.findOne({ where: { email } });
      if (exUser) {
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {
          done(null, exUser);
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};

// done(에러, 로그인 성공 시 유저 객체, 실패 시 메세지)
// done함수 호출 시 다시 routes/auth.js로 이동

// id 쓰고 싶으면 user model
// id: {
//     type: Sequelize:INTEGER(11),
//     allowNull: false,
//     primaryKey: true,
// }
