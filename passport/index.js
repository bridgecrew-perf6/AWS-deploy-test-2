const passport = require('passport');
const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const User = require('../models/user');
const Post = require('../models/post');
  
module.exports = () => {
    // req.login(user,~) 을 통해 user 전달
    passport.serializeUser((user, done) => {
    // user.id만 done
    // 세션에 user의 id만 저장
    // done 되는 순간 routes/auth.js 이동해 그 이후 함수 진행
       done(null, user.id);
    })
    // { id: 3, 'connect.sid': s%409302234 } 와 같은 형태로 저장
    // 세션쿠키인 connect.sid는 브라우저에 전달
 
    // 로그인이 되어있다면 Cookie에 { connect.sid : 값 } 저장되어 있음
    // 이 후 브라우저에서 요청마다 보내주는 connect.sid를 통해 id 판별 (deserializeUser) 
    // 해당 id를 통해 유저 복구
    passport.deserializeUser((id, done) => {
        User.findOne({ where: { id : id },
        include : [{
            model: User,
            attributes: ['id', 'nick'],
            // 구분하기 위해 as 써줌
            as: 'Followings',
            through: 'Follow'
        }, { 
            model: User,
            attributes: ['id', 'nick'],
            as: 'Followers',
            through: 'Follow'
        },  
        {
            model: Post,
            attributes: ['id'],
            as: 'Liked',
            through: 'PostLike'
            }
        ]
        })
            .then(user => {
                // console.log(user)
                return done(null, user)
            })
            // 이후 해당 유저는 req.user라는 속성으로 접근 가능하게 됨
            // 또한 로그인이 되어있다면 req.isAuthenticated() 값이 true
            .catch(err => done(err))
    });

    local();
    kakao();
}

/**
 * serialize: 직렬화
 * => 어떤 데이터를 다른곳에서 사용할 수 있도록 다른 포멧의 데이터로 바꾸는 것
 * => 현재 시퀄라이즈 객체를 세션에 저장할 수 있는 데이터 구조로 바꾸는 작업 하고 있음
 * 
 * deserialize: 역직렬화
 * => 다른 포멧의 데이터로 바뀐 데이터를 다시 원래 포멧으로 바꾸는 역할
 * => 세션에 저장된 데이터를 다시 시퀄라이즈 객체로 바꾸는 작업
 */