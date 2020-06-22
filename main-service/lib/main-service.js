let StartService = require('./../../service-runner').StartService;

function init() {
    let configs = {
        listener:{
            "port": 3040
          }
    }
    let service = new StartService(configs);
}

init();