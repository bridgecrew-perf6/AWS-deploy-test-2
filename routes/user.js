const express = require('express');

const { isLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 팔로잉하기
// :id => 팔로잉 할 사람
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    // 나('팔로잉 누른 사람') 찾기
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
    // 내가 :id 번 사용자를 팔로잉
    /**
     * belongstoMany, hasmany: 복수형태 (인자로 배열 넣기)
     * hasone: 단수
     */
    // user 모델의 쿼리 형태에 따라 달라짐
    // 현재는 as를 정해줬기 때문에 다음과 같은 형태
    // (만약 없다면 addPosts)
      await user.addFollowings([parseInt(req.params.id, 10)]);
      res.send('success');
    } else { 
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/**
 * setFollowings: 수정가능, but 기존에 등록되어 있던 것 다 제거 후 새로운 것 추가
 * removeFollowings: 제거
 * getFollwings: 내 팔로워들 가져오기
 */

//팔로잉 끊기
 router.post('/:id/unfollow', isLoggedIn, async (req, res, next) => {
  try {
    // 나('팔로잉 누른 사람') 찾기
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
    // 내가 :id 번 사용자를 팔로잉
    /**
     * belongstoMany, hasmany: 복수형태 (인자로 배열 넣기)
     * hasone: 단수
     */
    // user 모델의 쿼리 형태에 따라 달라짐
    // 현재는 as를 정해줬기 때문에 다음과 같은 형태
    // (만약 없다면 addPosts)
      await user.removeFollowings([parseInt(req.params.id, 10)]);
      res.send('success');
    } else { 
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 프로필 페이지 닉네임 수정
router.post('/profile', async (req, res, next) => {
  // id가 현재 로그인한 사람의 닉네임을 바꾸기
  try {
  await User.update({ nick: req.body.nick },
    { 
      where: {
        id: req.user.id
      }
    })
    res.redirect('/profile');
  }
  catch (error) {
    console.error(error)
    next(error);
  }
})

module.exports = router;