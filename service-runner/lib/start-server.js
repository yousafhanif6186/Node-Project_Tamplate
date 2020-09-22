const EventEmitter = require('events').EventEmitter;
const bodyParserModule = require('body-parser');
const util = require('util');
const express = require('express');
const multer = require('multer');
const pathModule = require('path');
const queryStrModule = require('querystring');
const urlModule = require('url');

class StartService extends EventEmitter {

    constructor(configs) {

        super();
        if (!(this instanceof StartService))
            return (new StartService(configs));

        this.app = express();
        this.app.use(bodyParserModule.urlencoded({
            extended: false,
            limit: '2mb'
        }))
        this.app.use(bodyParserModule.json({
            limit: '2mb'
        }));
        this.app.use(multer().single('upfile'));
        initHTTPServer(this.app, configs.listener);

        if (configs.endpoints) {


            for (var key in configs.endpoints) {

                var apiEndpoint = configs.endpoints[key];

                if (apiEndpoint.controllers) {

                    for (var i = 0; i < apiEndpoint.controllers.length; i++) {

                        var controller = apiEndpoint.controllers[i];

                        var path = controller.path;
                        if (apiEndpoint.basePath) {
                            path = pathModule.join(apiEndpoint.basePath, path);
                        }
                        console.log(path);
                        var eventName = key + '.' + controller.name;
                        this.app.get(path, serviceReqHandler.bind(new ServiceReqData(this, path, eventName + '.GET')));
                        this.app.post(path, serviceReqHandler.bind(new ServiceReqData(this, path, eventName + '.POST')));
                        this.app.put(path, serviceReqHandler.bind(new ServiceReqData(this, path, eventName + '.PUT')));
                        this.app.patch(path, serviceReqHandler.bind(new ServiceReqData(this, path, eventName + '.PATCH')));
                        this.app.delete(path, serviceReqHandler.bind(new ServiceReqData(this, path, eventName + '.DELETE')));
                        console.log('endpoint defined, uri [' + path + ']');
                    }
                }
            }
        }
    }


    registerEvent(eventName, eventCallback) {
        this.on(eventName, function () {
            var eventRegData = this;
            eventRegData.eventCallback(eventRegData.eventName, reqMetaData, reqPayload, respCallback);
        })
    }

}

util.inherits(StartService, EventEmitter);

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

const serviceReqHandler = function (req, res) {

    var data = [];
    var that = this;
    var config = that.service_processor.config;
    var reqPayload = req.body;
    const _mwContext = req._context;

    process.nextTick(function () {

        var reqMetaData = new RequestMetaData()
        reqMetaData.url = req.url;
        var reqURL = urlModule.parse(reqMetaData.url);
        reqMetaData.uriParams = queryStrModule.parse(reqURL.query);
        reqMetaData.method = req.method;
        reqMetaData.headers = req.headers;
        reqMetaData.params = req.params;
        reqMetaData.file = req.file;
        reqMetaData._context = req._context;
        reqMetaData.requestTimeout = config.listener.requestTimeout - 5;
        req._context = null;

        that.service_processor.emit(that.event, reqMetaData, reqPayload, function (err, respObj, respMetaData) {
            if (err) {

                var errRespObj = {};
                if (reqPayload && reqPayload.requestId) {
                    errRespObj.requestId = reqPayload.requestId;
                }

                errRespObj.responseCore = err;
                res.send(JSON.stringify(errRespObj, null, 4));
                logger.debug(reqMetaData._context, 'response sent...');
                if (reqPayload && reqPayload.requestId)
                    logger.debug(reqMetaData._context, 'requestId: ' + reqPayload.requestId);
            } else {
                if (respMetaData && respMetaData.headers) {
                    for (var hdr in respMetaData.headers) {
                        res.setHeader(hdr, respMetaData.headers[hdr]);
                    }
                }

                var contents;

                if (respObj) {
                    if (respObj instanceof Buffer) {
                        contents = respObj;
                    } else if (typeof respObj == 'string') {
                        contents = respObj;
                    } else {
                        contents = JSON.stringify(respObj);
                        contents = unidecode(contents);
                        res.setHeader('Content-Type', 'application/json');
                    }

                    res.setHeader('Content-Length', contents.length);
                }

                if (respMetaData && respMetaData.statusCode) {
                    res.writeHead(respMetaData.statusCode, respMetaData.statusMessage);
                }

                if (respObj) {
                    res.end(contents);
                    logger.debug(reqMetaData._context, 'response sent...');
                    if (reqPayload && reqPayload.requestId)
                        logger.debug(reqMetaData._context, 'requestId: ' + reqPayload.requestId);
                } else {

                    if (false) { //if(respMetaData.filePath) {
                        res.setHeader('Content-Type', 'application/octet-stream');
                        res.download(respMetaData.filePath, respMetaData.fileName);
                    } else {
                        res.end();
                    }
                }
            }
        });
    });

    res.setTimeout(config.listener.requestTimeout * 1000, function () {
        const errRespObj = {};
        errRespObj.statusCode = 20001;
        logger.error(_mwContext, 'req-timeout, response ', JSON.stringify(errRespObj, null, 4));
        const contents = JSON.stringify(errRespObj, null, 4);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', contents.length);
        res.writeHead(408);
        res.end(contents);
    });
}

function RequestMetaData() {
    if (!(this instanceof RequestMetaData)) {
        return (new RequestMetaData());
    }
}

const ServiceReqData = function (service_processor, uri, event, method) {
    if (!(this instanceof ServiceReqData)) {
        return (new ServiceReqData(uri, event, method));
    }

    this.service_processor = service_processor;
    this.uri = uri;
    this.event = event;
    this.method = method;
}

module.exports.StartService = StartService;