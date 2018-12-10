const express = require('express');
const router = express.Router();

var template = require('../lib/template.js');
var fs = require('fs');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var db = require('../lib/db.js');
var shortid = require('shortid');

var bcrypt = require('bcryptjs');

module.exports = function(passport) {
  router.get('/login', (request, response) => {
    var fsmg = request.flash();
    console.log('flash msg:', fsmg);

    var feedback = '';
    if(fsmg && fsmg.error) {
      feedback = fsmg.error[0];
    }
  
    var title = 'WEB - login';
    var list = template.list(request.list);
    var html = template.HTML(title, list, 
    `
    <div style="color:red;">${feedback}</div>
    <form action="/auth/login_process" method="post">
      <p><input type="text" name="email" placeholder="email"></p>
      <p><input type="password" name="pwd" placeholder="password"></p>
      <p><input type="submit" value="login"></p>
    </form>
    `, '');
  
    response.send(html);
  });
  
  router.post('/login_process', 
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/auth/login',
      failureFlash: true,
      successFlash: true
    })
  );
  
  router.get('/register', (request, response) => {
    var fsmg = request.flash();
    var feedback = '';
    if(!fsmg && fsmg.error) {
      feedback = fmsg.error[0];
    }
  
    var title = 'WEB - login';
    var list = template.list(request.list);
    var html = template.HTML(title, list, 
    `
    <div style="color:red;">${feedback}</div>
    <form action="/auth/register_process" method="post">
      <p><input type="text" name="email" placeholder="email"></p>
      <p><input type="password" name="pwd" placeholder="password"></p>
      <p><input type="password" name="pwd2" placeholder="password"></p>
      <p><input type="text" name="displayName" placeholder="display name"></p>
      <p><input type="submit" value="register"></p>
    </form>
    `, '');
  
    response.send(html);
  });

  router.post('/register_process', (request, response) => {
    var post = request.body;
    var email = post.email;
    var pwd = post.pwd;
    var pwd2 = post.pwd2;
    var displayName = post.displayName;
    if(pwd !== pwd2) {
      request.flash('error', 'Password must be same!');
      response.redirect('/auth/register');
    } else {
      bcrypt.hash(pwd, 10, function(err, hash) {
        var user = db.get('users').find({email:email}).value();
        if(user) {
          user.password = hash;
          user.displayName = displayName;
          db.get('users').find({id:user.id}).assign(user).write();
        } else {
          user = {
            id: shortid.generate(),
            email: email,
            password: hash,
            displayName: displayName
          };
          db.get('users').push(user).write();
        }
        
        request.login(user, function() {
          return response.redirect('/');
        });
      });
    }
  });


  router.get('/logout', function(request, response) {
    request.logout();
    request.session.save(function(err) {
      response.redirect('/');
    });
  });

  router.get('/google', passport.authenticate('google', 
    {scope: ['https://www.googleapis.com/auth/plus.login', 'email']})
  );

  router.get('/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/auth/login'
    }), 
    function(req, res) {
      res.redirect('/');
    }
  );

  router.get('/facebook', passport.authenticate('facebook', {
    scope: 'email'
  }));

  router.get('/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/',
      failureRedirect: '/auth/login'
    }));

  return router;
}


/*
router.post('/login_process', function(request, response) {
  var post = request.body;
  var email = post.email;
  var password = post.pwd;

  if(email === authData.email && password === authData.password) {
    request.session.is_logined = true;
    request.session.nickname = authData.nickname;
    request.session.save(function() {
      response.redirect('/');
    });
  } else {
    response.end('Who?');
  }
});
*/
/*
router.get('/logout', function(request, response) {
  request.session.destroy(function(error) {
    response.redirect('/');
  });
});
*/

// router.get('/create', (request, response) => {
//     var title = 'WEB - create';
//     var list = template.list(request.list);
//     var html = template.HTML(title, list, `
//         <form action="/topic/create_process" method="post">
//         <p><input type="text" name="title" placeholder="title"></p>
//         <p>
//             <textarea name="description" placeholder="description"></textarea>
//         </p>
//         <p>
//             <input type="submit">
//         </p>
//         </form>
//     `, '');
//     response.send(html);
//   });
  
// router.post('/create_process', (request, response) => {
//     var post = request.body;
//     var title = post.title;
//     var description = post.description;
//     fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
//       response.redirect(`/topic/${title}`);
//     });
  
//     /*
//     var body = '';
//     request.on('data', function(data) {
//       body = body + data;
//     });
//     request.on('end', function() {
//       var post = qs.parse(body);
//       var title = post.title;
//       var description = post.description;
//       fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
//         response.writeHead(302, {Location: `/?id=${title}`});
//         response.end();
//       });
//     });
//     */
//   });
  
// router.get('/update/:pageId', (request, response) => {
//     var filteredId = path.parse(request.params.pageId).base;
//     fs.readFile(`data/${filteredId}`, 'utf8', function(err, description) {
//       var title = request.params.pageId;
//       var list = template.list(request.list);
//       var html = template.HTML(title, list,
//         `
//         <form action="/topic/update_process" method="post">
//           <input type="hidden" name="id" value="${title}">
//           <p><input type="text" name="title" placeholder="title" value="${title}"></p>
//           <p>
//             <textarea name="description" placeholder="description">${description}</textarea>
//           </p>
//           <p>
//             <input type="submit">
//           </p>
//         </form>
//         `,
//         `<a href="/topic/create">create</a> <a href="/update?id=${title}">update</a>`
//       );
//       response.send(html);
//     });
//   });
  
// router.post('/update_process', (request, response) => {
//     var post = request.body;
//     var id = post.id;
//     var title = post.title;
//     var description = post.description;
//     fs.rename(`data/${id}`, `data/${title}`, function(error) {
//       fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
//         response.redirect(`/topic/${title}`);
//       });
//     });
//     /*
//     var body = '';
//     request.on('data', function(data){
//         body = body + data;
//     });
//     request.on('end', function(){
//       var post = qs.parse(body);
//       var id = post.id;
//       var title = post.title;
//       var description = post.description;
//       fs.rename(`data/${id}`, `data/${title}`, function(error){
//         fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
//           response.redirect(`/?id=${title}`);
//         });
//       });
//     });
//     */
//   });
  
// router.post('/delete_process', (request, response) => {
//     var post = request.body;
//     var id = post.id;
//     var filteredId = path.parse(id).base;
//     fs.unlink(`data/${filteredId}`, function(error) {
//       response.redirect('/');
//     });
//     /*
//     var body = '';
//     request.on('data', function(data) {
//       body = body + data;
//     });
//     request.on('end', function() {
//       var post = qs.parse(body);
//       var id = post.id;
//       var filteredId = path.parse(id).base;
//       fs.unlink(`data/${filteredId}`, function(error) {
//         response.redirect('/');
//       });
//     });
//     */
//   });
  
// router.get('/:pageId', (request, response, next) => {
//     var filteredId = path.parse(request.params.pageId).base;
//     fs.readFile(`data/${filteredId}`, 'utf8', function(err, description) {
//       if(err) {
//         next(err);
//       } else {
//         var title = request.params.pageId;
//         var sanitizedTitle = sanitizeHtml(title);
//         var sanitizedDescription = sanitizeHtml(description, {
//           allowedTags:['h1']
//         });
//         var list = template.list(request.list);
//         var html = template.HTML(sanitizedTitle, list,
//           `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
//           ` <a href="/topic/create">create</a>
//             <a href="/topic/update/${sanitizedTitle}">update</a>
//             <form action="/topic/delete_process" method="post">
//               <input type="hidden" name="id" value="${sanitizedTitle}">
//               <input type="submit" value="delete">
//             </form>`
//         );
  
//         response.send(html);
//       }
//     });
//   });

// module.exports = router;