const express = require('express')
const moment = require('moment')
const cookieParser = require('cookie-parser')

const app = express()

const port = 3001

const users = [{
  id: 42,
  name: 'damiao',
  password: '123456',

}, {
  id: 41,
  name: 'a',
  password: 'a',

}]

const comments = []

const posts = [{
  id: 1,
  owner: 42,
  title: 'hello',
  content: 'world',
  timestamp: Date.now()
}, {
  id: 2,
  owner: 41,
  title: 'the quick',
  content: 'brown fox jumps over the lazy dog',
  timestamp: Date.now()
}, {
  id: 3,
  owner: 41,
  title: 'lorem',
  content: 'ipsum',
  timestamp: Date.now()
}]

app.locals.pretty = true

app.set('view engine', 'pug')//设置使用的模板引擎
app.set('views', __dirname + '/templates')//设置模板文件的文件夹

app.use(express.json())//express自动解析请求体
app.use(express.urlencoded())
app.use(cookieParser())

app.use((req, res, next) => {
  if (req.cookies.user) {
    req.user = users.find(it => it.name == req.cookies.user)
  }
  next()
})//通过cookies来找到用户

app.get('/', (req, res, next) => {
  res.render('index', {
    user: req.user,
    posts: posts,
    moment: moment,
  })
})//首页



app.get('/post/:id', (req, res, next) => {
  var post = posts.find(it => it.id == req.params.id)
  res.render('post', {
    post: post,
    user: req.user,
  })
})//根据id返回每个用户的页面


app.route('/add-thread')
  .get((req, res, next) => {
    res.render('add-thread.pug', {
      user: req.user,
    })
  })
  .post((req, res, next) => {
    if (req.user) {//有用户登录才可以发
      var thread = req.body
      var lastThread = posts[posts.length - 1]
      thread.timestamp = Date.now()
      thread.owner = req.user.id
      thread.id = lastThread.id + 1
      posts.push(thread)

      res.redirect('/post/' + thread.id)
    } else {
      res.send('未登录')
    }
  })//发布帖子

app.route('/register')
  .get((req, res, next) => {
    res.render('register.pug')
  })
  .post((req, res, next) => {
    if (users.find(it => it.name == req.body.name) == null) {
      var lastUser = users[users.length - 1]
      req.body.id = lastUser.id + 1
      users.push(req.body)
      res.cookie('user', req.body.name, {

      })
      res.render('register-result.pug', {
        user: req.body,
        status: 'SUCCESS'
      })
    } else {
      res.render('register-result.pug', {
        
        status: 'USERNAME_USED'
      })
    }

  })//注册页面



app.route('/login')
  .get((req, res, next) => {
    res.render('login')

  })
  .post((req, res, next) => {
    var user = users.find(it => it.name == req.body.name)
    if (user) {
      if (user.password == req.body.password) {
        res.cookie('user', user.name, {
          expires: new Date(Date.now() + 86400000),

        })
        res.redirect('/')//登录成功页面跳转到首页
      } else {
        res.send('密码错误')
      }
    } else {
      res.send('用户不存在')
    }
  })

app.get('/logout', (req, res, next) => {
  res.clearCookie('user')
  res.redirect('/')
})



app.listen(port, () => {
  console.log('server listening on port', port)
})