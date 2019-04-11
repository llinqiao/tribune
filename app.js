const express = require('express')
const moment = require('moment')

const sqlite3 = require('sqlite3').verbose()//引入数据库，verbose函数会返回更多的信息
const cookieParser = require('cookie-parser')

const app = express()

const port = 3001

console.log('opening detabase...')
const db = new sqlite3.Database(__dirname + '/tribune.sqlite3', () => {
  console.log('detabase open success')
  console.log('starting web server...')
  app.listen(port, () => {
    console.log('server listening on port', port)

  })
})//连接数据库文件异步打开，等数据库打开在启动服务器，成功打开数据库在回调里面打开服务器



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
app.use(express.urlencoded({
  extended: true //开启解析扩展url编码的功能:foo[bar]=a&foo[baz]=b
}))
app.use(cookieParser())

app.use((req, res, next) => {
  if (req.cookies.loginUser) {
    req.user = db.get('SELECT * FROM users WHERE name=" ' + req.cookies.loginUser + '"', (err, user) => {
      if (err) {
        next(err)
      } else {
        req.user = user
        next()
      }
    })
  } else {
    next()
  }

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
  res.render('post.pug', {
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
    db.run('INSERT INTO users (name,password) VALUES (?,?)', req.body.name, req.body.password, (err) => {
      if (err) {
        res.render('register-result.pug', {
          status: 'USERNAME_USED'
        })
      } else {
        res.cookie('loginUser', req.body.name, {

        })
        res.render('register-result.pug', {
          user: req.body,
          status: 'SUCCESS'
        })
      }
    })
  })//注册页面数据库版本



// if (users.find(it => it.name == req.body.name) == null) {
//   var lastUser = users[users.length - 1]
//   req.body.id = lastUser.id + 1
//   users.push(req.body)
//   res.cookie('user', req.body.name, {

//   })
//   res.render('register-result.pug', {
//     user: req.body,
//     status: 'SUCCESS'
//   })
// } else {
//   res.render('register-result.pug', {

//     status: 'USERNAME_USED'
//   })
// }

//注册页面,数组版



app.route('/login')
  .get((req, res, next) => {
    res.render('login')

  })
  .post((req, res, next) => {
    db.get('SELECT * FROM users WHERE name = ?AND password=?', req.body.name, req.body.password, (err, user) => {
      if (err) {
        next(err)
      } else {
        if (user) {
          res.cookie('loginUser', user.name, {
            expires: new Date(Date.now() + 86400000),

          })
          res.redirect('/')//登录成功页面跳转到首页
        } else {
          res.send('用户名或密码错误！')
        }
      }
    })
  })

//   var user = users.find(it => it.name == req.body.name)
//   if (user) {
//     if (user.password == req.body.password) {
//       res.cookie('user', user.name, {
//         expires: new Date(Date.now() + 86400000),

//       })
//       res.redirect('/')//登录成功页面跳转到首页
//     } else {
//       res.send('密码错误')
//     }
//   } else {
//     res.send('用户不存在')
//   }
// })

app.get('/logout', (req, res, next) => {
  res.clearCookie('loginUser')
  res.redirect('/')
})



