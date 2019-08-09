let cache = {};

let PUB_KEYS = [
  'subs',
  'unsubs',
  'resTime',
  'activeSubs',
  'activeDocs',
  'avgDocSize',
  'avgObserverRatio',
  'lifeTime',
  'totalObserverHandlers',
  'cachedObservers',
  'createdObservers',
  'deletedObservers',
  'errors',
  'polledDocuments',
  'observerLifetime',
  "observerLifetime",
  "oplogUpdatedDocuments",
  "oplogInsertedDocuments",
  "oplogDeletedDocuments",
  "liveAddedDocuments",
  "liveChangedDocuments",
  "liveRemovedDocuments",
  "initiallyAddedDocuments",
  "polledDocSize",
  "fetchedDocSize",
  "initiallyFetchedDocSize",
  "liveFetchedDocSize",
  "initiallySentMsgSize",
  "liveSentMsgSize"
]

let METHOD_KEYS = [
  "subShard", ,
  "count",
  "errors",
  "fetchedDocSize",
  "sentMsgSize",
  "wait",
  "db",
  "http",
  "email",
  "async",
  "compute",
  "total",
]

let SYSTEM_KEYS = [
  "count",
  "subShard",
  "sessions",
  "eventLoopTime",
  "eventLoopCount",
  "totalTime",
  "memory",
  "loadAverage",
  "pcpu",
  "cputime",
  "newSessions",
  "gcScavengeCount",
  "gcScavengeDuration",
  "gcFullCount",
  "gcFullDuration",
  "pctEvloopBlock"
]

let ERROR_KEYS = [
  "count"
]

module.exports = async function (data) {
  const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;

  // fetch cache from db if the server doesn't have a local copy
  var nodeExporterCollection = db.collection('nodeExporter');
  if (Object.keys(cache).length == 0) {
    let dbCache = await nodeExporterCollection.find({ appId: data.appId }).limit(1).toArray();
    if (dbCache && dbCache[0]) {
      console.warn('Updating node exporter from db cache...');
      cache = JSON.parse(dbCache[0].rawData);
    }
  }

  // reset all of the cached values to 0 for the next loop
  Object.keys(cache).forEach(key => {
    cache[key] = 0;
  });

  // set the new cache to the default caches values
  let newCache = cache;

  // publication metrics
  var pubMetricsCollection = db.collection('pubMetrics');
  let pubMetrics = pubMetricsCollection.find({
    'value.appId': data.appId,
    'value.startTime': {
      $gte: moment().subtract(15, 'seconds').toDate()
    }
  });

  pubMetrics = await pubMetrics.toArray();
  pubMetrics.forEach(doc => {
    PUB_KEYS.forEach((key) => {
      if (newCache[key]) {
        newCache[key] += (doc.value[key] || 0);
      } else {
        newCache[`pub_${key}{label=${doc.value.pub}}`] = doc.value[key] || 0;
      }
    });
  })
  // ---------------------------------------------

  // method metrics
  var methodsMetricsCollection = db.collection('methodsMetrics');
  let methodMetrics = methodsMetricsCollection.find({
    'value.appId': data.appId,
    'value.startTime': {
      $gte: moment().subtract(15, 'seconds').toDate()
    }
  });

  methodMetrics = await methodMetrics.toArray();
  methodMetrics.forEach(doc => {
    METHOD_KEYS.forEach((key) => {
      if (newCache[key]) {
        newCache[key] += (doc.value[key] || 0);
      } else {
        newCache[`method_${key}{label=${doc.value.name}}`] = doc.value[key] || 0;
      }
    });
  })
  // ---------------------------------------------

  // system metrics
  var systemMetricsCollection = db.collection('systemMetrics');
  let systemMetrics = systemMetricsCollection.find({
    'value.appId': data.appId,
    'value.startTime': {
      $gte: moment().subtract(15, 'seconds').toDate()
    }
  });

  systemMetrics = await systemMetrics.toArray();
  systemMetrics.forEach(doc => {
    SYSTEM_KEYS.forEach((key) => {
      if (newCache[key]) {
        newCache[key] += (doc.value[key] || 0);
      } else {
        newCache[`system_${key}{label=${doc.value.host}}`] = doc.value[key] || 0;
      }
    });
  })
  // ---------------------------------------------

  // error metrics
  var errorMetricsCollection = db.collection('errorMetrics');
  let errorMetrics = errorMetricsCollection.find({
    'value.appId': data.appId,
    'value.startTime': {
      $gte: moment().subtract(15, 'seconds').toDate()
    }
  });

  errorMetrics = await errorMetrics.toArray();
  errorMetrics.forEach(doc => {
    ERROR_KEYS.forEach((key) => {
      if (newCache[key]) {
        newCache[key] += (doc.value[key] || 0);
      } else {
        newCache[`errors_${doc.value.type}_${key}{label=${doc.value.name}}`] = doc.value[key] || 0;
      }
    });
  })
  // ---------------------------------------------

  // insert node exporter data into db;
  nodeExporterCollection.update({
    appId: data.appId
  }, {
      $set: {
        updatedAt: (new Date()).toISOString(),
        rawData: JSON.stringify(newCache)
      },
    },
    {
      upsert: true
    });

  // order in array
  let resArray = [];
  Object.keys(newCache).forEach(key => {
    resArray.push(`${key} ${newCache[key]}`);
  });

  // sort alphabetically and create proper node exporter string
  let res = "";
  resArray.sort((a, b) => {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
  }).forEach(str => {
    res += `${str}\n`;
  });

  // set the local cache
  cache = newCache;

  return res;
}
