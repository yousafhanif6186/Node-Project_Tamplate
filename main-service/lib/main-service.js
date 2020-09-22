const StartService = require('./../../service-runner').StartService;
const configs = require('../configurations/conf.json');
const usersModule = require('./users');

function init() {
    let service = new StartService(configs);
    usersModule.init(configs, service);
}

init();