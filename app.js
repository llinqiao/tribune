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


app.use(express.json())//express自动解析请求体
app.use(express.urlencoded())
app.use(cookieParser())

app.use((req,res,next) => {
  if(req.cookies.user){
    req.user = users.find(it => it.name ==req.cookies.user)
  }
  next()
})//通过cookies来找到

app.get('/', (req, res, next) => {
  res.send(`
    <!doctype html>
    <header>
      
      ${
        req.user ?
          `<a href ='/add-thread'>发布</a>
          <a href="/logout">退出</a>`
          :
          `<a href="/login">登录</a>
          <a href="/register">注册</a>`
      }
    
      
    </header>
    <ul>
      ${posts.map(post => {
    return `
          <li><a href="/post/${post.id}">${post.title}</a><small>${moment(post.timestamp).fromNow()}</li>
        `
  }).join('')}
    </ul>
  `)
})//首页



app.get('/post/:id', (req, res, next) => {
  var post = posts.find(it => it.id == req.params.id)
  res.send(`
    <div>
      <h1>${post.title}</h1>
      <article>${post.content}</article>
  `)
})//根据id返回每个用户的页面


app.route('/add-thread')
  .get((req,res,next)=> {
    res.send(`
      <form action= "/add-thread" method = "post">
        <input type ="text" name ="title"/>
        <textarea name ="content"></textarea> 
        <button>发布帖子</button>
      </form>
    `)
  })
  .post((req,res,next)=>{
    if(req.user){//有用户登录才可以发
      var thread = req.body
      var lastThread = posts[posts.length - 1]
      thread.timestamp = Date.now()
      thread.owner = req.user.id
      thread.id = lastThread.id + 1
      posts.push(thread)

      res.redirect('/post/' + thread.id)
    }else{
      res.send('未登录')
    }
  })//发布帖子

app.route('/register')
  .get((req, res, next) => {
    res.send(`
      <form action ="/register" method ="post">
        <input type = "text" name = "name" />
        <input type = "password" name = "password"/>
        <button>注册</button>
      </form>
    `)
  })
  .post((req, res, next) => {
    if (users.find(it => it.name == req.body.name) == null) {
      var lastUser = users[users.length - 1]
      req.body.id = lastUser.id + 1
      users.push(req.body)

      res.send('注册成功')
    } else {
      res.send('用户名已被占用')
    }

  })//注册页面



  app.route('/login')
  .get((req, res, next) => {
    res.send(`
      <form action ="/login" method ="post">
        <input type = "text" name = "name"/>
        <input type = "password" name = "password"/>
        <button>登录</button>
      </form>
    `)
  })
  .post((req, res, next) => {
    var user = users.find(it => it.name == req.body.name)
    if(user){
      if(user.password == req.body.password){
        res.cookie('user',user.name,{
          expires:new Date(Date.now()+86400000)
        })
        res.redirect('/')//登录成功页面跳转到首页
      }else{
        res.send('密码错误')
      }
    }else{
      res.send('用户不存在')
    }
  })

  app.get('/logout',(req,res,next) =>{
    res.clearCookie('user')
    res.redirect('/')
  })



app.listen(port, () => {
  console.log('server listening on port', port)
})