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
var timerEvent

function handleMessage(evt,msg) {

  if(msg==null) {
    console.log("empty comms message ")
    return
  }
  var type=msg.type

  switch(type) {
    case "open"  :  serverIsOpen(msg);  break;
    case "ready" :  serverIsReady(msg); break;
    case "set"   :  serverIsSet(msg); break;
    case "go"    :  serverIsGo(msg); break;
    case "error" :  serverIsError(msg); break;
    case "box"   :  containerUpdated(msg); break;
    case "info"  :  serverInfo(msg); break;
    default:  console.log("comms msg type "+type+" not recognised"); break;
  }

}

var config=[]

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

function serverIsOpen(msg) {

  config=msg.data

  cleanUI()


}

function setTimers(value) {
    $(".timer-display").text(value)
}

function cleanUI() {
  $( "#scores" ).empty()
  for(var i=0;i<config.length;i++) {
    var q=config[i]
    var fid="port-"+q.expose

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

function containerUpdated(msg) {

  var state=msg.data.state
  var box=msg.data.box
  var fig=config[box]

  console.log("box "+box+" state ="+state);

  switch(state) {
  case  "created"  :  $("#timer-"+box).text("-.-"); break; // clear the onscreen timer
  case  "starting" :  // time is now
                      var started=Date.now()
                      config[box].timerElement=$("#timer-"+box)
                      config[box].timerElement.text("0.0")

                      config[box].timer=initTimer(config[box].timerElement,started)
                      break; // start the timer
  case  "started"  :  // stop the timer and show the page
                    var text=config[box].timerElement.text()
                    clearInterval(config[box].timer)
                    config[box].timerElement.text(text)
                  $("#port-"+fig.expose).attr("src","http://localhost:"+fig.expose);
                   break;
  }




}



function sendServerMsg(type,data) {
  var msg= {
      type: type ,
      data: data
  }

  websocket.send(JSON.stringify(msg));

}
