# Geospatial Queries with MongoDB

Based on [Spatial Query Language: Part 1](http://mediamaps.ch/wiki/doku.php?id=geoinf15:postgis1).

* [Exercise](#exercise)
* [Node.js Demo](#demo)



<a name="exercise"></a>
## Exercise



### Connect to the database

You will find installation and usage instructions in the [MongoDB Manual](https://docs.mongodb.org/manual/).

Once connected, select a database:

```
use mongodb-geospatial-queries
```



### Create indices

MongoDB uses [GeoJSON](http://geojson.org) to store geographical data.
To perform geospatial queries on a collection containing GeoJSON objects, we must add a [2dsphere index](https://docs.mongodb.org/manual/core/2dsphere/) on the property which will contain the objects.

```
db.test.createIndex({ "geom": "2dsphere" });
```



### Insert sample data

See the [GeoJSON specification](http://geojson.org/geojson-spec.html) on how to write GeoJSON objects.

```
db.test.insert({ "name" : "building1", "geom" : { "type" : "Polygon", "coordinates" : [ [ [ 10, 10 ], [ 20, 40 ], [ 8, 35 ], [ 4, 12 ], [ 10, 10 ] ] ] } })
db.test.insert({ "name" : "building2", "geom" : { "type" : "Polygon", "coordinates" : [ [ [ 40, 10 ], [ 30, 20 ], [ 40, 30 ], [ 35, 40 ], [ 60, 50 ], [ 80, 35 ], [ 60, 20 ], [ 40, 10 ] ] ] } })
db.test.insert({ "name" : "building3", "geom" : { "type" : "Polygon", "coordinates" : [ [ [ 95, 10 ], [ 95, 20 ], [ 135, 20 ], [ 135, 20 ], [ 95, 10 ] ] ] } })

db.test.insert({ "name" : "pedestrian1", "geom" : { "type" : "Point", "coordinates" : [ 70, 10 ] } });
db.test.insert({ "name" : "pedestrian2", "geom" : { "type" : "Point", "coordinates" : [ 30, 30 ] } });
db.test.insert({ "name" : "pedestrian3", "geom" : { "type" : "Point", "coordinates" : [ 70, 35 ] } });
db.test.insert({ "name" : "pedestrian4", "geom" : { "type" : "Point", "coordinates" : [ 60, 35 ] } });

db.test.insert({ "name" : "bordureRoute1", "geom": { "type": "LineString", "coordinates" : [ [ 85, 1 ], [ 85, 50 ] ] } });
db.test.insert({ "name" : "bordureRoute2", "geom": { "type": "LineString", "coordinates" : [ [ 92, 1 ], [ 92, 50 ] ] } });
```



### Get the areas of objects

MongoDB cannot calculate the area of polygons at this time.
It is necessary to use an external library, like [geojson-area](https://www.npmjs.com/package/geojson-area) for Node.js.

[Node.js example](index.js#L164-L177).



### Find the closest object

To find the objects closest to a geographical object, we use MongoDB's [$near](https://docs.mongodb.org/manual/reference/operator/query/near/) operator.
The following query will return the object closest to the coordinates of `pedestrian2`:

```
db.test.find({ "name": { "$ne": "pedestrian2" }, "geom": { "$near": { "$geometry": { "type": "point", "coordinates": [ 30, 30 ] } } } }).limit(1)
```

[Node.js example](index.js#L188-L197).



### Find the objects within

To find the objects within a geographical object, we use MongoDB's [$geoWithin](https://docs.mongodb.org/manual/reference/operator/query/geoWithin/) operator.
The following query will return the objects within the polygon of `building2`:

```
db.test.find({ "name": { "$ne": "building2" }, "geom": { "$geoWithin": { "$geometry": { "type": "Polygon", "coordinates": [ [ [ 40, 10 ], [ 30, 20 ], [ 40, 30 ], [ 35, 40 ], [ 60, 50 ], [ 80, 35 ], [ 60, 20 ], [ 40, 10 ] ] ] } } } });
```

[Node.js example](index.js#L215-L224)



<a name="demo"></a>
## Demo Script

This repository contains a [Node.js script](index.js) that performs the exercise and logs the results on the command line.

It requires [Node.js](https://nodejs.org) to be installed, and [MongoDB](https://www.mongodb.org) to be installed and running on the default port.

To run the exercise on the command line:

```
cd /path/to/repo
npm install
npm start
```
