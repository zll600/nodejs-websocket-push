README
======

This README describes the simplest node.js based websocket server push.

# STEP 1: A Simple REST Server

* npm install express
* create a server.js

```
var express = require('express');
var app = express();
var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("REST API listening on http://%s:%s", host, port)
});

app.get('/', function (req, res) {
  console.log('REST Server received GET')
  res.sendStatus(200);
})
```

* node server
* In a browser load the URL http://localhost:8000/ in the server console we should see "REST Server received GET" and browser should show "ok"

# STEP 2: Add WebSocket to server, and add a HTML/Javascript client

* npm install ws
* make three lines of change to server.js (basically in line 2 & 3 we start a WebSocket server on port 9000, and towards the end, whenever the REST API on port 8000 gets a hit, we broadcast to all WebSocket clients which is on port 9000)

```
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
```

* create a new client.html

```
<script type="text/javascript">
    var myWebSocket = new WebSocket("ws://localhost:9000");
    myWebSocket.onmessage = function(evt) {
        alert(JSON.stringify(evt.data))
    };
</script>
```

* open multiple instances of client.html in your browser (Chrome & Firefox supports WebSocket). In the previous browser in Step 1 which loads http://localhost:8000/ if you hit refresh, then these multiple instances of client.html should all popup 'Broadcast to client: REST Server received GET'

# STEP 3: Add a Java Client

* add three files

- `pom.xml`
- `src/main/java/com/learn/websocket/App.java`
- `src/main/java/com/learn/websocket/WebsocketClientEndpoint.java`

* mvn clean package
* java -jar target/app.jar

Then same as before,  in the previous browser in Step 1 which loads http://localhost:8000/ if you hit refresh, this Java program should sysout 'Broadcast to client: REST Server received GET' together with the browsers in Step 2 (if you still have them open)
