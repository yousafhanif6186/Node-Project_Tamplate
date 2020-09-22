let moduleContext = {};

module.exports.init = function (configs, service) {

    moduleContext.serviceConf = configs;
    service.registerEvent('users.collection.POST', handlePostUser);
    service.registerEvent('users.collection.GET', handleListUser);
    service.registerEvent('users.instance.GET', handleGetByIdUser);
    service.registerEvent('users.instance.PUT', handlePostUser);
    service.registerEvent('users.instance.DELETE', handleDeleteByIdUser);

}

async function handlePostUser(controllerName, reqMetaData, reqPayload, respDataCallback) {
    console.log("handlePostUser called...");
}

async function handleListUser(controllerName, reqMetaData, reqPayload, respDataCallback) {
    console.log("handleListUser called...");
}

async function handleGetByIdUser(controllerName, reqMetaData, reqPayload, respDataCallback) {
    console.log("handleGetByIdUser called...");
}


async function handleDeleteByIdUser(controllerName, reqMetaData, reqPayload, respDataCallback) {
    console.log("handleDeleteByIdUser called...");
}