var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/testapp';

// 用于 MongoDB 的数据持久化
function MongoPersistence() {
}

MongoPersistence.prototype.insert = function (data) {
	'use strict'
	MongoClient.connect(url,function(err,db) {
		var insertDocuments = function(db,callback) {
			var dbase = db.db('testapp'),
			    collection = dbase.collection("users");

			collection.insert(data,function(err,result) {
				callback(result);
			});
		};
		insertDocuments(db,function() {
			db.close();
		});
	});
};
MongoPersistence.prototype.find = function (queryOptions, queryCallback) {
	'use strict'
	MongoClient.connect(url,function(err,db) {
		var findDocuments = function(db, query, callback) {
			var dbase = db.db('testapp'),
			    collection = dbase.collection("users");

			collection.find(query).toArray(function(err,docs) {
				callback(docs);
			});
		};

		findDocuments(db,queryOptions,function(result) {
			db.close();
			queryCallback(result);
		});
	});
};
// 更新设备，例如修改密码，房间变更，查找指定的设备，更新指定的设备数据等
MongoPersistence.prototype.update = function (findQuery, updateQuery) {
	'use strict'
	MongoClient.connect(url,function(err,db) {
		var updateDocument = function(db,callback) {
			var dbase = db.db('testapp'),
			    collection = dbase.collection("users");
			console.log(findQuery);
			console.log(updateQuery);
			
			collection.update(findQuery, updateQuery, function(err,result) {
				
				callback();
			});
		};
		updateDocument(db,function() {
			db.close();
		});
	});
};

// 添加设备
MongoPersistence.prototype.addDevices = function (data) {
	'use strict'
	MongoClient.connect(url,function(err,db) {
		var updateDocument = function(db,callback) {
			var dbase = db.db('testapp'),
			    collection = dbase.collection("users");
			console.log("data" + data.devices);
			collection.update({"user_id": data.user_id},{$push:{devices:data.devices}},function(err,result) {
				callback();
			});
		};
		updateDocument(db,function() {
			db.close();
		});
	});
};

// 查找指定的(房间设备/设备id)，并返回指定的数据
MongoPersistence.prototype.findOrder = function (queryOptions, queryCallback) {
	'use strict'
	MongoClient.connect(url,function(err,db) {
		var findDocuments = function(db, queryOptions, callback) {
			var dbase = db.db('testapp'),
			    collection = dbase.collection("users"),
			    query = queryOptions.query,
			    order = queryOptions.order,
			    updatestr = "{\"$project\": {\"_id\": \"0\", \"control_id\": \"$control_id\", \"user_id\": \"$user_id\", \"rooms\": \"$rooms\", \"devices\": {\"$filter\": {\"input\": \"$devices\", \"as\": \"devices\", \"cond\": {\"$eq\": [\"$$devices." + order + "\", \"" + query + "\"]}}}}}",
                findStr = "{ \"$match\": { \"devices." + order + "\" : \"" + query + "\" } }";

            findStr = JSON.parse(findStr);
            updatestr = JSON.parse(updatestr);

            console.log(findStr);
            console.log(updatestr);
            
			collection.aggregate([findStr, updatestr]).toArray(function(err,docs) {
				callback(docs);
			}) ;
			
		};

		findDocuments(db,queryOptions,function(result) {
			db.close();
			queryCallback(result);
		});
	});
};

// 删除设备，$unset， 还没写

exports.MongoPersistence = MongoPersistence;
