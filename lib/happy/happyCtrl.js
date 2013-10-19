module.exports.DEF_CTRL_METHODS = ['_get', '_post', '_delete', '_put'];
module.exports.DEF_CTRL_NAME = "Ctrl.js";

module.exports.handler = function(ctrl1, file2, server, Hapi){


    this.connect = function(ctrl, file){
        var ctrlWithHandlers = require(ctrl);
        var ctrlname = (file.split(module.exports.DEF_CTRL_NAME)[0]).toLowerCase();
        var handlerPath = ctrlname != 'index' ?  '/' + ctrlname + '/' : '/';

        // load config for controller from controller
        var config = {};
        if(typeof ctrlWithHandlers.$getConfig === 'function') {
            config = ctrlWithHandlers.$getConfig();
        } else if( typeof ctrlWithHandlers.$init === 'function'){
            ctrlWithHandlers.$init(server, Hapi);
        }


        for(var handlerName in ctrlWithHandlers){
            var handlerObject = ctrlWithHandlers[handlerName];
            if(typeof handlerObject === 'function'){
                if(handlerName !== '$init' || handlerName !== '$getConfig'){
                    getMethodAndRegisterRoute(handlerObject, handlerName, handlerPath);
                }
            } else {
                console.error('unknow route ' + handlerName + ' in ' + filePath);
            }
        }
    }

    function getMethodAndRegisterRoute(handlerObject, handlerName, handlerPath) {
        for (var methodIdx = 0; methodIdx <= module.exports.DEF_CTRL_METHODS.length; methodIdx++) {
            if (methodIdx == module.exports.DEF_CTRL_METHODS.length) {
                console.error('unknow method for handler ' + handlerName);

                var handlerMethods = '';
                module.exports.DEF_CTRL_METHODS.forEach(function (idx, val) {
                    handlerMethods += idx + ' '
                });
                console.info('possible methods for handler:' + handlerMethods);
                console.info('like: ' + handlerName + module.exports.DEF_CTRL_METHODS[0]);
                break;
            }


            var methodType = module.exports.DEF_CTRL_METHODS[methodIdx];
            if (handlerName.indexOf(methodType) != -1) {
                var handlerNameFinal = handlerName.split(methodType)[0];
                if (handlerNameFinal != 'index') {
                    handlerPath += handlerNameFinal;
                    //registerRoute(methodType, handlerPath + '/', handlerObject, 'extra?');
                    registerRoute(methodType, handlerPath + '/', handlerObject, '{params*}');
                }
                registerRoute(methodType, handlerPath, handlerObject, '');
                break;
            }
        }
        return {methodIdx: methodIdx, handlerMethods: handlerMethods, methodType: methodType, handlerNameFinal: handlerNameFinal};
    }

    function registerRoute(methodType, handlerPath, shandler, extra){
        //console.log('register' + file + '/' + name);
        var config_handler = {
            handler: shandler
        };

        var setRoute = {
            method : methodType.substr(1),
            path : handlerPath + extra ,
            config : config_handler
        };

        console.log('route ' + setRoute.method + ' ' + setRoute.path)
        // Add the route
        server.addRoute(setRoute);
    }

    this.connect(ctrl1, file2);
}
