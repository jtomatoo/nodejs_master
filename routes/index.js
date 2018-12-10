const express = require('express');
const router = express.Router();

var template = require('../lib/template.js');
var auth = require('../lib/auth.js');

router.use((req, res, next) => {
    // console.log('index Page Time: ', Date.now());
    next();
});

router.get('/', (request, response) => {
    var fsmg = request.flash();
    var feedback = '';
    if(!fsmg && fsmg.success) {
      feedback = fmsg.success[0];
    }
    console.log('/', request.user);
    var title = 'Welcome';
    var description = 'Hello, Node.js';
    var list = template.list(request.list);
    var html = template.HTML(title
        , list
        , `
        <div style="color:blue;">${feedback}</div>
        <h2>${title}</h2>${description}
        <img src="/images/hello.jpg" style="width:300px; display:block; margin-top:10px;">`
        , `<a href="/topic/create">create</a>`
        , auth.statusUI(request, response)
    );

    response.send(html);
});

module.exports = router;