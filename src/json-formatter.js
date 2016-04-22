'use strict';

angular.module('jsonFormatter', ['RecursionHelper'])
.factory('JSONPath2Regex', function() {
  return {
    turn: function(jsonpath) {
      jsonpath = jsonpath.replace(/^\$\./img, "\\$.");
      jsonpath = jsonpath.replace(/\./img, "\\.");
      jsonpath = jsonpath.replace(/\[/img, "\\[");
      jsonpath = jsonpath.replace(/\]/img, "\\]");

      jsonpath = jsonpath.replace(/\.\*(\\\.|\\\[|$)/img, ".[^\\.]+$1");
      jsonpath = jsonpath.replace(/\\\[\*\\\]/img, "\\[\\d+\\]");
      jsonpath = '^' + jsonpath + '$';

      return new RegExp(jsonpath, 'im');
    }
  };
})
.provider('JSONFormatterConfig', function JSONFormatterConfigProvider() {

  // Default values for hover preview config
  var hoverPreviewEnabled = false;
  var hoverPreviewArrayCount = 100;
  var hoverPreviewFieldCount = 5;
  var highlightJsonPath = '';
  var highlightTagName = '';  
  var jsonPathToObjectDictionary = [];
  var tagClickCallback = function(path) {};

  return {
    get hoverPreviewEnabled() {
      return hoverPreviewEnabled;
    },
    set hoverPreviewEnabled(value) {
     hoverPreviewEnabled = !!value;
    },

    get hoverPreviewArrayCount() {
      return hoverPreviewArrayCount;
    },
    set hoverPreviewArrayCount(value) {
      hoverPreviewArrayCount = parseInt(value, 10);
    },

    get hoverPreviewFieldCount() {
      return hoverPreviewFieldCount;
    },
    set hoverPreviewFieldCount(value) {
      hoverPreviewFieldCount = parseInt(value, 10);
    },

    get highlightJsonPath() {
      return highlightJsonPath;
    },
    set highlightJsonPath(value) {
      return highlightJsonPath;
    },

    get highlightTagName() {
      return highlightTagName;
    },
    set highlightTagName(value) {
      return highlightTagName;
    },

    get jsonPathToObjectDictionary() {
      return jsonPathToObjectDictionary;
    },
    set jsonPathToObjectDictionary(value) {
      jsonPathToObjectDictionary = value;
    },

    get tagClickCallback() {
      return tagClickCallback;
    },
    set tagClickCallback(value) {
      tagClickCallback = value;
    },

    $get: function () {
      return {
        hoverPreviewEnabled: hoverPreviewEnabled,
        hoverPreviewArrayCount: hoverPreviewArrayCount,
        hoverPreviewFieldCount: hoverPreviewFieldCount,
        highlightJsonPath: highlightJsonPath,
        highlightTagName: highlightTagName,
        jsonPathToObjectDictionary: jsonPathToObjectDictionary,
        tagClickCallback: tagClickCallback,
      };
    }
  };
})
.directive('jsonFormatter', ['RecursionHelper', 'JSONFormatterConfig', function jsonFormatterDirective(RecursionHelper, JSONFormatterConfig) {
  function escapeString(str) {
    return str.replace('"', '\"');
  }

  function isASpecialObject(object, path) {
    return getObjectNameFromConfig(object, path) !== '';
  }

  function getObjectNameFromConfig(object, path) {
    if(JSONFormatterConfig.jsonPathToObjectDictionary
      && JSONFormatterConfig.jsonPathToObjectDictionary.length > 0) {
      
      // console.log("path: " + path);

      for(var i=0;i<JSONFormatterConfig.jsonPathToObjectDictionary.length;i++) {
        var r = JSONFormatterConfig.jsonPathToObjectDictionary[i].regex;
        // console.log("regex: " + r);

        if(r.test(path)) {
          // console.log("pass");
          return JSONFormatterConfig.jsonPathToObjectDictionary[i].object;
        } else {
          // console.log("bad");
        }
      }
    }

    return '';
  }

  // From http://stackoverflow.com/a/332429
  function getObjectName(object, path) {
    if(path !== '') {
      var res = getObjectNameFromConfig(object, path);
      if(res !== '') {
        return res;
      }
    }

    if (object === undefined) {
      return '';
    }
    if (object === null) {
      return 'Object';
    }
    if (typeof object === 'object' && !object.constructor) {
        return 'Object';
    }
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((object).constructor.toString());
    if (results && results.length > 1) {
      return results[1];
    } else {
      return '';
    }
  }

  function getType(object) {
    if (object === null) { return 'null'; }
    return typeof object;
  }

  function getValuePreview (object, value) {
    var type = getType(object);

    if (type === 'null' || type === 'undefined') { return type; }

    if (type === 'string') {
      value = '"' + escapeString(value) + '"';
    }
    if (type === 'function'){

      // Remove content of the function
      return object.toString()
          .replace(/[\r\n]/g, '')
          .replace(/\{.*\}/, '') + '{…}';

    }
    return value;
  }

  function getPreview(object) {
    var value = '';
    if (angular.isObject(object)) {
      value = getObjectName(object, '');
      if (angular.isArray(object))
        value += '[' + object.length + ']';
    } else {
      value = getValuePreview(object, object);
    }
    return value;
  }

  function link(scope) {
    scope.isArray = function () {
      return angular.isArray(scope.json);
    };

    scope.isObject = function() {
      return angular.isObject(scope.json);
    };

    scope.getKeys = function (){
      if (scope.isObject()) {
        return Object.keys(scope.json).map(function(key) {
          if (key === '') { return '""'; }
          return key;
        });
      }
    };

    scope.isKeyHighlight = function() {
      if(JSONFormatterConfig.highlightJsonPath 
        && JSONFormatterConfig.highlightJsonPath === scope.currentpath()) {
        return true;
      } else {
        return false;
      }
    };

    scope.isTagHighlight = function() {
      if(JSONFormatterConfig.highlightTagName 
        && JSONFormatterConfig.highlightTagName === scope.getConstructorName()) {
        return true;
      } else {
        return false;
      }
    };    

    scope.type = getType(scope.json);
    scope.hasKey = typeof scope.key !== 'undefined';
    scope.getConstructorName = function(){
      return getObjectName(scope.json, scope.currentpath());
    };

    if (scope.type === 'string'){

      // Add custom type for date
      if((new Date(scope.json)).toString() !== 'Invalid Date') {
        scope.isDate = true;
      }

      // Add custom type for URLs
      if (scope.json.indexOf('http') === 0) {
        scope.isUrl = true;
      }
    }

    scope.isEmptyObject = function () {
      return scope.getKeys() && !scope.getKeys().length &&
        scope.isOpen && !scope.isArray();
    };

    scope.jsonpath = function() {
      if(!scope.parentkey && !scope.key) {
        return '$';
      }

      if(scope.parentisarray === 'true') {
        return (scope.parentkey + "[" + scope.key + "]").trim();
      } else {
        return (scope.parentkey + "." + scope.key).trim();
      }
    };

    scope.currentpath = function() {
      if(scope.parentisarray === 'true') {
        return (scope.parentkey + "[" + scope.key + "]").trim();
      } else {
        return (scope.parentkey + "." + scope.key).trim();
      }
    };

    scope.isSpecialTag = function() {
      return isASpecialObject(scope.json, scope.currentpath());
    }; 

    // If 'open' attribute is present
    scope.isOpen = !!scope.open;
    scope.toggleOpen = function () {
      // scope.isOpen = !scope.isOpen;
      // handleclick(scope.currentpath());

      // console.log(scope.currentpath());
      // console.log(scope.isSpecialTag());
      // console.log(scope.getConstructorName());

      if(JSONFormatterConfig.tagClickCallback) {
        JSONFormatterConfig.tagClickCallback(scope.currentpath());
      }
    };

    scope.childrenOpen = function () {
      if (scope.open > 1){
        return scope.open - 1;
      }
      return 0;
    };

    scope.openLink = function (isUrl) {
      if(isUrl) {
        window.location.href = scope.json;
      }
    };

    scope.parseValue = function (value){
      return getValuePreview(scope.json, value);
    };

    scope.showThumbnail = function () {
      return !!JSONFormatterConfig.hoverPreviewEnabled && scope.isObject() && !scope.isOpen;
    };

    scope.getThumbnail = function () {
      if (scope.isArray()) {

        // if array length is greater then 100 it shows "Array[101]"
        if (scope.json.length > JSONFormatterConfig.hoverPreviewArrayCount) {
          return 'Array[' + scope.json.length + ']';
        } else {
          return '[' + scope.json.map(getPreview).join(', ') + ']';
        }
      } else {

        var keys = scope.getKeys();

        // the first five keys (like Chrome Developer Tool)
        var narrowKeys = keys.slice(0, JSONFormatterConfig.hoverPreviewFieldCount);

        // json value schematic information
        var kvs = narrowKeys
          .map(function (key) { return key + ':' + getPreview(scope.json[key]); });

        // if keys count greater then 5 then show ellipsis
        var ellipsis = keys.length >= 5 ? '…' : '';

        return '{' + kvs.join(', ') + ellipsis + '}';
      }
    };
  }

  return {
    templateUrl: 'json-formatter.html',
    restrict: 'E',
    replace: true,
    scope: {
      json: '=',
      key: '=',
      open: '=',
      parentkey: '@pkey',
      parentisarray: '@pisarray'
    },
    compile: function(element) {

      // Use the compile function from the RecursionHelper,
      // And return the linking function(s) which it returns
      return RecursionHelper.compile(element, link);
    }
  };
}]);

// Export to CommonJS style imports. Exporting this string makes this valid:
// angular.module('myApp', [require('jsonformatter')]);
if (typeof module === 'object') {
  module.exports = 'jsonFormatter';
}