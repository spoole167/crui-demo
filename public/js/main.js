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

var wsUri = "ws://localhost:3000";


$( document ).ready(function() {


  //$('#setupmodal').modal('show')

  $( "#ready_button" ).click(function() {
        // disable the button ..
        $( "#ready_button" ).attr("disabled", true);
        handleReadyButtonInput()
  });
  $( "#set_button" ).click(function() {
        // disable the button ..
        $( "#set_button" ).attr("disabled", true);
        handleSetButtonInput()
  });
  $( "#go_button" ).click(function() {
        // disable the button ..
        $( "#go_button" ).attr("disabled", true);
        handleGoButtonInput()
  });


            window.setInterval(poller, 250)

            window.addEventListener("load", onLoad, false);


                 function onLoad() {

                    websocket = new WebSocket(wsUri);
                    websocket.onopen = function(evt) { onOpen(evt) };
                    websocket.onclose = function(evt) { onClose(evt) };
                    websocket.onmessage = function(evt) { onMessage(evt) };
                    websocket.onerror = function(evt) { onError(evt) };
                 }

                 function onOpen(evt) {

                   // connection made to server
                   // rmove please hold

                    $( "#ready_button" ).attr("disabled", false);

                 }

                 function onClose(evt) {
                   console.log("close")
                 }

                 function onMessage(evt) {
                    // There are two types of messages:
                    // 1. a chat participant message itself
                    // 2. a message with a number of connected chat participants
                    var message = evt.data;
                    console.log(`received %s`,message)
                    var msg=JSON.parse(message)
                    if(msg.err!=null) {
                      console.log(msg.err)
                    }
                    else {
                        var state=msg.state
                        switch(state) {
                          case "ready-done" :  // server containers gone.
                                          // eable set button
                                  $( "#set_button" ).attr("disabled", false);
                                  break;
                          case "set-done" :
                                  client_state.ports=msg.ports
                                  $( "#go_button" ).attr("disabled", false);
                                  break;
                          case "go-done" :
                                $( "#ready_button" ).attr("disabled", false);
                                break;
                        }
                    }


                 }

                 function onError(evt) {
                    state.className = "fail";
                    state.innerHTML = "Communication error";
                 }

                 function addMessage() {
                    var message = chat.value;
                    chat.value = "";
                    websocket.send(message);
                 }





});
