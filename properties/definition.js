define(['qlik', 'ng!$q'], function(qlik, $q) {

    var currApp = qlik.currApp(this);

    function getAppList(){
        var defer = $q.defer();

        qlik.getAppList(function(list){
            var appList = list
                .filter(function(app){ return app.qDocId !== currApp.id })
                .map(function(app){
                    return { label: app.qTitle, value: app.qDocName }
                });
            return defer.resolve(appList);
        });
        return defer.promise;
    }

    function getSheetsList(appId){
        var defer = $q.defer();
        var selectedApp = qlik.openApp(appId);

        selectedApp.getAppObjectList('sheet', function(reply){
            selectedApp.close();
            var sheets = reply.qAppObjectList.qItems.map(function(o){
                return { label: o.qData.title, value: o.qData.title };
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
        items: {
            settings: { uses: 'settings' }
        }
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
            ref: 'app1',
            defaultValue: '',
            component: 'dropdown',
            options: function () {
                return appList;
            }
        }

        properties.items['linkedApps' + i]['items']['app' + i + 'Sheet'] = {
            type: 'string',
            label: 'Target sheet ID',
            ref: 'app1Sheet',
            defaultValue: undefined,
            component: 'dropdown',
            options: function(props) {
                return (props.app1.length > 0) ? getSheetsList(props.app1)
                    : [{ label: '<Select an app>', value: '' }];
            }
        }
    }

    return properties;
});
