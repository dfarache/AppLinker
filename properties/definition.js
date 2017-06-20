define(['qlik', 'ng!$q'], function(qlik, $q) {

    var currApp = qlik.currApp(this);

    function getAppList(){
        var defer = $q.defer();

        qlik.getGlobal().getAppList(function(list){
            var appList = list
                .filter(function(app){ return app.qDocId !== currApp.id })
                .map(function(app){
                    return { label: app.qTitle, value: app.qDocId }
                });
            return defer.resolve(appList);
        });
        return defer.promise;
    }

    function getSheetsList(appId){
        var defer = $q.defer();
        var selectedApp = qlik.openApp(appId);

        selectedApp.getAppObjectList('sheet', function(reply){    
            var sheets = reply.qAppObjectList.qItems.map(function(o){
                return { label: o.qData.title, value: o.qInfo.qId };
            });

            return defer.resolve(sheets);
        });
        return defer.promise;
    }

    var appList = getAppList();
    var maxNumberApps = 5;
    var properties = {
        type: "items",
        component: "accordion",
        items: {},
        settings: { uses: 'settings' }
    }

    for(var i=1; i<=maxNumberApps; i++){
        properties.items['linkedApps' + i] = {
            type: 'items',
            label: 'App ' + i,
            items: {}
        }

        properties.items['linkedApps' + i]['items']['app' + i] = {
            type: 'string',
            label: 'Name',
            ref: 'props.app' + i,
            defaultValue: '',
            component: 'dropdown',
            options: function () {
                return appList;
            }
        }

        properties.items['linkedApps' + i]['items']['app' + i + 'Sheet'] = {
            type: 'string',
            label: 'Target sheet ID',
            ref: 'props.app' + i + 'Sheet',
            defaultValue: undefined,
            component: 'dropdown',
            options: function(i){
                return function(props) {
                    return (props['props']['app' + i].length > 0) ? getSheetsList(props['props']['app' + i])
                        : [{ label: '<Select an app>', value: '' }];
                }
            }(i)
        }
    }

    return properties;
});
