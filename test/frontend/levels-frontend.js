describe('Unit: MainController', function() {
    var scope, controller, $httpBackend;
    var routeParams = {id: 1}

    // Load the module with MainController
    beforeEach(module('ngRoute'));
    beforeEach(module('appLevels'));
    beforeEach(function(){ROUTE='//localhost:9876/';DEBUG_PENGUIN=true;})
    beforeEach(inject(function($rootScope,$controller,$injector) {

            scope         = $rootScope.$new();

        var timestamp = 1234;
        spyOn(Date.prototype, 'getTime').andReturn(timestamp);

            $httpBackend  = $injector.get('$httpBackend');
        /*    $httpBackend.when('GET','//localhost:9876/ahoj/').respond({ahoj:'hello'});
            $httpBackend.when('GET','//localhost:9876/admin/translates/langs/?fields=name,translate,lang').respond({response:{langs:[
                { id: 1, lang: "Entry 1" },
                { id: 2, lang: "Entry 2" }
            ]}});
        $httpBackend.when('GET','//localhost:9876/infotypes/?fields=pit,name').respond({response:{langs:[
            { id: 1, name: "Entry 1" },
            { id: 2, name: "Entry 2" }
        ]}});

        $httpBackend.when('GET','//localhost:9876/info/?pi=1&timestamp='+timestamp).respond({response:{langs:[
            { id: 1, name: "Entry 1" },
            { id: 2, name: "Entry 2" }
        ]}});
        controller    = $controller("InfoCtrl", { $scope: scope, $routeParams : routeParams }); */
        //$httpBackend.when('GET').respond({response:{}});//.passThrough();

        controller    = $controller("InfoCtrl", { $scope: scope, $routeParams : routeParams });
        //$httpBackend.flush();

   }));

    it('should have a LoginCtrl controller', function() {

        var a = scope.info.pi;
        expect(a).not.toBeUndefined();

    });

    /*it('e2e', function(){

        var n = new BlockOperators();
        expect(InfoCtrl).not.toBeUndefined();
        expect(controller.words).not.toBeUndefined();
        expect(InfoCtrl.update).toBeDefined();

        //browser().navigateTo('/pages');
    });

    it('e2332', inject(function(linkFactory){
        expect(linkFactory).toBeDefined()
    }))*/
});

