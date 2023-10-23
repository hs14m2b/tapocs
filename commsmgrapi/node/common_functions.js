const fs = require('fs');
const path = require("path");

module.exports.getItemFromDDB = async function (params, ddb)
{
	return ddb.get(params).promise();
};

module.exports.putItemIntoDDB = async function (params, ddb)
{
	return ddb.put(params).promise();
};

module.exports.getItemsFromDDB = async function (params, ddb)
{
	return ddb.query(params).promise();
};

module.exports.deleteItemFromDDB = async function (params, ddb)
{
	return ddb.delete(params).promise();
};

module.exports.scanItemsFromDDB = async function (params, ddb)
{
	return ddb.scan(params).promise();
};

module.exports.putItemIntoS3 = async function (params, s3)
{
	return s3.putObject(params).promise();
};
