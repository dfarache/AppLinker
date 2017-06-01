define(["angular", "qvangular", "qlik"], function(angular, qva, qlik) {

    "use strict";

    var settings = {
        URL_SPLIT_FRAGMENT: "/sense/app/"
    };

    qva.service("linkerService", ["$q",
        function(q) {

            var appCache = {};
            appCache['currentApp'] = qlik.currApp();

            var config = {
                host: window.location.hostname,
                prefix: "/",
                port: window.location.port,
                isSecure: window.location.protocol === "https:",
                openWithoutData: true
            };

            return {

                getAppItems: function(apps) {
                    var appsToFind = [];
                    var maxNumberApps = 5;
                    var app, sheet;

                    for(var i=1; i<=maxNumberApps; i++) {
                          app = apps['app' + i];
                          sheet = apps['app' + i + 'Sheet'];

                          if(app !== undefined && app.length > 0 && sheet.length > 0){
                              appsToFind.push({ app: app, sheet: sheet });
                          }
                    }
                    return appsToFind;
                },

                getApps: function(apps, appItems) {
                    var appsToReturn = []
                    var deferred = q.defer();
                    var responseCount = 0;

                    // get the apps list from the API:
                    qlik.getAppList(function(reply) {

                        // and now loop through to see if any are the ones we want:
                        angular.forEach(appItems, function(currentAppToFind, key) {

                            // does it exist?
                            angular.forEach(reply, function(qlikApp, qlikAppKey) {

                                if (currentAppToFind.app === qlikApp.qTitle) {

                                    // assign an image path for the app:
                                    if (typeof qlikApp.qMeta.thumbnail !== 'undefined' && qlikApp.qMeta.thumbnail !== "") {
                                        qlikApp.thumbnail = qlikApp.qMeta.thumbnail;
                                    } else {
                                        qlikApp.thumbnail = '/extensions/AppLinker/img/app.png';
                                    }

                                    // add the sheet:
                                    qlikApp.sheet = currentAppToFind.sheet;

                                    appsToReturn.push(qlikApp);
                                }
                            });
                        });

                        // now get the details for the found apps:
                        ///////////////////////////////////////////////////////////////////////////////////////////

                        angular.forEach(appsToReturn, function(qlikApp, qlikAppKey) {

                            // get the apps and cache:
                            //var app = qlik.openApp(qlikApp.qDocId, config);

                            var app = qlik.openApp(qlikApp.qDocId);

                            appCache[qlikApp.qDocId] = app;
                        });

                        // now get details:
                        angular.forEach(appsToReturn, function(qlikApp, qlikAppKey){
                            var items = [];

                            appCache[qlikApp.qDocId].getList("FieldList", function(reply) {

                                angular.forEach(reply.qFieldList.qItems, function(item, key) {
                                    items.push(item.qName);

                                   // console.log(item.qName);
                                });

                              //  console.log("************************************");

                                qlikApp.selectableItems = items;

                                responseCount++;

                                if (responseCount == appsToReturn.length) {
                                    deferred.resolve(appsToReturn);
                                }
                            });
                        });

                        ///////////////////////////////////////////////////////////////////////////////////////////
                    });

                    return deferred.promise;
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                openApp: function(currentUrl, appId, sheet) {

                    var urlPrefix = currentUrl.substr(0, currentUrl.indexOf(settings.URL_SPLIT_FRAGMENT)) + settings.URL_SPLIT_FRAGMENT;

                    window.open(urlPrefix + encodeURIComponent(appId) + '/sheet/' + sheet + '/state/analysis');
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                getSelectedItemKeys: function() {

                    var deferred = q.defer();
                    var app = appCache['currentApp'],
                        //qlik.currApp(),
                        dict = [];

                    app.getList("CurrentSelections", function(reply) {

                        var selections = [];

                        // this gives us the name of the field:
                        angular.forEach(reply.qSelectionObject.qSelections, function(value, key) {

                            var qField = value.qField;

                            if( qField.indexOf("=[", 0) == 0) {
                                // remove first two characters and last:
                                // =[Qlik.Partner] => Qlik.Partner
                                qField = qField.substring(2, qField.length - 1);
                            }

                            selections.push(qField);
                        });

                        deferred.resolve(selections);

                    });

                    return deferred.promise;
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                getSelections: function() {

                    var deferred = q.defer();
                    var app = appCache['currentApp'],
                        //qlik.currApp(),
                        dict = [];

                    app.getList("CurrentSelections", function(reply) {

                        var selections = [];

                        // this gives us the name of the field:
                        angular.forEach(reply.qSelectionObject.qSelections, function(value, key) {
                            selections.push(value.qField);

                            //console.log("Selection: ", value.qField);
                        });


                        // are there any selections?:
                        if (selections.length === 0) {
                            // nothing to return since there are no selections:
                            deferred.resolve(undefined);
                        } else {

                            var responseCount = 0;

                            angular.forEach(selections, function(currentFieldName, i) {

                                var currentSelectedValues = [];
                                var qFieldDefs = [];
                                qFieldDefs.push(currentFieldName);

                                var query = {
                                    "qDef": {
                                        "qFieldDefs": qFieldDefs
                                    },
                                    "qInitialDataFetch": [{
                                        qTop: 0,
                                        qLeft: 0,
                                        qHeight: 500,
                                        qWidth: 1
                                    }]
                                };

                                app.createList(query, function(reply) {

                                    responseCount++;

                                    $.each(reply.qListObject.qDataPages[0].qMatrix, function(key, value) {

                                        if (value[0].qState === "S") {
                                            currentSelectedValues.push(value[0].qText);
                                        }
                                    });

                                    dict.push({
                                        key: currentFieldName,
                                        values: currentSelectedValues
                                    });

                                    if (responseCount == selections.length) {

                                        // return the dictionary:
                                        deferred.resolve(dict);
                                    }
                                });
                            });
                        }
                    });

                    return deferred.promise;
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                makeSelections: function(appId, dict) {

                    var deferred = q.defer();

                    config.identity = Math.random().toString(36).substring(2, 10);
                    var appSelections = qlik.openApp(appId, config);

                    console.log("Opening app with config of: ", config);
                    //var appSelections = appCache[appId];

                    if (dict == null)
                        return;

                    var responseCount = 0;
                    var selectionDict = [];

                    // initially, clear all selections in the app:
                    appSelections.clearAll();

                    // we have a dict, so work with it:
                    // array of:
                    // { key : 'Country', values : ['China', 'Russian Federation'] }
                    angular.forEach(dict, function(value, key) {

                        // get the field list for the current value.key (which is the selection identifier):
                        var qFieldDefs = [];
                        qFieldDefs.push(value.key);

                        var query = {
                            "qDef": {
                                "qFieldDefs": qFieldDefs
                            },
                            "qInitialDataFetch": [{
                                qTop: 0,
                                qLeft: 0,
                                qHeight: 500,
                                qWidth: 1
                            }]
                        };

                        appSelections.createList(query, function(reply) {

                            responseCount++;

                            var qElemNumbers = [];

                            $.each(reply.qListObject.qDataPages[0].qMatrix, function(listKey, listValue) {

                                $.each(value.values, function(selectionKey, selectionValue) {

                                    if (selectionValue === listValue[0].qText) {
                                        qElemNumbers.push(listValue[0].qElemNumber);
                                    }

                                });
                            });

                            selectionDict.push({
                                key: value.key,
                                values: qElemNumbers
                            });

                            if (responseCount == dict.length) {

                                $.each(selectionDict, function(i, currentFieldDetails) {
                                    appSelections.field(currentFieldDetails.key).select(currentFieldDetails.values, true, true);
                                });

                                // all done:
                                deferred.resolve();

                            }
                        });
                    });

                    return deferred.promise;
                },

                intersect: function(a, b) {
                    var d = {};
                    var results = [];

                    if (typeof a !== "undefined" && typeof b !== "undefined") {

                        for (var i = 0; i < b.length; i++) {
                            d[b[i]] = true;
                        }
                        for (var j = 0; j < a.length; j++) {
                            if (d[a[j]]){

                                //console.log("Intersected: ", a[j]);

                                results.push({
                                    fieldName : a[j],
                                    isTransferable : true
                                });

                            } else {

                                //console.log("Not intersected: ", a[j]);

                                results.push({
                                    fieldName : a[j],
                                    isTransferable : false
                                });

                            }
                        }

                    }

                    return results;
                },

                getTransferableCount: function(items) {

                    var transferableCount = 0;

                    for(var itemLoop = 0; itemLoop < items.length; itemLoop++)
                    {
                        if( items[itemLoop].isTransferable === true){
                            transferableCount += 1;
                        }
                    }

                    return transferableCount;
                }
            }
        }
    ])
});
