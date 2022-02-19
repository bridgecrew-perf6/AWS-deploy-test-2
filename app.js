// https://github.com/ZeroCho/nodejs-book/tree/master/
const express = require('express');
// const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
// 요청마다 서버에 개인의 저장공간 생성해주는 역할
// 웹 브라우저는 sessionID 만을 가지고 있음
// 동작순서
// 1. 서버 -> 웹 세션 값을 보내줌 (sid, 의미없는 식별자)
// 2. 접속 시 자신이 가지고 있는 sid 서버에 전달
// 3. 서버는 그 sid를 통해 해당 유저를 식별
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
// 서버 보안
const helmet = require('helmet');
const hpp = require('hpp');

dotenv.config()
const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models')
const passportConfig = require('./passport');

const app = express();
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');

nunjucks.configure('views', {
    express: app,
    watch: true,
}); 
sequelize.sync({ force: false })
// true: table 자체가 다 지워졌다가 다시 생성 (모델 수정 or 생성 시 )
    .then(() => {
        console.log('데이터베이스 연결 성공')
    })
    .catch((err) => {
        console.error(err);
    })


passportConfig(); // passport/index.js 함수 (passport.serializeUser, passport.deserializeUser) 연결 

if ( process.env.NODE_ENV === 'production') {
    app.enable('trust proxy')   // 프록시 서버를 사용
    // contentSecurityPolicy default: true -> 컨텐츠 로딩 시 외부 css, script 에서 에러나는 경우가 많음
    app.use(helmet( {contentSecurityPolicy: false} ));
    app.use(hpp());
    app.use(morgan('combined'));   // 불특정 다수의 id 로그에 찍히게 하기 위해
}
else {
    app.use(morgan('dev'));
}

// 해당 경로에 있는 정적파일 제공, localhost:8001/picture.png
app.use(express.static(path.join(__dirname, 'public')));
// /img 주소로 요청 시 uploads 폴더 파일을 가져갈 수 있도록 
app.use('/img', express.static(path.join(__dirname, 'uploads')));
// req.body로 처리가능
app.use(express.json())
// form 데이터 처리 - 로그인 시 req.body.user,req.body.password 
// but, enctype="multipart/form-data"인 경우 처리 해주지못함 
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser(process.env.COOKIE_SECRET));

const sessionOption = {
    // 요청이 왔을 때 세션에 수정사항이 생기지 않더라도 다시 저장할지 여부
    resave: false,
    // 세션에 저장할 내역이 없더라도 세션을 저장할지
    saveUninitialized: false,
    // signed 되어 있기 때문에 읽을 수 없는 문자열로 되어 있음
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    }
    // name: 'connect.sid', //default 이름
}
// 배포 모드일 시 프록시 추가
if (process.env.NODE_ENV === 'production') {
    // Nginx 쓸 때 필요 ( 설정해서 문제가 되는 경우는 없음, 설정을 안해서 문제가 되는 경우가 많음)
    // 실무에서는 대부분 proxy서버(Nginx) 를 사용 
    sessionOption.proxy =  true;
    // https 적용시에는 해당 secure true로 바꿔줘야 함
    // sessionOption.cookie.secure = true;
}
app.use(session(sessionOption))

// 로그인 후 들어오는 요청에서 세션쿠키(connect.sid) 의 id 판별  
// index.js에서 deserializeUser 실행
// 인증 모듈 초기화
app.use(passport.initialize());

// 역직렬화 하여 connect.sid 에 잇는 해당 id 판별 할 수 있도록 해줌
app.use(passport.session());

app.use('/', pageRouter)
app.use('/auth', authRouter)
app.use('/post', postRouter)
app.use('/user', userRouter)

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다`);
    error.status = 404;
    next(error);
})

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500).render('error');
})

module.exports = app;
