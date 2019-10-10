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


checkState=function(port) {

  var v=$("#hidden-"+port)
  if (v.length) {
      if(v.attr("src")==null) {
        console.log("assigned for "+port)
        v.attr("src","http://localhost:"+port+"/resources/images/pets.png")
        $("#port-"+port).attr("src","http://localhost:"+port)
      } else {

        $("#port-"+port).attr("src","http://localhost:"+port)
      }
  }
  else {
    console.log("no element for "+port)
  }


}

var client_state = {
  action: "",
  state:"init",
  ports: []
}


poller=function() {

    var ports=client_state.ports
    if(ports!=null ) {
      for(var i=0;i<ports.length;i++) {
        checkState(ports[i])
      }
    }
}

// setup
// reset button states



updateUI2=function() {
  console.log("update ui")
  console.log(config)
  $( "#scores" ).empty()
  for(var i=0;i<config.length;i++) {
    var q=config[i]
    var fid="port-"+q.expose
    var entry=$("<iframe>", {id: fid, class: "w-100 embed-responsive-item", src:'http://localhost:3000/get_ready.html' });
    $( "#scores").append(entry)
    var img=document.createElement('img')
    img.id="hidden-"+q.expose
    img.onload = function(){  console.log("loaded "+img.id ); };
    img.onerror = function(err ){
        console.log("failed "+img.id)
        console.log(err)
    };
    $( "#hidden").append(img)
  }

}
