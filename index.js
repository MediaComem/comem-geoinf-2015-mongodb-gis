var _ = require('underscore'),
    area = require('geojson-area'),
    async = require('async'),
    mongodb = require('mongodb');

// Set the MONGODB_URI environment variable to customize which database to connect to.
var db,
    uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongodb-geospatial-queries';

// This array contains documents with a unique "name" property and GeoJSON data in the "geom" property.
// This data will be used to run queries for the purposes of the exercise.
// GeoJSON reference: http://geojson.org/geojson-spec.html
var documents = [
  {
    name: 'building1',
    geom: {
      type: 'Polygon',
      coordinates: [ [ [ 10, 10 ], [ 20, 40 ], [ 8, 35 ], [ 4, 12 ], [ 10, 10 ] ] ]
    }
  },
  {
    name: 'building2',
    geom: {
      type: 'Polygon',
      coordinates: [ [ [ 40, 10 ], [ 30, 20 ], [ 40, 30 ], [ 35, 40 ], [ 60, 50 ], [ 80, 35 ], [ 60, 20 ], [ 40, 10 ] ] ]
    }
  },
  {
    name: 'building3',
    geom: {
      type: 'Polygon',
      coordinates: [ [ [ 95, 10 ], [ 95, 20 ], [ 135, 20 ], [ 135, 20 ], [ 95, 10 ] ] ]
    }
  },
  {
    name: 'pedestrian1',
    geom: {
      type: 'Point',
      coordinates: [ 70, 10 ]
    }
  },
  {
    name: 'pedestrian2',
    geom: {
      type: 'Point',
      coordinates: [ 30, 30 ]
    }
  },
  {
    name: 'pedestrian3',
    geom: {
      type: 'Point',
      coordinates: [ 70, 35 ]
    }
  },
  {
    name: 'pedestrian4',
    geom: {
      type: 'Point',
      coordinates: [ 60, 35 ]
    }
  },
  {
    name: 'bordureRoute1',
    geom: {
      type: 'LineString',
      coordinates: [ [ 85, 1 ], [ 85, 50 ] ]
    }
  },
  {
    name: 'bordureRoute2',
    geom: {
      type: 'LineString',
      coordinates: [ [ 92, 1 ], [ 92, 50 ] ]
    }
  }
];

// Find the objects used in the exercise.
var pedestrian2 = _.findWhere(documents, { name: 'pedestrian2' }),
    building2 = _.findWhere(documents, { name: 'building2' });

// Prepare functions for the exercise's examples.
var findClosestObjectToPedestrian2 = _.bind(findClosestObject, null, pedestrian2),
    findObjectsWithinBuilding2 = _.bind(findObjectsWithin, null, building2);

// Perform the exercise and log the results to the console.
// Read on to see the implementation of these functions.
async.waterfall([
  connect,
  clearData,
  ensureIndex,
  insertSampleData,
  findAreas,
  findClosestObjectToPedestrian2,
  findObjectsWithinBuilding2,
], cleanup);





/**
 * Connects to the MongoDB database and stores a reference to it in the "db" variable.
 */
function connect(callback) {
  mongodb.MongoClient.connect(uri, function(err, openedDb) {
    if (err) {
      return callback(err);
    }

    console.log();
    console.log('Connected to MongoDB at ' + uri);
    console.log();

    db = openedDb;
    callback();
  });
}

/**
 * Removes all documents from the test collection.
 */
function clearData(callback) {
  console.log('Removing all documents in collection "test"');
  db.collection('test').remove({}, callback);
}

/**
 * Creates a unique index on the "name" property and a 2dsphere index necessary for geospatial queries on the "geom" property.
 */
function ensureIndex(numberRemoved, callback) {
  console.log('Ensuring unique index on "name" property of collection "test"');
  db.collection('test').ensureIndex({ name: 1 }, { unique: true });
  console.log('Ensuring 2dsphere index on "geom" property of collection "test"');
  db.collection('test').ensureIndex({ geom: '2dsphere' });
  callback();
}

/**
 * Inserts the sample data into the test collection.
 */
function insertSampleData(callback) {

  console.log();
  console.log('Inserting ' + documents.length + ' sample geospatial documents in collection "test":');

  _.each(documents, function(doc) {
    console.log('- ' + JSON.stringify(doc));
  });

  db.collection('test').insertMany(documents, function(err) {
    callback(err);
  });
}

/**
 * Finds all documents that have a GeoJSON Polygon as the "geom" property and calculates their areas.
 */
function findAreas(callback) {

  console.log();
  console.log('Find all polygons and calculating their areas:');

  db.collection('test').find({
    'geom.type': 'Polygon'
  }).toArray(function(err, docs) {
    if (err) {
      return callback(err);
    }

    // use an external library (geojson-area) to calculate the area of polygons, as MongoDB can't do it
    _.each(docs, function(doc) {
      console.log('- area of ' + doc.name + ' = ' + area.geometry(doc.geom) + ' sq. m.');
    });

    callback();
  });
}

/**
 * Finds the object closest to the specified document.
 */
function findClosestObject(doc, callback) {

  console.log();
  console.log('Find closest object to ' + doc.name + ':');

  db.collection('test').findOne({
    name: {
      $ne: doc.name
    },
    geom: {
      $near: {
        $geometry: doc.geom
      }
    }
  }, function(err, closestDoc) {
    if (err) {
      return callback(err);
    }

    console.log('- ' + JSON.stringify(closestDoc));
    callback();
  });
}

/**
 * Finds the objects wtihin the specified document.
 */
function findObjectsWithin(doc, callback) {

  console.log();
  console.log('Find objects within ' + doc.name + ':');

  db.collection('test').find({
    name: {
      $ne: doc.name
    },
    geom: {
      $geoWithin: {
        $geometry: doc.geom
      }
    }
  }).toArray(function(err, docs) {
    if (err) {
      return callback(err);
    }

    _.each(docs, function(doc) {
      console.log('- ' + JSON.stringify(doc));
    });

    callback();
  });
}

/**
 * Logs any error and closes the connection to the database.
 */
function cleanup(err) {
  if (err) {
    console.warn(err);
  } else {
    console.log();
  }

  if (db != null) {
    db.close();
  }
}
