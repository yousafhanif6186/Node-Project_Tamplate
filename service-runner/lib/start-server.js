let EventEmitter = require('events').EventEmitter;
let bodyParserModule = require('body-parser');
var util = require('util');
var express = require('express');
var multer = require('multer');

class StartService {

    constructor(configs) {
        if (!(this instanceof StartService))
            return (new StartService(configs));

        this.app = express();
        this.app.use(bodyParserModule.urlencoded({ extended: false, limit: '2mb' }))
        this.app.use(bodyParserModule.json({ limit: '2mb' }));
        this.app.use(multer().single('upfile'));
        initHTTPServer(this.app, configs.listener);
    }
}

let initHTTPServer = (app, listener) => {

    app.listen(listener.port, listener.host, () => {
        if (listener.host) {
            console.log(util.format('listening on [%s:%d]', listener.host, listener.port));
        } else {
            console.log(util.format('listening on [%d]', listener.port));
        }
    }).on('error', function (err) {
        console.log('' + err);
        if (err.code == 'EADDRNOTAVAIL' || err.code == 'EACCES' || err.code == 'EADDRINUSE') {
            process.exit(0);
        }
    });
}

module.exports.StartService = StartService;