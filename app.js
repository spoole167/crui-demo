const express = require('express')
const app = express()
const Docker = require('dockerode');
const docker = new Docker({socketPath: '/var/run/docker.sock'});

const containerDefs=[
  {
      image: 'bharathappali/petclinic-springboot:without-criu' ,
      name: 'petclinic-withoutcriu',
      expose: 8080,
      hostconfig : {
          PortBindings: { "8080/tcp": [{ "HostPort": "8080"} ] },
      } ,
      container: null
  },
  {
      image: 'bharathappali/petclinic-springboot:with-criu' ,
      name: 'petclinic-withcriu',
      expose: 9080,
      hostconfig : {
        PortBindings: { "8080/tcp": [{ "HostPort": "9080"} ] },
        SecurityOpt: ["apparmor=unconfined","seccomp=unconfined"] ,
        CapAdd : ["AUDIT_CONTROL",
                     "DAC_READ_SEARCH",
                     "NET_ADMIN",
                     "SYS_ADMIN",
                     "SYS_PTRACE",
                     "SYS_RESOURCE"]
      },
      container: null
  }

]

var state = {
    state: "init",
    err: null,
    active: [],
    ports:[],
}


app.get('/hello', (req, res) => {
  res.send("Hello from Appsody!");
});


config=function(wss) {

wss.on('connection', ws => {

  ws.on('message', message => {

    var cmd=String(message)
    if( cmd.startsWith("{") == false) {
        console.log("spurious data %s",cmd)
        return
    }
    var msg=JSON.parse(cmd)

    console.log(msg.action)

    switch (msg.action) {

      // get ready
      case "ready"  : getReady(ws); break;
      case "set"    : getSet(ws); break;
      case "go"     : launch(ws); break;
    }
  })

})

}

function removeContainer(ws,list) {

  if (list.length==0) {
    console.log("get ready  done")
    state.active=[]
    state.state="ready-done"
    state.err=null
    sendClient(ws)
    return
  }

  var containerInfo=list.pop()
  var n=containerInfo.Names[0]
  console.log('remove petclinic container %s',n)

  docker.getContainer(containerInfo.Id).stop(function (err, data) {
      docker.getContainer(containerInfo.Id).remove(function (err,data) {
          removeContainer(ws,list)
      })
  });
}
function getReady(ws) {

  console.log("get ready")
  docker.listContainers({all: true},function (err, containers) {

      // build list ...
      var candidates=[]

      containers.forEach(function (containerInfo) {
        console.log(containerInfo.Names[0])
        var n=containerInfo.Names[0]
        if (n.includes("petclinic")) {
            candidates.push(containerInfo)
          //  docker.getContainer(containerInfo.Id).remove();
        }

      });

      removeContainer(ws,candidates)




   });


}

function launch(ws) {
    console.log("launch...")
    var l=state.active.length

    for( var i=0;i<l;i++) {
      console.log(state.active[i].id)

      state.active[i].start();
    }

    state.state="go-done"
    sendClient(ws)
}

function getSet(ws) {

  state.ports=[]
  createContainer(ws,0)


}

function sendClient(ws) {
    var js=JSON.stringify(state)
    ws.send(js)
}


function createContainer(ws,c) {

  if ( c >= containerDefs.length) {
        state.state="set-done"
        state.err=null
        sendClient(ws)
        return
  }
  console.log("creating container "+c)

  var image=containerDefs[c].image
  var name =containerDefs[c].name
  var expose=containerDefs[c].expose
  var hconf=containerDefs[c].hostconfig

  state.ports.push(expose)

  console.log(name)

  var exposedPort=""+expose+"/tcp"

  //   PortBindings: {"80/tcp": [{ "HostPort": "80" }],"22/tcp": [{ "HostPort": "22" }] }
  var exPorts={}
  exPorts[exposedPort]={}

  var definition={Image: image,
                          name: name,
                          ExposedPorts: exPorts,
                          HostConfig: hconf,
                        }

  console.log(JSON.stringify(definition))

  // create the container speced'
  docker.createContainer(definition, function (err, container) {

    if(err!=null) {
        state.err=err
        state.state="set-failed"
        sendClient(ws)
    } else {
      state.active.push(container)
      containerDefs[c].container=container
      c++
      createContainer(ws,c)
    }
  })

}
module.exports.app = app;
module.exports.ws  = config;
