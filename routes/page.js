const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');
const router = express.Router();
 
router.use((req, res, next) => {
  // console.log(res.locals)
  res.locals.user = req.user;
  // console.log(res.locals)
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  //좋아요
  res.locals.likeList = req.user ? req.user.Liked.map(f => f.id) : [];
  next();
});
 
router.get('/profile',isLoggedIn, (req, res) => {
  res.render('profile', { title: '내 정보 - NodeBird' });
});

router.get('/join',isNotLoggedIn, (req, res) => {
  res.render('join', { title: '회원가입 - NodeBird' });
});
 
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        attributes: ['id', 'nick'],
      }, 
      { 
        model: User,
        attributes: ['id', 'nick'],
        as: 'Liker',
        through: 'PostLike'
      },
    ],
      order: [['createdAt', 'DESC']],
    });
    // console.log(posts)
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
      // user: req.user,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 해시태그 검색 기능
// GET /hashtag?hashtag=노드
router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    // 해당 해쉬코드(query) 가 존재하는지 찾음
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      // 해당 해시태그에 딸려있는 게시글들을 가져와라, 거기에 해당 게시글의 작성자까지 갖와라
      posts = await hashtag.getPosts({ include: [{ model: User , attributes: ['id', 'nick'] }] });
      // console.log(posts[0].User)
    }

    return res.render('main', {
      title: `#${query} 검색결과 | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

/**
 * main.html
 * -> form-data로 한글 보내는 경우 
 * `app.use(express.urlencoded({ extended: false }));` 
 * 에서 처리를 해주지만
 * 
 * axios로 보내는 경우에는
 * axios.post(`/post/img?hashtag=${encodeURIComponent('노드')})
 * 와 같은 형태로 encodeURIComponent('한글') 해주어야 함
 * 
 * 서버에서는 
 * const query = decodeURIComponent(req.query.hashtag)
 * 와 같은 형태로 받아줘야 함 
 */

module.exports = router;