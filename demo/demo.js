var app = angular.module('demo', ['ngSanitize', 'jsonFormatter']);

app.controller('MainCtrl', function ($scope, $http, JSONFormatterConfig, JSONPath2Regex) {

  $scope.tagclick = function(path) {
    var res = JSONPath({
        json: $scope.complex,
        path: path
    });
  };

  $scope.hoverPreviewEnabled = JSONFormatterConfig.hoverPreviewEnabled;
  $scope.hoverPreviewArrayCount = JSONFormatterConfig.hoverPreviewArrayCount;
  $scope.hoverPreviewFieldCount = JSONFormatterConfig.hoverPreviewFieldCount;
  
  JSONFormatterConfig.tagClickCallback = $scope.tagclick;
  JSONFormatterConfig.highlightTagName = 'Block';
  JSONFormatterConfig.highlightJsonPath = '$.anObject.a';
  
  JSONFormatterConfig.jsonPathToObjectDictionary = [{
    regex: JSONPath2Regex.turn('$.numbers[*]'), 
    object:'Price'
  }, {
    regex: JSONPath2Regex.turn('$.anObject'),
    object: 'BlockArray'
  }, {
    regex: JSONPath2Regex.turn('$.anObject.a'),
    object: 'Block'
  }, {
    regex: JSONPath2Regex.turn('$.numbers[0].good[*]'),
    object: 'Market'
  }];

  $scope.$watch('hoverPreviewEnabled', function(newValue){
    JSONFormatterConfig.hoverPreviewEnabled = newValue;
  });
  $scope.$watch('hoverPreviewArrayCount', function(newValue){
    JSONFormatterConfig.hoverPreviewArrayCount = newValue;
  });
  $scope.$watch('hoverPreviewFieldCount', function(newValue){
    JSONFormatterConfig.hoverPreviewFieldCount = newValue;
  });

  $scope.undef = undefined;
  $scope.textarea = '{}';
  $scope.complex = {
    numbers: [
      {
        good: [
          { name: "234"},
          { name: "345"},
          { name: "456"}
        ]
      },
      2,
      3
    ],
    boolean: true,
    'null': null,
    number: 123,
    anObject: {
      a: 'b',
      c: 'd',
      e: 'f\"'
    },
    string: 'Hello World',
    url: 'https://github.com/mohsen1/json-formatter',
    date: 'Sun Aug 03 2014 20:46:55 GMT-0700 (PDT)',
    func: function add(a,b){return a + b; }
  };

  $scope.randArray1 = [null, null, null].map(function(r) {
    return {value: Math.random()};
  });

  $scope.randArray2 = [null, null, null].map(function(r) {
    return {value: Math.random()};
  });

  $scope.tagclick = function(path){ 
    console.log('aaaaa:' + path);
  };

  $scope.deep = {a:{b:{c:{d:{}}}}};

  $scope.fn = function fn(arg1, /*arg*/arg2) {
    return arg1 + arg2;
  };

  $scope.alternate1 = {o: 1, d: 'Alternate 1', b: []};
  $scope.alternate2 = [1, 'Alternate 2', {b: {}}];

  $scope.fetchGiantJSON = function() {
    $scope.giant = 'Fetching...';
    $http.get('giant.json').then(function (json) {
      $scope.giant = json;
    });
  }

  function Person(name){ this.name = name; }
  $scope.person = new Person('Mohsen');

  $scope.$watch('textarea', function (str){
    var result = {};

    try {
        $scope.textareaJson = JSON.parse(str);
    } catch (e) {}
  });
});
