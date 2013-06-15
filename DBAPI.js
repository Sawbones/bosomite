//MONGO DATABASE VARIABLES
var mongo = require('mongodb');
var USERNAME = 'nodejitsu';
var PASSWORD = '13ef928f4c46ffd2a7990c16178a30c8';
var C_STRING = 'mongodb://nodejitsu:13ef928f4c46ffd2a7990c16178a30c8@linus.mongohq.com:10066/nodejitsudb7305191778';

var open = function(callback){
	mongo.Db.connect(C_STRING, function(error, database){
		db = database;
		callback();
	});
};

var count = function(tableName, callback)
{
	db.collection(tableName, function (error, collection){
		collection.count(function(error, count){
			callback(count);
		});
	});
}

var find = function(tableName, options, callback, meta){
	db.collection(tableName, function (error, collection){

		collection.count({}, function(error, count){

			collection.find(options, meta, function(error, cursor){

				cursor.toArray(function(error, data){

					var packet = { count : count, data : data};
					callback(packet);
				});
			});
		});
	});
};

var insert = function(tableName, options, callback){
	db.collection(tableName, function (error, collection){
		collection.count(function(error, count){
			options.id = (count + 1);
			collection.insert(options, callback);
		});
		
	});
};

var remove = function(tableName){
	db.collection(tableName, function(error, collection){
		collection.remove({}, {}, function(){

		});
	});
}

var save = function(tableName, data, callback){
	db.collection(tableName, function(error, collection){
		collection.save(data, callback);
	});
}

var random = function(tableName, options, callback){
	db.collection(tableName, function(error, collection){
		collection.find().count(function(error, count){

			var randomIndex = Math.floor((Math.random() * count) + 1);
			collection.find().limit(-1).skip(randomIndex, function(error, cursor){
				cursor.toArray(callback);
			});
		});
	});
};

module.exports.open = open;
module.exports.find = find;
module.exports.insert = insert;
module.exports.random = random;
module.exports.remove = remove;
module.exports.count = count;
module.exports.save = save;