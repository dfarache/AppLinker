define(["angular", "qvangular", "qlik", "./qlikService",], function(angular, qva, qlik) {

    "use strict";

    var settings = {
        URL_SPLIT_FRAGMENT: "/sense/app/"
    };

    qva.service("linkerService", ["$q", "qlikService",
        function(q, qlikService) {

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
                            else if(appItems[i].app < reply[j].qDocName) { i++; }
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
                    var app = appCache['currentApp'];
                    var selections = [];

                    app.getList("CurrentSelections", function(reply) {
                        var promises = reply.qSelectionObject.qSelections.map(function(sel){
                            return qlikService.createList(app, [sel.qField], 1000)
                        });

                        q.all(promises).then(function(values){                          
                            values.forEach(function(elem) {
                                  var key = Object.keys(elem)[0];
                                  selections.push({
                                      key: key,
                                      values: elem[key]
                                          .filter(function(o){ return o[0].qState === 'S'; })
                                          .map(function(o){ return o[0].qText; })
                                  });
                              });
                              deferred.resolve(selections);
                        });
                    });

                    return deferred.promise;
                },
                ///////////////////////////////////////////////////////////////////////////////////////////
                makeSelections: function(appId, dict) {
                    if(dict.length === 0) { return; }

                    var remoteApp = qlik.openApp(appId);
                    remoteApp.clearAll();

                    dict.forEach(function(info){
                        var field = remoteApp.field(info.key);
                        field.selectValues(info.values);
                    });
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
