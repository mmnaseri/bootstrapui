(function (BootstrapUI) {
    BootstrapUI.loader.load([
        {
            type: 'tool',
            identifier: 'form',
            pathResolver: function (item) {
                return BootstrapUI.configuration('toolsBase') + '/' + item.identifier + '.js';
            }
        },
        {
            type: 'directive',
            identifier: 'formContainer'
        },
        {
            type: 'directive',
            identifier: 'formSelectItem'
        }
    ]).then(function () {
        var form = BootstrapUI.tools.get('form');
        form.select = BootstrapUI.registry("bu$form.select");
        var config = form.configuration();
        BootstrapUI.directive("formSelect", ["$q", "$http", function ($q, $http) {
            var deferred = $q.defer();
            var define = function (id, definition) {
                form.select.register(id, definition);
            };
            if (!this || !this.bu$Preload) {
                deferred.resolve(function ($scope) {
                    var defined = $q.defer();
                    var definition = form.select.get($scope.type);
                    if (angular.isDefined(definition)) {
                        defined.resolve(definition);
                        return;
                    }
                    var url = BootstrapUI.configuration.base + "/" + config.directivesBase + "/" + $scope.type + ".js";
                    url = url.replace(/\/{2,}/g, "/");
                    $http.get(url).then(function (result) {
                        var script = result.data;
                        try {
                            var before = form.select.info().size;
                            eval(script);
                            if (before == form.select.info().size) {
                                //noinspection ExceptionCaughtLocallyJS
                                throw new Error("No new items where defined after fetching the definition");
                            }
                            var definition = form.select.get($scope.type);
                            if (angular.isDefined(definition)) {
                                defined.resolve(definition);
                            } else {
                                //noinspection ExceptionCaughtLocallyJS
                                throw new Error("Fetching did not resolve in defining the directive type");
                            }
                        } catch (e) {
                            throw new Error("Failed to fetch definition for type `" + $scope.type + "`", e);
                        }
                    }, function (reason) {
                        if (reason.status == 404) {
                            define($scope.type, {});
                            defined.resolve(form.select.get($scope.type));
                        } else {
                            throw new Error("There was a problem accessing directive definition for type `" + $scope.type + "`", reason);
                        }
                    });
                    return defined.promise.then(function (definition) {
                        if (angular.isUndefined(definition.template) && angular.isUndefined(definition.templateUrl)) {
                            definition.templateUrl = $scope.type;
                        }
                        if (angular.isDefined(definition.templateUrl) && !/\.[^\.]+$/.test(definition.templateUrl)) {
                            if (config.aliases.select[definition.templateUrl]) {
                                definition.templateUrl = config.aliases.select[definition.templateUrl];
                            }
                            definition.templateUrl = (BootstrapUI.configuration.base + "/" + config.templatesBase + "/" + definition.templateUrl + ".html").replace(/\/{2,}/g, "/");
                        }
                        return definition;
                    });
                });
            }
            return {
                template: '<div class="form-group placeholder">&lt;{{namespace ? namespace + \':\' : \'\'}}form-select type="{{type}}"/&gt;<span></span></div>',
                restrict: "E",
                replace: true,
                transclude: true,
                require: "^?bu$FormContainer",
                resolve: deferred.promise,
                scope: {
                    type: "@",
                    label: "@",
                    placeholder: "@",
                    id: "@",
                    validation: "@",
                    state: "@",
                    feedback: "@",
                    value: "@",
                    orientation: "@",
                    labelSize: "@",
                    ngModel: '=?',
                    descriptor: '&?',
                    selection: "@",
                    disabled: "@"
                },
                defaults: {
                    label: " ",
                    placeholder: "",
                    validation: "",
                    state: "normal",
                    feedback: ""
                },
                link: {
                    post: ["scope", "element", "attrs", "controller", function (scope, element, attrs, controller) {
                        if (!scope.labelSize && controller && controller.$scope && controller.$scope.labelSize) {
                            scope.labelSize = controller.$scope.labelSize;
                        }
                        if (!scope.labelSize) {
                            scope.labelSize = 3;
                        }
                        if (!scope.orientation && controller && controller.$scope && controller.$scope.orientation) {
                            scope.orientation = controller.$scope.orientation;
                        }
                        if (!scope.orientation) {
                            scope.orientation = "vertical";
                        }
                        scope.namespace = BootstrapUI.configuration.namespace;
                        scope.current = null;
                        scope.update = function () {
                            if (angular.isUndefined(scope.ngModel)) {
                                return;
                            }
                            if (scope.selection == 'single' && scope.ngModel.length > 1) {
                                scope.ngModel.splice(1, scope.ngModel.length - 1);
                            }
                            if (scope.selection == 'single' && scope.ngModel.length == 1) {
                                scope.current = scope.ngModel[0];
                            }
                            for (var j = 0; j < scope.items.length; j++) {
                                var obj = scope.items[j];
                                obj.selected = false;
                                for (var i = 0; i < scope.ngModel.length; i++) {
                                    if (scope.ngModel[i] == obj.value) {
                                        obj.selected = true;
                                    }
                                }
                            }
                        };
                        if (angular.isUndefined(scope.selection)) {
                            scope.selection = 'multiple';
                        }
                        if (scope.selection != 'single') {
                            var updateModel = function () {
                                for (var i = 0; i < scope.items.length; i++) {
                                    if (scope.items[i].selected) {
                                        scope.ngModel.push(scope.items[i].value);
                                    }
                                }
                            };
                            scope.changed = function () {
                                scope.ngModel = [];
                                updateModel();
                            };
                        } else {
                            scope.changed = function (item) {
                                if (angular.isUndefined(item)) {
                                    item = {
                                        value: scope.current
                                    };
                                } else if (!angular.isObject(item)) {
                                    item = {
                                        value: item
                                    };
                                }
                                scope.ngModel = [item.value];
                            };
                        }
                        scope.$watch('ngModel', function () {
                            scope.update();
                        });
                    }]
                },
                controller: function ($scope) {
                    if (angular.isDefined($scope.descriptor) && angular.isDefined($scope.descriptor())) {
                        angular.forEach(['orientation', 'labelSize', 'placeholder', 'feedback', 'state', 'label'], function (item) {
                            $scope.$watch(function () {
                                return $scope.descriptor()[item];
                            }, function (value) {
                                if (angular.isDefined(value) && $scope[item] != value) {
                                    $scope[item] = value;
                                    $scope.$apply.postpone($scope);
                                }
                            });
                        });
                    }
                    $scope.items = [];
                    this.add = function (item) {
                        $scope.items.push(item);
                    };
                },
                on: {
                    failure: function (error, reason, $scope, $element) {
                        if (config.visualErrors) {
                            $element.addClass('failed');
                        }
                        throw new Error(error, reason);
                    }
                }

            }
        }]);
    });

})(dependency("BootstrapUI"));