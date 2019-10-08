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

var client_state = {
  action: "",
  state:"init",
  ports: []
}

poller=function() {
    var ports=client_state.ports
    if(ports!=null ) {
      for(var i=0;i<ports.length;i++) {
        var id="#port-"+ports[i]
        $( id ).attr("src","http://localhost:"+ports[i]);
      }
    }
}

// setup
// reset button states

sendServer=function() {
    console.log(client_state)
    console.log(JSON.stringify(client_state))
    websocket.send(JSON.stringify(client_state));
}


// connected to server
// enable the web page

serverConnected=function() {

}

handleGoButtonInput=function() {
  client_state.action="go"
  sendServer()
}

handleReadyButtonInput=function() {
  client_state.action="ready"
  sendServer()
}

handleSetButtonInput=function() {
  client_state.action="set"
  sendServer()
}
