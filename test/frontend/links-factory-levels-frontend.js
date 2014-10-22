describe('Unit: links-factory', function() {
    var scope, controller, $httpBackend;
    var routeParams = {id: 1}

    // Load the module with MainController
    beforeEach(module('ngRoute'));
    beforeEach(module('milan.levels.links.factory'));
    beforeEach(module('milan.levels.search.factory'));
    beforeEach(function(){ROUTE='//localhost:9876/';DEBUG_PENGUIN=true;})
    beforeEach(inject(function($rootScope,$controller,$injector) {

            scope         = $rootScope.$new();

        var timestamp = 1234;
        spyOn(Date.prototype, 'getTime').andReturn(timestamp);

            $httpBackend  = $injector.get('$httpBackend');

        $httpBackend.when('GET','/words/sentences/es/?toLinks=1045').respond({response:{langs:[
            { id: 1, name: "Entry 1" },
            { id: 2, name: "Entry 2" }
        ]}});

        //controller    = $controller("InfoCtrl", { $scope: scope, $routeParams : routeParams });
        //$httpBackend.when('GET').respond({response:{}});//.passThrough();

        //controller    = $controller("linksFactory", { $scope: scope, $routeParams : routeParams });


   }));

    it('can get an instance of linksFactory', inject(function(linksFactory) {
        expect(linksFactory).toBeDefined();
    }));


    iit('can get an instance of linksFactory', inject(function(linksFactory) {
        linksFactory.getSentencesToLink('es', 1045, function(data){
            expect(data).toBeDefined();
        })
        $httpBackend.flush();
    }));


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

