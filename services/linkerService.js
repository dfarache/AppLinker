define(["angular", "qvangular", "qlik", "./qlikService",], function(angular, qva, qlik) {

    "use strict";

    var settings = {
        URL_SPLIT_FRAGMENT: "/sense/app/"
    };

    qva.service("linkerService", ["$q", "qlikService",
        function(q, qlikService) {

            var thisApp = qlik.currApp(this);

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

                    qlik.getGlobal().getAppList(function(reply) {
                        appItems = _.sortBy(appItems, ['app']);
                        reply = _.sortBy(reply, ['qDocId']);

                        // find intersection of sorted arrays
                        while(i < appItems.length && j < reply.length){
                            if(appItems[i].app > reply[j].qDocId) { j++; }
                            else if(appItems[i].app < reply[j].qDocId) { i++; }
                            else {
                                var qlikApp = reply[j];
                                qlikApp.sheet = appItems[i].sheet;
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

                addTransferableSelectionsToApps: function(currentSelections, linkedApps) {
                    return linkedApps.map(function(currentLinkedApp) {
                        currentLinkedApp.selectedItems = this.intersect(currentSelections, currentLinkedApp.selectableItems);
                        currentLinkedApp.transferableCount = this.getTransferableCount(currentLinkedApp.selectedItems);

                        return currentLinkedApp;
                    }.bind(this));
                },

                getAppLink: function(currentUrl, appId, sheet) {
                    var urlPrefix = currentUrl.substr(0, currentUrl.indexOf(settings.URL_SPLIT_FRAGMENT)) + settings.URL_SPLIT_FRAGMENT;

                    return urlPrefix + encodeURIComponent(appId) + '/sheet/' + sheet + '/state/analysis';
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                getSelectedItemKeys: function() {
                    var deferred = q.defer();
                    var fieldRegexp = /=?\[?([\w\W]*)\]?/i;

                    thisApp.getList("CurrentSelections", function(reply) {
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
                    var selections = {};

                    thisApp.getList("CurrentSelections", function(reply) {
                        var promises = reply.qSelectionObject.qSelections.map(function(sel){
                            return qlikService.createList(thisApp, [sel.qField])
                        });

                        q.all(promises).then(function(values){
                            values.forEach(function(elem) {
                                  var key = Object.keys(elem)[0];
                                  selections[key] = elem[key]
                                      .filter(function(o){ return o[0].qState === 'S'; })
                                      .map(function(o){ return o[0].qText; })
                                      .sort();
                              });                          
                              deferred.resolve(selections);
                        });
                    });

                    return deferred.promise;
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                makeSelections: function(appId, dict) {
                    if(dict.length === 0) { return; }

                    var deferred = q.defer();
                    var remoteApp = qlik.openApp(appId);
                    var promises = Object.keys(dict).map(function(o){ return qlikService.createList(remoteApp, [o])});

                    remoteApp.clearAll();

                    q.all(promises).then(function(remoteAppFields){
                        for(var x=0; x<remoteAppFields.length; x++) {
                            var i=0, j=0;
                            var elemNumbers = [];
                            var field = Object.keys(remoteAppFields[x])[0];
                            var elem = remoteAppFields[x][field]
                                .filter(function(o){
                                    return o[0].qText !== undefined;
                                }).sort(function(a,b){
                                    if(b[0].qText < a[0].qText) { return 1; }
                                    if(b[0].qText > a[0].qText) { return -1; }
                                    else return 0;
                                });

                            while(i < dict[field].length && j < elem.length){
                                if(elem[j][0].qText > dict[field][i]) { i++; }
                                else if(elem[j][0].qText < dict[field][i]) { j++; }
                                else {
                                    elemNumbers.push(elem[j][0].qElemNumber);
                                    i++; j++;
                                }
                            }
                            remoteApp.field(field).select(elemNumbers);
                            deferred.resolve();
                        }
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
