$(document).ready(function() {
  let socket = io.connect();
  let from = $.cookie("user");
  let to = "all";
  let shiftKey = false;

  socket.emit("online", { user: from });
  socket.on("online", function(data) {
    let sys;
    if (data.user != from) {
      sys = `<div class="system">系统提示( ${now()} ) : 用户 ${
        data.user
      } 上线了</div>`;
    } else {
      sys = `<div class="system">系统提示( ${now()} ) : 你进入了聊天室！</div>`;
    }
    $("#contents").append(sys);
    flushUsers(data.users);
    showSay();
  });

  socket.on("say", function(data) {
    console.log(data);
    let str = data.from.slice(0, 1).toUpperCase();
    $("#contents").append(`
      <div>
        <div class="flex">
          <div class="portrait">${str}</div>
          <div>
            <div class="author">${data.from}</div>
            <div class="time"> ${now()} </div>
          </div>
        </div>
        <div class="msg">${data.msg}</div>
      </div>
    `);
    scrollDown();
  });

  socket.on("offline", function(data) {
    let sys = `<div class="system">系统提示( ${now()} ) : 用户 ${
      data.user
    } 退出房间</div>`;
    $("#contents").append(sys);
    flushUsers(data.users);
    if (data.user == to) {
      to = "all";
    }
    showSay();
  });

  socket.on("disconnect", function() {
    let sys = '<div class="system">系统提示:连接服务器失败！</div>';
    $("#contents").append(sys);
    $("#list").empty();
    scrollDown();
  });

  //重新启动服务器
  socket.on("reconnect", function() {
    var sys = '<div class="system">系统提示:重新连接服务器！</div>';
    $("#contents").append(sys);
    socket.emit("online", { user: from });
    scrollDown();
  });

  function flushUsers(users) {
    $("#list")
      .empty()
      .append(
        '<li title ="双击聊天" alt="all" class = "sayingto" onselectstart ="return false">所有人</li>'
      );
    for (let i in users) {
      $("#list").append(
        `<li alt = "${users[i]}" title="双击聊天" onselectstart="return false">${users[i]}</li>`
      );
    }

    $("#list > li").dblclick(function() {
      if ($(this).attr("alt") != from) {
        to = $(this).attr("alt");
        $("#list > li").removeClass("sayingto");
        $(this).addClass("sayingto");
        showSay();
      } else {
        alert("不可以选择自己对话");
      }
    });
  }

  function showSay() {
    $("#from").html(from);
    $("#to").html(to == "all" ? "所有人" : to);
    scrollDown();
  }

  function now() {
    let date = new Date();
    let year = date.getFullYear(),
      month = (date.getMonth() + 1 + "").padStart(2, "0"),
      day = date.getDate(),
      hour = (date.getHours() + "").padStart(2, "0"),
      minute = (date.getMinutes() + "").padStart(2, "0"),
      second = (date.getSeconds() + "").padStart(2, "0");
    let time = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    return time;
  }

  $(document).keyup(function(e) {
    if (e.keyCode == 16) {
      shiftKey = false;
    }
    if (e.keyCode == 13 && !shiftKey) {
      chat();
    }
  });

  $(document).keydown(function(e) {
    if (e.keyCode == 16) {
      shiftKey = true;
    }
  });

  $("#say").click(function() {
    chat();
  });

  function chat() {
    let input = $("#input_content");
    let msg = input.html().replace("<div><br></div>", "");
    let str = from.slice(0, 1).toUpperCase();
    let el = $("#contents");
    if (msg == "") return;
    el.append(`
      <div class="self">
        <div class="flex">
    		  <div class="portrait">${str}</div>
          <div>
            <div class="author">${from}</div>
            <div class="time"> ${now()} </div>
          </div>
        </div>
        <div class="msg">${msg}</div>
    	</div>
    `);
    socket.emit("say", { from, to, msg });
    input.html("").focus();
    scrollDown();
  }

  function scrollDown() {
    let el = $("#contents");
    el.scrollTop(el[0].scrollHeight);
  }
});
