'use strict';

angular.module("myApplication", ["buMain"]);

describe("bu$compile service", function () {

    var testRoot;

    function createNode() {
        var node = {
            nodeName: "",
            nodeType: -1,
            attributes: {
                items: [],
                item: function (i) {
                    return node.attributes.items[i];
                },
                add: function (name) {
                    node.attributes.items.push({
                        name: name
                    });
                    node.attributes.length = node.attributes.items.length
                },
                length: 0
            }
        };
        return node;
    }

    beforeEach(function () {
        //changing the test root to be <DIV#testRoot/> instead of <HTML/>
        var body = angular.element(document.documentElement).find("body");
        body.append("<div id='testRoot'></div>");
        testRoot = angular.element(document.getElementById("testRoot"));
        angular.module("myApplication")
            .value("$rootElement", testRoot);
        //loading module
        module("myApplication");
    });

    afterEach(function () {
        //cleaning up the test root
        testRoot.remove();
    });

    it("fails to be invoked if no directive name has been provided", inject(function (bu$compile) {
        expect(bu$compile.bind(null, undefined)).toThrowError("Directive name cannot be empty: " + undefined);
        expect(bu$compile.bind(null, null)).toThrowError("Directive name cannot be empty: " + null);
        expect(bu$compile.bind(null, "")).toThrowError("Directive name cannot be empty: " + "");
    }));

    it("fails to be invoked if a factory is not provided and this is the first usage", inject(function (bu$compile) {
        var directiveName = "directive";
        expect(bu$compile.bind(null, directiveName)).toThrowError("No previous description was found for directive " + directiveName);
    }));

    it("will not fail if invoked with only the name after the first time", inject(function (bu$compile) {
        var directiveName = "myDirective";
        bu$compile(directiveName, function () {
            return {};
        });
        expect(bu$compile.bind(null, directiveName)).not.toThrow();
    }));

    it("returns a compile function `function (root, compileFunction) {...}`", inject(function (bu$compile) {
        var compile = bu$compile("myDirective", function () {
            return {};
        });
        expect(compile).not.toBeUndefined();
        expect(angular.isFunction(compile)).toBeTruthy();
    }));

    it("registers a directive with the `bu$directiveRegistry` registry", inject(function (bu$registryFactory, bu$compile) {
        var registry = bu$registryFactory.get("bu$directiveRegistry");
        expect(registry).not.toBeUndefined();
        expect(registry.list()).toEqual([]);
        var directiveName = "myDirective";
        bu$compile(directiveName, function () {
            return {};
        });
        expect(registry.list()).toEqual([ directiveName]);
        var directive = registry.get(directiveName);
        expect(directive).not.toBeUndefined();
        expect(directive.name).toBe(directiveName);
        expect(directive.directive).not.toBeUndefined();
        expect(directive.factory).not.toBeUndefined();
        expect(directive.filter).not.toBeUndefined();
        expect(directive.compile).not.toBeUndefined();
    }));

    it("invokes the directive factory once", inject(function (bu$compile) {
        var directive = jasmine.createSpy("directiveFactory").and.callFake(function () {
            return {};
        });
        expect(directive).not.toHaveBeenCalled();
        bu$compile("myDirective", directive);
        expect(directive).toHaveBeenCalled();
        expect(directive.calls.count()).toBe(1);
    }));

    it("replaces the factory's context with an object containing the property `bu$Preloaded`", inject(function (bu$compile) {
        var directive = jasmine.createSpy("directiveFactory").and.callFake(function () {
            return {};
        });
        expect(directive).not.toHaveBeenCalled();
        bu$compile("myDirective", directive);
        expect(directive.calls.mostRecent()).toEqual(jasmine.objectContaining({
            object: {
                bu$Preload: true
            }
        }));
        expect(directive.calls.count()).toBe(1);
    }));

    describe("when `restrict` contains `A`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;

        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.nodeType = 1;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "A"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("will accept de-normalized attributes (myAttribute -> my-attribute)", function () {
            node.attributes.add("BU-my-DIRECTIVE", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will accept de-normalized attributes with namespace", function () {
            node.attributes.add("bu:my-directive", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will accept de-normalized attributes with `x-` prefix", function () {
            node.attributes.add("x-bu-my-directive", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will accept de-normalized attributes with `data-` prefix", function () {
            node.attributes.add("data-bu-my-directive", null);
            var chosen = filter(node);
            expect(chosen).toEqual(node);
        });

        it("will not accept any other element", function () {
            var chosen = filter(node);
            expect(chosen).toBeNull();
        });

    });

    describe("when `restrict` contains `E`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;
        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.nodeType = 1;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "E"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("matches elements with de-normalized name", function () {
            node.nodeName = "bu-my-directive";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements with namespace prefix", function () {
            node.nodeName = "bu:My-Directive";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements with `x-` prefix", function () {
            node.nodeName = "X-BU-My-Directive";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements with `data-` prefix", function () {
            node.nodeName = "Data-BU-My-Directive";
            expect(filter(node)).toEqual(node);
        });
        
        it("does not match any other element", function () {
            expect(filter(node)).toBeNull();
        });

    });
    
    describe("when `restrict` contains `C`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;
        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.nodeType = 1;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "C"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("matches elements whose class name contains the directive", function () {
            node.className = "something-bu-my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements whose class name contains the directive with namespace prefix", function () {
            node.className = "something-bu:my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements whose class name contains the directive with `x-` prefix", function () {
            node.className = "something-x-bu-my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("matches elements whose class name contains the directive with `data-` prefix", function () {
            node.className = "something-data-bu-my-directive-goes-here";
            expect(filter(node)).toEqual(node);
        });

        it("does not match any other element", function () {
            node.className = "something-data-my-directive-goes-here";
            expect(filter(node)).toBeNull();
        });

    });

    describe("when `restrict` contains `I`", function () {

        var namespace = "bu", registry, node, directiveName = "myDirective", filter;
        beforeEach(function () {
            angular.module("myApplication")
                .config(function (bu$configurationProvider) {
                    bu$configurationProvider.set({
                        namespace: namespace
                    });
                });
            node = createNode();
            node.parentNode = createNode();
            node.parentNode.nodeName = "parentNode";
            node.nodeType = 8;
            inject(function (bu$registryFactory, bu$compile) {
                bu$compile(directiveName, function () {
                    return {
                        restrict: "I"
                    };
                });
                registry = bu$registryFactory.get("bu$directiveRegistry");
                filter = registry.get(directiveName).filter;
            });
        });

        it("accepts all comments and returns their parent nodes", function () {
            var chosen = filter(node);
            expect(chosen).not.toBeNull();
            expect(chosen).not.toBeUndefined();
            expect(chosen).toEqual(node.parentNode);
        });

        it("does not accept any other node", function () {
            node.nodeType = 1;
            expect(filter(node)).toBeNull();
        });

    });

});