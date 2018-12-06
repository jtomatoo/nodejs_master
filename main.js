
const express = require('express');
const app = express();
const router = express.Router();

var fs = require('fs');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var qs = require('querystring');
var bodyParser = require('body-parser');
var helmet = require('helmet');

var topicRouter = require('./routes/topic.js');
var indexRouter = require('./routes/index.js');

var session = require('express-session');
var FileStore = require('session-file-store')(session);

var flash = require('connect-flash');

app.use(session({
  secret: 'keyboard cat'
  , resave: false
  , saveUninitialized: true
  , cookie:{secure:false}
  , store: new FileStore()
}));

app.use(flash());

var passport = require('./lib/passport.js')(app);
var authRouter = require('./routes/auth.js')(passport);
/*
app.get('/flash', function(req, res){
  // Set a flash message by passing the key, followed by the value, to req.flash().
  req.flash('msg', 'Flash is back!!')
  // res.redirect('/');
  res.send('flash');
});

app.get('/flash-display', function(req, res){
  // Get an array of flash messages by passing the key to req.flash()
  // res.render('index', { messages: req.flash('info') });
  var fmsg = req.flash();
  console.log(fmsg);
  res.send(fmsg);
});
*/

var db = require('./lib/db');

app.use(helmet());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
// app.use(compression());


app.get('*', (request, response, next) => {
  request.list = db.get('topics').value();
  next();
  // fs.readdir('./data', function(error, filelist) {
  //   request.list = filelist;
  //   next();
  // });
});

app.use('/', indexRouter);
app.use('/topic', topicRouter);
app.use('/auth', authRouter);

app.use((req, res, next) => {
  res.status(404).send('Sorry can\'t find that!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(3000, () => console.log('Example app lisening on port 3000!'));


/*
var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var cookie = require('cookie');

function authIsOwner(request, response) {
  var isOwner = false;
  var cookies = {};
  if(request.headers.cookie) {
    cookies= cookie.parse(request.headers.cookie);
  }
  if(cookies.email === 'test@test.com' && cookies.password === '1234') {
    isOwner = true;
  }

  return isOwner;
}

function authStatusUI(request, response) {
  var authStatusUI = '<a href="/login">login</a>'
  if(authIsOwner(request, response)) {
    authStatusUI = '<a href="/logout_process">logout</a>'
  }

  return authStatusUI;
}

var app = http.createServer(function(request,response){
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;

  if(pathname === '/') {
    if(queryData.id === undefined){
      fs.readdir('./data', function(error, filelist){
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`,
          authStatusUI(request, response)
        );
        response.writeHead(200);
        response.end(html);
      });
    } else {
      fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description, {
            allowedTags:['h1']
          });
          var list = template.list(filelist);
          var html = template.HTML(sanitizedTitle, list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            ` <a href="/create">create</a>
              <a href="/update?id=${sanitizedTitle}">update</a>
              <form action="delete_process" method="post">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>`
              , authStatusUI(request, response)
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }
  } else if(pathname === '/create'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required!!');
      return false;
    }
    fs.readdir('./data', function(error, filelist){
      var title = 'WEB - create';
      var list = template.list(filelist);
      var html = template.HTML(title, list, `
        <form action="/create_process" method="post">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
      `, '', authStatusUI(request, response));
      response.writeHead(200);
      response.end(html);
    });
  } else if(pathname === '/create_process'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required!!');
      return false;
    }
    var body = '';
    request.on('data', function(data) {
        body = body + data;
    });
    request.on('end', function(){
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function(err){
        response.writeHead(302, {Location: `/?id=${title}`});
        response.end();
      });
    });
  } else if(pathname === '/update'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required!!');
      return false;
    }
    fs.readdir('./data', function(error, filelist){
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `
          <form action="/update_process" method="post">
            <input type="hidden" name="id" value="${title}">
            <p><input type="text" name="title" placeholder="title" value="${title}"></p>
            <p>
              <textarea name="description" placeholder="description">${description}</textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
          , authStatusUI(request, response)
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if(pathname === '/update_process'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required!!');
      return false;
    }
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        fs.rename(`data/${id}`, `data/${title}`, function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
        });
    });
  } else if(pathname === '/delete_process'){
    if(authIsOwner(request, response) === false) {
      response.end('Login required!!');
      return false;
    }
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        var filteredId = path.parse(id).base;
        fs.unlink(`data/${filteredId}`, function(error){
          response.writeHead(302, {Location: `/`});
          response.end();
        })
    });
  } else if(pathname === '/login') {
      fs.readdir('./data', function(error, filelist) {
        var title = 'Login';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `<form action="login_process" method="post">
            <p><input type="text" name="email" placeholoder="email"></p>
            <p><input type="password" name="password" placeholoder="password"></p>
            <p><input type="submit"></p>
          </form>`,
          `<a href="/create">create</a>`
          , authStatusUI(request, response)
        );
        response.writeHead(200);
        response.end(html);
      });
  } else if(pathname === '/login_process') {
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function() {
      var post = qs.parse(body);
      if(post.email ==='test@test.com' && post.password === '1234') {
        response.writeHead(302, {
          'Set-Cookie': [
            `email=${post.email}`
            , `password=${post.password}`
            , 'nickname=egoing'
          ]
          , Location: `/`});
        response.end();
      } else {
        response.end('Who?');
      }
    });
  } else if(pathname === '/logout_process') {
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function() {
      var post = qs.parse(body);
      response.writeHead(302, {
        'Set-Cookie': [
          'email=; Max-Age=0'
          , 'password=;  Max-Age=0'
          , 'nickname=;  Max-Age=0'
        ]
        , Location: `/`});
      response.end();
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});

app.listen(3000);
*/