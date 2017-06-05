define([
    "jquery",
    "qvangular",
    "qlik",
    "angular",
    "text!./template.html",
    "text!./AppLinker.css",
    "./properties/definition",
    "./services/linkerService",
    "./lib/external/jquery.popupoverlay"
],

// aliasing array elements as params:
function($, qva, qlik, angular, template, css, definition, linkerService) {

    // advised:
    'use strict';

    $("<style>").html(css).appendTo("head");

    $(document).on("mouseenter", ".img", function() {
        $(this).addClass("hover");
    });
    $(document).on("mouseleave", ".img", function() {
        $(this).removeClass("hover");
    });

    return {
        initialProperties: {
            version: 1.0
        },
        definition: definition,
        snapshot: {
            canTakeSnapshot: false
        },
        template: template,
        priority: 0,
        // resize: function($element) {
        //     console.log($element);
        // },
        controller: ['$scope', '$timeout', 'linkerService',
            function($scope, $timeout, linkerService) {

                $("#qv-toolbar-container").on("click", function() {
                    $(".applinker-stage").hide();
                });

                $(".close-applinker-stage").on("click", function() {
                    $(this).closest(".applinker-stage").hide();
                });

                function update() {
                    $scope.isLoading = true;
                    $scope.appItems = linkerService.getAppItems($scope.layout);

                    if ($scope.appItems.length > 0) {

                        $timeout(function() {

                            linkerService.getApps($scope.layout, $scope.appItems).then(function(apps) {
                                return linkerService.addFieldsToApps(apps);
                            }).then(function(apps){
                                $scope.linkedApps = apps;

                                return linkerService.getSelectedItemKeys();
                            }).then(function(currentSelections){
                                $scope.linkedApps = linkerService.addTransferableSelectionsToApps(currentSelections, $scope.linkedApps);

                                $scope.isLoading = false;
                                $scope.selectedItemCount = currentSelections.length;
                            });
                        }, 1500);
                    } else {
                        // no configured apps:
                        $scope.linkedApps = [];
                        $scope.isLoading = false;
                    }
                };

                $scope.isInEditMode = function(){
                    return qlik.navigation.getMode() === 'edit';
                }

                $scope.isConfiguredApps = function() {
                    return $scope.appItems.length > 0;
                }

                $scope.openLinkedApp = function(application, e) {

                    var transferringId = "#applinker-transferring-" + $scope.$parent.options.id;

                    // has it already been moved?
                    if ($("body > " + transferringId).length === 0) {
                        // transfer:
                        $(transferringId).appendTo("body");
                    }

                    // show it!
                    $(transferringId).fadeIn();

                    // stop!
                    e.preventDefault();

                    //
                    //$('#fadeandscale' + $scope.$parent.options.id).popup('hide');

                    linkerService.getSelections().then(function(dict) {

                            // no selections, but open app nonetheless:
                            if (void 0 === dict) {
                                $(transferringId).fadeOut(500, function() {

                                    linkerService.openApp(document.URL, application.qDocId, application.sheet);
                                });
                                return;
                            };

                            // current app's selections have been made, so make them in the new app:
                            linkerService.makeSelections(application.qDocId, dict).then(function() {

                                var stage = "#applinker-stage-" + $scope.$parent.options.id;
                                $(stage).hide();

                                $(transferringId).fadeOut(500, function() {
                                    linkerService.openApp(document.URL, application.qDocId, application.sheet);
                                });
                            });

                        },
                        function(b) {
                            console.log("Something went wrong whilst retrieving selection information");
                        }
                    );
                }

                $scope.openStage = function(e) {
                    // stop (prevent page jump to # named anchor - relevant for mobile, scrollPos > 0)
                    e.preventDefault();

                    if($scope.isInEditMode()) return;

                    // update the intersected items:
                    linkerService.getSelectedItemKeys().then(function(currentSelections) {
                        $scope.linkedApps = linkerService.addTransferableSelectionsToApps(currentSelections, $scope.linkedApps);
                    });

                    var stage = "#applinker-stage-" + $scope.$parent.options.id;
                    $(stage).appendTo(".qv-panel-stage");

                    // show it!
                    $(stage).fadeIn();
                }

                //////////////////////////////////////////////////////////////////////////////
                //
                // get the apps based on the configuration data:
                //
                //////////////////////////////////////////////////////////////////////////////
                update();
            }
        ]
    };
});
