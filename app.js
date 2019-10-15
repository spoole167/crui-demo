const express = require('express')
const app = express()
const request = require('request');
const comms = require("./comms.js");

const dockerm = require("./docker_management.js");

const config_data = require('./config.json')
const instances=config_data.instances


var msg

var message = {
    type : "",
    msg: ""
}


config=function(wss) {

      // setup comms structure to clients
      // config the state engine
      // tie together
      var msg=comms({wss:wss,debug:true})

      var docker=dockerm(msg,config_data)

      msg.Init(
        {
          connected:  function() {
            msg.Open(config_data)
            checkConfig(msg,docker)

          } ,
          command: function(cmd) {

            switch (cmd.cmd) {
              case "ready"  : docker.clearContainers(); break;
              case "set"    : docker.createContainers(instances); break;
              case "go"     : docker.startContainers(monitorContainer); break;
            }

          }
        }
      );
}

function checkConfig(msg,docker) {
  // check the images can be found...
  if(instances==null || instances.length<1) {
    msg.Fatal("no configuration elements")
  } else {
    checkConfigInstances(msg,docker)
  }
}

function configImage(msg,image,instance) {

  image.inspect( function(err,data) {

    instance.docker_image=image
    var exPorts=data.Config.ExposedPorts
    if(exPorts.length==0) {
      msg.Fatal("image "+instance.image+" has no ports")
      return
    }

    var keys=Object.keys(exPorts)
    var ports=[]

    for(var k=0;k<keys.length;k++) {
        var parts=keys[k].split("/");

        if(parts[1]=="tcp") { ports.push(parts[0]) }
    }

    if (ports.length==0) {
        msg.Fatal("image "+instance.image+" has no exposed tcp ports")
        return
    }
    if (ports.length>1) {
        if (instance.port!=null) {
          ports=[instance.port]
        }
        else {
          msg.Fatal("image "+instance.image+" has more than one tcp port")
          return
        }

    }

    instance.internalPort=ports[0]
    msg.Info(instance.image+" will use port "+instance.internalPort)


  });
}

function checkConfigInstances(msg,docker) {


    for(var i=0;i<instances.length;i++) {

        var instance=instances[i]
        instance.id=i

        if (instance.image==null ) {
            msg.Error("missing image name for config "+i)
            return
        }

        var image=docker.getImage(instance.image)


        if(image==null) {
          msg.Error("cannot find image "+instance.image)
          return
        }

        configImage(msg,image,instance);



      } // end for

}


function monitorContainer(i,ip,iport,eport,msg) {

  request('http://'+ip+':'+iport, function (error, response, body) {
    if(error==null) {
        msg.State("box-started",{ref:i,port:eport})
    }
    else {
      setTimeout(monitorContainer,100,i,ip,iport,eport,msg)
    }
  });
}



module.exports.app = app;
module.exports.ws  = config;
