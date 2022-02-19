const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 회원가입
router.post('/join', isNotLoggedIn, async (req, res, next) => {
    // body에 email, nick, password 받아옴
  const { email, nick, password } = req.body;
  try {
    // 기존 가입자 중 email로 가입한 사람 있는지 확인
    const exUser = await User.findOne({ where: { email } });
    // 있으면 리다이렉트
    // console.log(exUser)
    if (exUser) {
      return res.redirect('/join?error=exist');
    }
    // 비밀번호 해쉬화
    const hash = await bcrypt.hash(password, 12);
    // 비밀번호는 해쉬화해서 저장
    await User.create({
      email,
      nick,
      password: hash,
    });
    // 메인페이지로 리다이렉트
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});
  
router.post('/login', isNotLoggedIn, (req, res, next) => {
  // /login요청 시 passport.authenticate('local' 실행 -> localStrategy.js passport.use 이동
  // localStrategy.js에서 done함수 호출 시 다음 로직 진행
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    // 로그인 성공 시
    // req.login(user, ) -> passport/index.js 이동
    // passport/index.js에서 done 후에 그 다음 로직 실행
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      // 코드 상 적혀있지는 않지만 index.js에서 저장된 세션 쿠키 브라우저로 보내줌
      return res.redirect('/');
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  // 세션 쿠키를 서버에서 지워버림
  req.session.destroy();
  res.redirect('/');
});

// passport.authenticate('kakao') 하는 순간 카카오 로그인 페이지로 가서 로그인을 하게 됨
// 로그인을 성공하게 되면 카카오가 /kakao/callback으로 데이터와 함께 요청을 줌
router.get('/kakao', passport.authenticate('kakao'));

// 그리고 passport.authenticate('kakao', ~) 실행
// passport.authenticate('kakao')) : passport/kakao.js passport.use로 이동
router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
// 세션에 해당 id 저장 후 connect.sid에 해당하는 value값 보내줌 
// kakaoStrategy.js에서 로그인 성공 done함수 실행 후
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;