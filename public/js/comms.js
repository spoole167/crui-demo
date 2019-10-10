
var wsUri = "ws://localhost:3000";

var comms_handlers={
  err: handleWSError
}


function handleWSError(eventname,evt) {
  console.log(evt)
}

function commsHandler(event,evt) {


  userHandler=comms_handlers[event]
  if(userHandler==null) {
    console.log("no comms handler for "+event)
    return
  }


  switch(event) {
    case "get" :  var msg=JSON.parse(evt.data)
                  userHandler(event,msg);
                  break;

    case "open" : userHandler(event,evt); break;

    case "close" : userHandler(event,evt); break;

    case "err"   : userHandler(event,evt); break;

  }
}

function commsInit(handlers) {
   console.log("init socket connection to "+wsUri)
   comms_handlers=handlers
   websocket = new WebSocket(wsUri);
   websocket.onopen = function(evt) { commsHandler("open",evt) };
   websocket.onclose = function(evt) { commsHandler("close",evt) };
   websocket.onmessage = function(evt) { commsHandler("get",evt) };
   websocket.onerror = function(evt) { commsHandler("err",evt) };
}
