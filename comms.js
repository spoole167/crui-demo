var config={}

function sendClientMsg(ws,type,data,target) {

  var msg ={ data:data ,target:target, type:type }

  ws.send(JSON.stringify(msg))
}


function parseClientMsg(message) {

  var cmd=String(message)
  if( cmd.startsWith("{") == false) {
      console.log("spurious data %s",cmd)
      return
  }
  var msg=JSON.parse(cmd)

  return msg

}


function setup(cfg,handlers) {

  cfg.wss.on('connection', ws => {

    cfg.ws=ws

    if(cfg.debug) {console.log("comms:connected:") }

    handlers.connected()

    ws.on('message', message => {

      if(cfg.debug)  console.log("comms:msg:"+message)

      var cmd=parseClientMsg(message)

      handlers.command(cmd)

    })

  })
}

module.exports = function(cfg) {
    return {
        // system begins
        Init: function(handlers) {
            if(cfg.debug) console.log("comms:init:")
            setup(cfg,handlers)
        } ,
        // system ready
        Open: function(d) {
            if(cfg.debug) console.log("comms:open:")
            sendClientMsg(cfg.ws,"open",d)
        },
        // system is not usable
        Fatal: function(e,m) {
            if(cfg.debug) console.log("comms:fatal:")
              sendClientMsg(cfg.ws,"fatal",e)
        },
        // error during execution
        Error: function(e,m) {
            if(cfg.debug) console.log("comms:error:")
            sendClientMsg(cfg.ws,"error",e)
        },
        // status meesage
        Info: function(m,t) {
            if(cfg.debug) console.log("comms:info:"+m)
            sendClientMsg(cfg.ws,"info",m,t)
        },
        // state change - object ref, state-data, message
        State: function(s,t,d) {
              if(cfg.debug) console.log("comms:state:")
              sendClientMsg(cfg.ws,s,d,t)
        }
    }


}
