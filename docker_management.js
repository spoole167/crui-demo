const Docker = require('dockerode');

const docker = new Docker({socketPath: '/var/run/docker.sock'});


var config


function removeContainers(msg,list) {

  if (list.length==0) {

    msg.Info("clearing 0 containers")
    msg.State("ready","system")
    return
  }

  msg.Info("clearing "+list.length+" containers")

  var containerInfo=list.pop()
  var n=containerInfo.Names[0]
  console.log('remove container %s',n)

  docker.getContainer(containerInfo.Id).kill(function (err, data) {
      docker.getContainer(containerInfo.Id).remove(function (err,data) {
          removeContainers(msg,list)
      })
  });

}

function createContainers(msg,instances,active_list,ref) {

  if(ref>=instances.length) {
    msg.State("set")
    return
  }

  var instance=instances[ref]

  console.log("creating container "+instance.name)

  var image=instance.image
  var expose=instance.expose
  var hconf=instance.hostconfig

  if(hconf==null) {
    hconf={}
  }

  console.log("port -->"+instance.internalPort)
  msg.Info(instance.image+" has port "+instance.internalPort)
  hconf.PublishAllPorts=true

  /*
  state.ports.push(expose)

  var exposedPort=""+expose+"/tcp"

  //   PortBindings: {"80/tcp": [{ "HostPort": "80" }],"22/tcp": [{ "HostPort": "22" }] }
  var exPorts={}
  exPorts[exposedPort]={}

  var portKey=instances[c].internalPort+"/tcp"
  // internalPort
  //
    hconf.PortBindings={}
    hconf.PortBindings[portKey]=null

  //}
  */

  var definition={Image: image,
                        //  ExposedPorts: exPorts,
                          HostConfig: hconf,
                          Labels: { "dev.noregressions.dockermon" : ""+ref}
                  }


  //console.log(JSON.stringify(definition))

  // create the container speced'
  docker.createContainer(definition, function (err, container) {

    if(err!=null) {
        console.log(err)
        msg.Error("error "+err)
    } else {
      active_list.push(container)
      msg.State("box-created",instance.id,container.id)
        ref++
       createContainers(msg,instances,active_list,ref)
    }
  })

}

function waitForContainer(i,msg,cb) {

config.active[i].inspect().then(function(f){

    console.log("wait for "+i)
    var ip=f.NetworkSettings.IPAddress
    if(ip==null || ip=="") {
      setTimeout(waitForContainer,10,i,msg,cb)
    } else {
      var key=config.instances[i].internalPort+"/tcp"
      console.log(key)
      console.log(f.NetworkSettings.Ports)
      var eport=f.NetworkSettings.Ports[key][0].HostPort
      config.active[i].eport=eport

      // port =f.NetworkSettings.Ports  { }
      /*
      "Ports": {
                "8080/tcp": [
                    {
                        "HostIp": "0.0.0.0",
                        "HostPort": "32769"
                    }
                ]
            },
      */
      setTimeout(cb,50,i,ip,config.instances[i].internalPort,eport,msg)
    }
  });
}


module.exports =  function(msg,cfg) {

    config=cfg
    config.active=[]

    docker.getEvents({filter:"label=dev.noregressions.dockermon"}).then( e => {
      e.on('readable', () => {
          var q=new String(e.read())
          var oq=JSON.parse(q)
          if(oq.Type=="container") {
            var box_id=oq.Actor.Attributes["dev.noregressions.dockermon"]
            switch(oq.status) {
              case "die": msg.State("box-died",box_id); break;
              case "create" : msg.State("box-create",box_id); break;
              default : msg.Info("state = "+oq.status+" target="+box_id); break;
            }
          }
    })
     })
    .catch(() => {console.error('Failed to attach docker event listener.'); })

    return  {

        getImage: function(name) {
          return docker.getImage(name)
        },

      clearContainers: function() {
        docker.listContainers({all: true, filters:{"label":["dev.noregressions.dockermon"]}},function (err, containers) {
          if(err) {
            msg.Error("list containers err")
            return
          }
          if (containers==null ) containers=[]
          msg.Info("container count="+containers.length)
          removeContainers(msg,containers)
         });
      } ,

      createContainers: function() {

          var instances=config.instances
          createContainers(msg,instances,config.active,0)

      } ,

      startContainers: function(cb) {
          msg.Info("launch begins")

          var l=config.active.length

          for( var i=0;i<l;i++) {
            console.log(config.active[i].id)
            config.active[i].start();
            msg.State("box-starting",i)

          }
          msg.Info("launch completed")
          msg.State("go")

          var l=config.active.length
          for( var i=0;i<l;i++) {
            waitForContainer(i,msg,cb)
          }

      }
    }
 }
