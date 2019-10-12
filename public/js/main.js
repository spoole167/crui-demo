"use strict";
// set page ready
// set button to "Get Set"
// press button
// disable button
// tell server to get ready
// server cleans up old containers..
// server sends ready
// start polling of addreses ...
// tell server to create containers ...
// server creates containers
// server sends set
// set button to "Launch"
// set button to enable
// press button
// disable button
// tell server to start all containers ...
// server sends started
// set button to Launched
//

var timerValue=""
var timerEvent=null
var config=[]
var title

var eventHandlers = {

    "open"         :  serverIsOpen ,
    "ready"        :  serverIsReady,
    "set"          :  serverIsSet,
    "go"           :  serverIsGo,
    "error"        :  serverIsError,
    "fatal"        :  serverIsDead,
    "box-starting" :  containerStarting,
    "box-created"  :  containerCreated,
    "box-started"  :  containerStarted,
    "info"         :  serverInfo

}

function handleMessage(evt,msg) {

  if(msg==null) {
    console.log("empty comms message ")
    return
  }
  console.log("msg")
  console.log(msg)

  var type=msg.type
  var handler=eventHandlers[type]
  if(handler!=null) {
    console.log(type)
    handler(msg);
  } else {
     console.log("comms msg type "+type+" not recognised");
  }

}




$( document ).ready(function() {

  commsInit(
    {
      open: enableDemo,
      get:  handleMessage,
      close: demoEnd
  })

  //$('#setupmodal').modal('show')

  $( "#ready_button" ).click(function() {
        $( "#ready_button" ).attr("disabled", true);
        cleanUI()
        sendServerMsg("ready")
  });
  $( "#set_button" ).click(function() {
        $( "#set_button" ).attr("disabled", true);
        sendServerMsg("set")
  });
  $( "#go_button" ).click(function() {
        $( "#go_button" ).attr("disabled", true);
        sendServerMsg("go")
  });



});


function demoEnd() {
console.log("demo ends")
}

function serverInfo(msg) {
  console.log(msg.data.msg)
}

function serverIsDead(msg) {
  console.log(msg.data.msg)
  alert(msg.data.msg)
}

function serverIsOpen(msg) {

  config=msg.data.instances
  title=msg.data.title

  cleanUI()


}

function setTimers(value) {
    $(".timer-display").text(value)
}

function cleanUI() {

  $("#title").text(title)
  $("title").text(title)

  $( "#scores" ).empty()
  for(var i=0;i<config.length;i++) {
    var q=config[i]
    var fid="port-"+i

    var template=$("#container-template .card").clone()
    template.attr("id","container-"+i);
      $( "#scores").append(template)
      $( "#container-"+i+" iframe").attr("id",fid)
      $( "#container-"+i+" .card-header").text(config[i].title)
      $( "#container-"+i+" .card-footer").attr("id","timer-"+i)
  }
}

function serverIsError(msg) {
    console.log(msg)
}

function serverIsReady(msg) {
    $( "#set_button" ).attr("disabled", false);
    setTimers("")
}

function serverIsSet(msg) {
  client_state.ports=msg.ports
  $( "#go_button" ).attr("disabled", false);

}

function serverIsGo(msg) {

  var startTime = Date.now();
  $( "#ready_button" ).attr("disabled", false);



  var te=document.getElementById("timer")


}
function initTimer(element,startTime) {

  return setInterval(function() {
      var elapsedTime = Date.now() - startTime;
      timerValue=(elapsedTime / 1000).toFixed(3);
      element.text(timerValue)
  }, 100);

}
function enableDemo() {
  $( "#ready_button" ).attr("disabled", false);
}

function containerCreated(msg) {
  var box=msg.target
  console.log("container created "+box)
  $("#timer-"+box).text("-.-"); // clear the onscreen timer
}

function containerStarted(msg) {
 // stop the timer and show the page
 var box=msg.target
 var port=msg.data

 console.log("container started "+box)
 var fig=config[box]
 var text=config[box].timerElement.text()
 clearInterval(config[box].timer)
 config[box].timerElement.text(text)
 $("#port-"+box).attr("src","http://localhost:"+port);

}

function containerStarting(msg) {

  var box=msg.target
  var fig=config[box]
  var started=Date.now()

  config[box].timerElement=$("#timer-"+box)
  config[box].timerElement.text("0.0")
  config[box].timer=initTimer(config[box].timerElement,started)

}



function sendServerMsg(type,data) {
  var msg= {
      cmd: type ,
      data: data
  }
  var payload=JSON.stringify(msg)
  console.log("send "+payload)
  websocket.send(payload);

}
