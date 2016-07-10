var express = require('express');
var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({ port: 9000 });

var app = express();
var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("REST API listening on http://%s:%s", host, port)
});

app.get('/', function (req, res) {
  console.log('REST Server received GET')
  wss.clients.forEach(function each(client) {
      client.send("Broadcast to client: REST Server received GET");
    });
  res.sendStatus(200);
})
