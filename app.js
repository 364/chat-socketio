let express = require("express");
let app = express();
let http = require("http");
let server = http.createServer(app);
let io = require("socket.io").listen(server);
let bodyParser = require("body-parser");
let cookieParser = require("cookie-parser");
let path = require("path");
let port = 3000;
let users = {};
let map = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));

io.sockets.on("connection", function(socket) {
  // 进入房间
  socket.on("online", function(data) {
    socket.name = data.user;
    if (users[data.user] == null) {
      users[data.user] = data.user;
      map[data.user] = socket.id;
    }
    io.sockets.emit("online", { users, user: data.user });
  });
  // 聊天
  socket.on("say", function(data) {
    // console.log(data);
    if (data.to == "all") {
      // 广播
      socket.broadcast.emit("say", data);
    } else {
      let id = map[data.to];
      if (id) {
        // 对应的客户端
        let client = io.sockets.connected[id];
        client.emit("say", data);
      } else {
        console.log("用户已下线");
      }
    }
  });
  // 离开房间
  socket.on("disconnect", function() {
    if (users[socket.name]) {
      delete users[socket.name];
      delete map[socket.name];
    }
    socket.broadcast.emit("offline", { users, user: socket.name });
  });
});

app.get("/", function(req, res) {
  if (!req.cookies.user) {
    res.redirect("/signin");
  } else {
    res.sendfile(__dirname + "/views/index.html");
  }
});

app.get("/signin", function(req, res) {
  if (!req.cookies.user) {
    res.sendfile(__dirname + "/views/signin.html");
  } else {
    res.redirect("/");
  }
});

app.post("/signin", function(req, res) {
  if (users[req.body.name]) {
    // 用户名存在
    res.json({ state: false, msg: "用户名已存在" });
    res.end();
  } else {
    res.cookie("user", req.body.name, { maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.json({ state: true });
    res.end();
  }
});

// 启动服务
server.listen(port, function() {
  console.log("server starting on port " + port);
});
