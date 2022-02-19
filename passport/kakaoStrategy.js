const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;

const User = require('../models/user');

module.exports = () => { 
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
    // accessToken, refreshToken => < OAUTH2 >
    // 카카오 프로필만 받아옴
  }, async (accessToken, refreshToken, profile, done) => {
    console.log('kakao profile', profile);
    try {
      // 가입되어 있는지 확인 (DB상에 데이터 있는지 확인)
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' },
      });
      // 가입되어 있으면 승인
      if (exUser) {
        done(null, exUser);
      // 아니면 새로 가입 시키기 
      } else {
        // console.log(profile)
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account_email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};