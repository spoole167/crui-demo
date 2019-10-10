const express = require('express')
const app = express()
const Docker = require('dockerode');
const docker = new Docker({socketPath: '/var/run/docker.sock'});
const request = require('request');
const delay = require('delay');

const containerDefs=[
  {

      image: 'bharathappali/petclinic-springboot:without-criu' ,
      title: "Petclinic with OpenJ9 (no CRIU)",
      name: 'petclinic-withoutcriu',
      expose: 8080,
      hostconfig : {
          PortBindings: { "8080/tcp": [{ "HostPort": "8080"} ] },
      } ,
      container: null
  },
  {

      image: 'bharathappali/petclinic-springboot:with-criu' ,
      title: "Petclinic with OpenJ9 (CRIU enabled)",
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
  } ,
  {

      image: 'bharathappali/petclinic-springboot:with-criu' ,
      title: "Petclinic with OpenJ9 (CRIU enabled)",
      name: 'petclinic-withcriu2',
      expose: 9081,
      hostconfig : {
        PortBindings: { "8080/tcp": [{ "HostPort": "9081"} ] },
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

var message = {
    type : "",
    msg: ""
}

var state

app.get('/hello', (req, res) => {
  res.send("Hello from Appsody!");
});


function sendClientMsg(ws,type,data) {

  var msg ={ data:data , type:type }

  ws.send(JSON.stringify(msg))
}

function getClientMsg(message) {

  var cmd=String(message)
  if( cmd.startsWith("{") == false) {
      console.log("spurious data %s",cmd)
      return
  }
  var msg=JSON.parse(cmd)

  return msg

}

config=function(wss) {

wss.on('connection', ws => {



    sendClientMsg(ws,"open",containerDefs)

  ws.on('message', message => {

    var msg=getClientMsg(message)

    switch (msg.type) {
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
    sendClientMsg(ws,"info",{ msg: "clearing 0 containers"})
    sendClientMsg(ws,"ready",{})
    return
  }
    sendClientMsg(ws,"info",{ msg: "clearing "+list.length+" containers"})

  var containerInfo=list.pop()
  var n=containerInfo.Names[0]
  console.log('remove petclinic container %s',n)

  docker.getContainer(containerInfo.Id).kill(function (err, data) {
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
    sendClientMsg(ws,"info",{ msg: "launch begins"})
    var l=state.active.length

    for( var i=0;i<l;i++) {
      console.log(state.active[i].id)

      state.active[i].start();
      sendClientMsg(ws,"box",{box:i, state:"starting"})
      
    }

    sendClientMsg(ws,"info",{ msg: "launch completed"})
    sendClientMsg(ws,"go",{})

    var l=state.active.length
    for( var i=0;i<l;i++) {
      waitForContainer(i,ws)
    }

}

function waitForContainer(i,ws) {

  state.active[i].inspect().then(function(f){
    var ip=f.NetworkSettings.IPAddress
    if(ip==null || ip=="") {
      setTimeout(waitForContainer,10,i,ws)
    } else {
      setTimeout(monitorContainer,50,i,ip,ws)
    }
  });
}

function monitorContainer(i,ip,ws) {
    //console.log("watch ",i,ip)
  request('http://'+ip+':8080', function (error, response, body) {
    if(error==null) {
      sendClientMsg(ws,"box",{box:i , state:"started" })
    }
    else {
    //  console.log(error)
      setTimeout(monitorContainer,50,i,ip,ws)
    }
  });
}

function getSet(ws) {

  state = {active: [], ports:[] }
  createContainer(ws,0)


}



function createContainer(ws,c) {

  if ( c >= containerDefs.length) {

        sendClientMsg(ws,"set",{})
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
        sendClientMsg(ws,"error",{})
    } else {
      sendClientMsg(ws,"box",{ box: c, state:"created" })
      state.active.push(container)
      containerDefs[c].container=container
      c++
      createContainer(ws,c)
    }
  })

}
module.exports.app = app;
module.exports.ws  = config;
