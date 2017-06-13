define(["angular", "qvangular", "qlik"], function(angular, qva, qlik) {

    qva.service("qlikService", ['$q', function($q) {
        var service = {};

        service.createList = createList;

        function createList(app, fields){
            var initialDataFetch = [{ qTop : 0, qLeft : 0, qHeight : 10000, qWidth : 1 }];
            var deferred = $q.defer();
            var qTotalData = {};
            qTotalData[fields[0]] = [];

            app.createList({ qDef: { qFieldDefs: fields }, qInitialDataFetch: initialDataFetch }, function(reply){
                var columns = reply.qListObject.qSize.qcx;
                var totalHeight = reply.qListObject.qSize.qcy;
                var pageHeight = 10000;
                var numberOfPages = Math.ceil(totalHeight / pageHeight);

                if (numberOfPages === 1) {
                    var obj = {};
                    obj[fields[0]] = reply.qListObject.qDataPages[0].qMatrix;
                    deferred.resolve(obj);
                } else {
                    var promises = Array.apply(null, new Array(numberOfPages)).map(function (data, index) {
                        var deferred = $q.defer();

                        app.createList({
                            qDef: { qFieldDefs: fields },
                            qInitialDataFetch: [getNextPage(pageHeight, index, columns)]},
                            function(reply){
                                deferred.resolve(reply);
                            })
                        return deferred.promise;
                    }, this);

                    $q.all(promises).then(function(data){
                        for (var j = 0; j < data.length; j++) {
                            for (var k1 = 0; k1 < data[j].qListObject.qDataPages[0].qMatrix.length; k1++) {
                                qTotalData[fields[0]].push(data[j].qListObject.qDataPages[0].qMatrix[k1]);
                            }
                        }
                        deferred.resolve(qTotalData);
                    })
                }
            });
            return deferred.promise;
        }

        return service;
    }]);

    function getNextPage(pageHeight, index, columns){
        return {
            qTop: (pageHeight * index) + index,
            qLeft: 0,
            qWidth: columns,
            qHeight: pageHeight,
            index: index
        }
    }
})
