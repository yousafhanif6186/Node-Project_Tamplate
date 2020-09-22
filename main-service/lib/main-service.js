const StartService = require('./../../service-runner').StartService;
const configs = require('../configurations/conf.json');

function init() {
    let service = new StartService(configs);
}

init();