var tracerParser = require('./parsers/tracer');
var methodMetricsParser = require('./parsers/methodMetrics');
var pubMetricsParser = require('./parsers/pubMetrics');
var stateManager = require('./stateManager');
var nodeExporter = require('./parsers/nodeExporter');
const url = require('url');
const { HTTP } = require('meteor/http');
const moment = require('moment');
const { Meteor } = require('meteor/meteor');

var persisters = {
  collection: require('./persisters/collection'),
  trace: require('./persisters/trace')
};

const sendLokiLog = async function (logs, app) {
  entries = [];
  logs.forEach(stack => {
    let entry = {
      "ts": stack.startTime,
      "line": ""
    }

    let line = {
      "type": "error",
      "errorType": stack.type,
      "name": stack.trace && stack.trace.subType ? stack.trace.subType : "trace name not found",
      "message": stack.name || "no message found",
      "userId": stack.trace && stack.trace.userId ? stack.trace.userId : "no userId found",
      "stack": stack.stacks || "no trace found"
    };

    entry.line = JSON.stringify(line);
    entries.push(entry);
  })

  let labels = `{appId="${app._id}",appName="${app.name}",logType="error"}`
  HTTP.post(Meteor.settings.private.lokiUrl, {
    data: {
      "streams": [
        {
          "labels": labels,
          "entries": entries
        }
      ]
    }
  }, function (err) {
    if (err) {
      console.log(err)
    }
  })
}

module.exports = function (app, db) {
  var parsers = [
    {
      type: 'appStats',
      parser: require('./parsers/appStats'),
      persister: persisters.collection('appStats', db)
    },
    {
      type: 'methodRequests',
      parser: tracerParser('methodRequests'),
      persister: persisters.trace('methodTraces', db)
    },
    {
      type: 'pubRequests',
      parser: tracerParser('pubRequests'),
      persister: persisters.trace('pubTraces', db)
    },
    {
      type: 'errors',
      parser: require('./parsers/errorTraces'),
      persister: persisters.trace('errorTraces', db)
    },
    {
      type: 'methodMetrics',
      parser: require('./parsers/methodMetrics'),
      persister: persisters.collection('rawMethodsMetrics', db)
    },
    {
      type: 'pubMetrics',
      parser: require('./parsers/pubMetrics'),
      persister: persisters.collection('rawPubMetrics', db)
    },
    {
      type: 'hotSubs',
      parser: require('./parsers/hotSubs'),
      persister: persisters.collection('rawHotSubs', db)
    },
    {
      type: 'systemMetrics',
      parser: require('./parsers/systemMetrics'),
      persister: persisters.collection('rawSystemMetrics', db)
    },
    {
      type: 'errorMetrics',
      parser: require('./parsers/errorMetrics'),
      persister: persisters.collection('rawErrorMetrics', db)
    }
  ];

  app.use(async function (req, res) {
    const path = (url.parse(req.url).pathname);
    if (req.method == 'POST') {
      parsers.forEach(function (parserInfo) {
        var parsedData = parserInfo.parser(req.body);
        if (parsedData && parsedData.length > 0) {
          parserInfo.persister(req.app, parsedData);

          if (parserInfo.type == 'errors' && Meteor.settings.private.lokiUrl) {

            // track initial state for errors;
            stateManager.setState(db, req.app, 'initialErrorsReceived');

            sendLokiLog(parsedData, req.app);
          }
        }
      });

      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end();
    } else if (req.method == 'GET' && (path == '/metrics' || path == '/engine/metrics')) {
      const metrics = await nodeExporter(req.body);
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end(metrics)
    } else {
      res.writeHead(400);
      res.end('cannot get  \n');
    }
  });
};
