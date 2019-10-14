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

const layout_meta={  1: { c:12, d:3 },
                     2: { c:6, d:4 },
                     3: { c:4, d:4 },
                     4: { c:3, d:4 },
                     6: { c:2, d:5 }
                  }


var timerValue=""
var timerEvent=null
var config=[]
var meta={}
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
    "box-create"   :  containerCreate,
    "box-started"  :  containerStarted,
    "box-died"     :  containerDied,
    "info"         :  serverInfo

}

function handleMessage(evt,msg) {

  if(msg==null) {
    console.log("empty comms message ")
    return
  }

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

  var template=$("#info-template p").clone()
  template.text(JSON.stringify(msg))
  $("#info").prepend(template)
}

function serverIsDead(msg) {
  console.log(msg.data.msg)
  alert(msg.data.msg)
}

function serverIsOpen(msg) {

  config=msg.data.instances
  meta=msg.data.display
  if (meta==null) {
    meta=[]
  }

  if(meta.columns==null) {

    switch (config.length) {
      case  0:
      case  1: meta.columns=1; break
      case  2: meta.columns=2; break
      case  3: meta.columns=3; break
      case  4: meta.columns=4; break
      case  5:
      case  6: meta.columns=3; break
      default: meta.columns=6; break
    }
  }
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
  $( "#info" ).empty()

  var columns=meta.columns
  var column_class="col-sm-"+layout_meta[columns].c
  var column_display="display-"+layout_meta[columns].d

  for(var i=0;i<config.length;i++) {
    var q=config[i]
    var fid="port-"+i

    var template=$("#container-template .card").clone()
    template.attr("id","container-"+i);
    template.addClass(column_class);

      $( "#scores").append(template)
      $( "#container-"+i+" iframe").attr("id",fid)
      $( "#container-"+i+" .card-header").addClass(column_display)
      $( "#container-"+i+" .card-header").text(config[i].title)
      $( "#container-"+i+" .card-footer").addClass(column_display)
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

  $( "#ready_button" ).attr("disabled", false);


}
function initTimer(element,startTime) {

  return setInterval(function() {
      var elapsedTime = Date.now() - startTime;
      timerValue=(elapsedTime / 1000).toFixed(2);
      element.text(timerValue)
  }, 100);

}
function enableDemo() {

  $( '#iframe' ).attr( 'src', function ( i, val ) { return val; });
  $( "#ready_button" ).attr("disabled", false);

}

function containerCreate(msg) {

var c_id=msg.target
console.log("container created via event "+c_id,msg.data)
}

function containerCreated(msg) {
  var box=msg.target
  $("#timer-"+box).text("-.-"); // clear the onscreen timer
}


function containerDied(msg) {
  var  box=msg.target
  console.log("box "+box+" died")
  clearInterval(config[box].timer)
  $("#timer-"+box).text("terminated")

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
