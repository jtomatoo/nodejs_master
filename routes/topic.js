const express = require('express');
const router = express.Router();

var template = require('../lib/template.js');
var auth = require('../lib/auth.js');
var db = require('../lib/db');
var shortid = require('shortid');

var fs = require('fs');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

router.get('/create', (request, response) => {
  if(!auth.isOnwer(request, response)) {
    response.redirect('/');
    return false;
  }

  var title = 'WEB - create';
  var list = template.list(request.list);
  var html = template.HTML(title, list, `
      <form action="/topic/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
          <textarea name="description" placeholder="description"></textarea>
      </p>
      <p>
          <input type="submit">
      </p>
      </form>
  `, '', auth.statusUI(request, response));
  response.send(html);
});
  
router.post('/create_process', (request, response) => {
  if(!auth.isOnwer(request, response)) {
    response.redirect('/');
    return false;
  }

  var post = request.body;
  var title = post.title;
  var description = post.description;
  // fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
  //   response.redirect(`/topic/${title}`);
  // });
  var id = shortid.generate();
  db.get('topics').push({
    id:id,
    title:title,
    description:description,
    user_id:request.user.id
  }).write();

  response.redirect(`/topic/${id}`);

  /*
  var body = '';
  request.on('data', function(data) {
    body = body + data;
  });
  request.on('end', function() {
    var post = qs.parse(body);
    var title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
      response.writeHead(302, {Location: `/?id=${title}`});
      response.end();
    });
  });
  */
});
  
router.get('/update/:pageId', (request, response) => {
  if(!auth.isOnwer(request, response)) {
    response.redirect('/');
    return false;
  }

  var topic = db.get('topics').find({id:request.params.pageId}).value();
  if(topic.user_id !== request.user.id) {
    request.flash('error', 'Not yours');
    return response.redirect('/');
  }

  var title = topic.title;
  var description = topic.description;
  var list = template.list(request.list);
  var html = template.HTML(title, list
    , `<form action="/topic/update_process" method="post">
        <input type="hidden" name="id" value="${topic.id}">
        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
        <p>
          <textarea name="description" placeholder="description">${description}</textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>`
    , `<a href="/topic/create">create</a> <a href="/update?id=${topic.id}">update</a>`
    , auth.statusUI(request, response)
  );
  response.send(html);

  // var filteredId = path.parse(request.params.pageId).base;
  // fs.readFile(`data/${filteredId}`, 'utf8', function(err, description) {
  //   var title = request.params.pageId;
  //   var list = template.list(request.list);
  //   var html = template.HTML(title
  //     , list
  //     , `<form action="/topic/update_process" method="post">
  //         <input type="hidden" name="id" value="${title}">
  //         <p><input type="text" name="title" placeholder="title" value="${title}"></p>
  //         <p>
  //           <textarea name="description" placeholder="description">${description}</textarea>
  //         </p>
  //         <p>
  //           <input type="submit">
  //         </p>
  //       </form>`
  //     , `<a href="/topic/create">create</a> <a href="/update?id=${title}">update</a>`
  //     , auth.statusUI(request, response)
  //   );
  //   response.send(html);
  // });
});
  
router.post('/update_process', (request, response) => {
  if(!auth.isOnwer(request, response)) {
    response.redirect('/');
    return false;
  }

  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  var topic = db.get('topics').find({id:id}).value();

  if(topic.user_id !== request.user.id) {
    request.flash('error', 'Not yours');
    return response.redirect('/');
  }

  db.get('topics').find({id:id}).assign({
    title:title,
    description:description
  }).write();

  response.redirect(`/topic/${topic.id}`);

  // fs.rename(`data/${id}`, `data/${title}`, function(error) {
  //   fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
  //     response.redirect(`/topic/${title}`);
  //   });
  // });
  /*
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
      fs.writeFile(`data/${title}`, description, 'utf8', function(err) {
        response.redirect(`/?id=${title}`);
      });
    });
  });
  */
});
  
router.post('/delete_process', (request, response) => {
  if(!auth.isOnwer(request, response)) {
    response.redirect('/');
    return false;
  }

  var post = request.body;
  var id = post.id;
  var topic = db.get('topics').find({id:id}).value();
  if(topic.user_id !== request.user.id) {
    request.flash('error', 'Not yours');
    return response.redirect('/');
  }
   
  db.get('topics').remove({id:id}).write();
  response.redirect('/');

  // var filteredId = path.parse(id).base;
  // fs.unlink(`data/${filteredId}`, function(error) {
  //   response.redirect('/');
  // });
  /*
  var body = '';
  request.on('data', function(data) {
    body = body + data;
  });
  request.on('end', function() {
    var post = qs.parse(body);
    var id = post.id;
    var filteredId = path.parse(id).base;
    fs.unlink(`data/${filteredId}`, function(error) {
      response.redirect('/');
    });
  });
  */
});
  
router.get('/:pageId', (request, response, next) => {
  var topic = db.get('topics').find({id:request.params.pageId}).value();
  var user = db.get('users').find({id:topic.user_id}).value();

  if(!topic || !user) {
    response.send('not corrected info');
  } else {
    var sanitizedTitle = sanitizeHtml(topic.title);
    var sanitizedDescription = sanitizeHtml(topic.description, {
      allowedTags:['h1']
    });
    var list = template.list(request.list);
    var html = template.HTML(sanitizedTitle
      , list
      , `
        <h2>${sanitizedTitle}</h2>
        ${sanitizedDescription}
        <p>${user.displayName}</p>
        `
      , `<a href="/topic/create">create</a>
          <a href="/topic/update/${topic.id}">update</a>
          <form action="/topic/delete_process" method="post">
            <input type="hidden" name="id" value="${topic.id}">
            <input type="submit" value="delete">
          </form>`
      , auth.statusUI(request, response)
    );

    response.send(html);
  }
  // var filteredId = path.parse(request.params.pageId).base;
  // fs.readFile(`data/${filteredId}`, 'utf8', function(err, description) {
  //   if(err) {
  //     next(err);
  //   } else {
  //     var title = request.params.pageId;
  //     var sanitizedTitle = sanitizeHtml(title);
  //     var sanitizedDescription = sanitizeHtml(description, {
  //       allowedTags:['h1']
  //     });
  //     var list = template.list(request.list);
  //     var html = template.HTML(sanitizedTitle
  //       , list
  //       , `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`
  //       , `<a href="/topic/create">create</a>
  //           <a href="/topic/update/${sanitizedTitle}">update</a>
  //           <form action="/topic/delete_process" method="post">
  //             <input type="hidden" name="id" value="${sanitizedTitle}">
  //             <input type="submit" value="delete">
  //           </form>`
  //       , auth.statusUI(request, response)
  //     );

  //     response.send(html);
  //   }
  // });
});

  module.exports = router;