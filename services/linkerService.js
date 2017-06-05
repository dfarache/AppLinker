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
                    var i=0, j=0;

                    qlik.getAppList(function(reply) {
                        appItems = _.sortBy(appItems, ['app']);
                        reply = _.sortBy(reply, ['qDocName']);

                        // find intersection of sorted arrays
                        while(i < appItems.length && j < reply.length){
                            if(appItems[i].app > reply[j].qDocName) { j++; }
                            if(appItems[i].app < reply[j].qDocName) { i++; }
                            else {
                                var qlikApp = reply[j];
                                qlikApp.thumbnail = (qlikApp.qMeta.thumbnail == null || qlikApp.qMeta.thumbnail.length === 0) ?
                                    '/extensions/AppLinker/img/app.png' : qlikApp.qMeta.thumbnail
                                appsToReturn.push(qlikApp)
                                i++; j++;
                            }
                        }
                        deferred.resolve(appsToReturn);
                    });
                    return deferred.promise;
                },

                addFieldsToApps: function(apps){
                    var promises = apps.map(function(app){
                        var deferred = q.defer();

                        qlik.openApp(app.qDocId).getList('FieldList', function(reply){
                            app.selectableItems = reply.qFieldList.qItems.map(function(o){ return o.qName; }).sort();

                            deferred.resolve(app);
                        });
                        return deferred.promise
                    })
                    return q.all(promises);
                },

                openApp: function(currentUrl, appId, sheet) {

                    var urlPrefix = currentUrl.substr(0, currentUrl.indexOf(settings.URL_SPLIT_FRAGMENT)) + settings.URL_SPLIT_FRAGMENT;

                    window.open(urlPrefix + encodeURIComponent(appId) + '/sheet/' + sheet + '/state/analysis');
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                getSelectedItemKeys: function() {
                    var deferred = q.defer();
                    var app = appCache['currentApp'];
                    var fieldRegexp = /=?\[?([\w\W]*)\]?/i;

                    app.getList("CurrentSelections", function(reply) {
                        var selections = reply.qSelectionObject.qSelections.map(function(sel){
                            return fieldRegexp.exec(sel.qField)[1];
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

                intersect: function(selectedFields, linkedAppFields) {
                    var dict = {};
                    var results = [];

                    if (typeof selectedFields !== "undefined" && typeof linkedAppFields !== "undefined") {

                        for (var i = 0; i < linkedAppFields.length; i++) {
                            dict[linkedAppFields[i]] = true;
                        }
                        for (var j = 0; j < selectedFields.length; j++) {
                            results.push({
                                fieldName : selectedFields[j],
                                isTransferable : (dict[selectedFields[j]] === true)
                            });
                        }

                    }
                    return results;
                },

                getTransferableCount: function(items) {
                    return items.filter(function(o){
                        return o.isTransferable;
                    }).length;
                }
            }
        }
    ])
});
