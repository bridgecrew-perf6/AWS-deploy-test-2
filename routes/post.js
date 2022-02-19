const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  // 저장할 위치: uploads
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
  // 확장자 추출
      const ext = path.extname(file.originalname);
  // 파일 이름 중복 방지하기 위해 Date.now() 추가하여 이름 저장
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  // 파일용량: 5MB, 1024x1024사이즈
  limits: { fileSize: 5 * 1024 * 1024 },
});
   
// 웹: <input id="img" type="file" accept="image/*"
// 서버: upload.single('img')
// 웹 id="img" 와 upload.single('img')에서 'img 값이 같아야함
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  // 업로드한 결과물: req.file
  // console.log(req.file);
  // 미리보기 및 게시글 등록시 한번에 업로드하기 위해 파일 경로 url 보내줌
  res.json({ url: `/img/${req.file.filename}` });
});

// 게시글 업로드
// form 데이터 보낼 시 name에 들어간 이름으로 데이터를 body에 넣어 보내줌 (main.html 참조)
// <textarea id="twit" name="content" maxlength="140"></textarea>
//  <input id="img-url" type="hidden" name="url"></input> 
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    // body에 있는 것만
    // console.log(req.body)
    // console.log(req.user)
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    // 해시태그
    // ^: 부정, \s: 띄워쓰기, g: 모두
    // [^\s#] -> 띄워쓰기와 #이 아닌 것들 모두 골라서 배열로 들어감 
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    // console.log(hashtags)
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map(tag => {
    // [#노드, #익스프레스]
    // tag.slice(1).toLowerCase() => [노드, 익스프레스]
    // [findOrCreate(노드], findOrCreate(익스프레스)]
    // 노드, 익스프레스라는 해쉬태그 있으면 조회를 하고 없으면 생성한다.(중복 저장 방지)
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          })
        }),
      ); 
      // console.log(result); // [[해시태그, false],[해시태그,true]]
      // 기존에 있을 경우는 false, 새로 생성했을 시 true 형태로 출력
      // 배열 형태로 들어감
      await post.addHashtags(result.map(r => r[0]));
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/:id/like', async (req, res, next) => {
  try {
    console.log(req.params.id)
    const post = await Post.findOne({ where: { id: req.params.id }})
    await post.addLiker(req.user.id);
    res.send('OK')
    }
    catch (error) {
      console.error(error);
      next(error);
    }
});

router.delete('/:id/unlike', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id }})
    await post.removeLiker(req.user.id);
    res.send('OK')
    }
    catch (error) {
      console.error(error);
      next(error);
    }
});

module.exports = router;