import { BatchWriteCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const DEFAULTEXPIRY = 3600;
export const REQITEM = "REQITEM";
export const REQBATCH = "REQBATCH";
export const REQSUBBATCH = "REQSUBBATCH";
export const ROUTEPLAN = "ROUTEPLAN";
export const RPCALLBACK = "RPCALLBACK";
export const ACTIVE = "ACTIVE";
export const PENDING = "PENDING";
export const FAILED = "FAILED";
export const COMPLETED = "COMPLETED";
export const DELIVERED = "DELIVERED";
export const SENT = "SENT";
export const TEMPORARY_FAILURE = "TEMPORARY-FAILURE";
export const NOTREQUIRED = "NOTREQUIRED";
export const ACCEPTED = "ACCEPTED";
export const ENRICHED = "ENRICHED";
export const SQSBATCHSIZE = 10;
export const DDBBATCHSIZE = 25;
export const REGION = "eu-west-2";
export const ANALYTICSPREFIX = "analytics/";
export const DDBSCALINGERRORS = ["ThrottlingException",
    "ProvisionedThroughputExceededException",
    "ProvisionedThroughputExceeded",
    "RequestLimitExceeded",
    "LimitExceededException"];
export const DDBVALIDATIONERRORS = ["ValidationException", "ConditionalCheckFailedException"];

function sleep(ms) {
    console.log("sleeping for " + ms + "ms");
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

export const putItemsDDB = async (items, tableName, ddbDocClient) => {
    let params = {
        "RequestItems": {}
    };
    params.RequestItems[tableName] = [];
    for (let item of items) {
        try {
            let requestDetails ={ "PutRequest": {"Item": item}}
            params.RequestItems[tableName].push(requestDetails);
        } catch (error) {
            console.log("Caught error processing row " + item);
        }
    }
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new BatchWriteCommand(params));
            console.log("Success - items added/updated to table", data);
            in_error = false;
            return data;
        } catch (error) {
            console.log("Failed - items NOT added/updated to table", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
        
    }
} 

export const putUnprocessedItemsDDB = async (items, tableName, ddbDocClient) => {
    let params = {
        "RequestItems": {}
    };
    params.RequestItems[tableName] = items;
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new BatchWriteCommand(params));
            console.log("Success - items added to table", data);
            in_error = false;
            return data;
        } catch (error) {
            console.log("Failed - items NOT added/updated to table", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
    }
}

export const putItemDDB = async (item, tableName, ddbDocClient) => {
    let params = {
        "TableName": tableName,
        "Item": item
    };
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new PutCommand(params));
            console.log("Success - item added to table", data);
            in_error = false;
            return data;
        }
        catch (error) {
            console.log("Failed - item NOT updated to table", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
    }
}

export const updateItemDDB = async (params, ddbDocClient) => {
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new UpdateCommand(params));
            console.log("Success - item updated", data);
            in_error = false;
            return data;
        }
        catch (error) {
            console.log("Failed - item NOT updated to table", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
    }
} 

export const runQueryDDB = async (queryParams, ddbDocClient) => {
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            console.log("params are " + JSON.stringify(queryParams));
            let data = await ddbDocClient.send(new QueryCommand(queryParams));
            console.log("got response");
            in_error = false;
            return data.Items;
        }
        catch (error) {
            console.log("Failed - query not processed", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
    }
}

export const putItemWithConditionDDB = async (params, ddbDocClient) => {
    let in_error = true;
    let iteration = 0;
    while (in_error)
    {
        iteration += 1;
        try {
            const data = await ddbDocClient.send(new PutCommand(params));
            console.log("Success - item added to table", data);
            in_error = false;
            return data;
        }
        catch (error) {
            console.log("Failed - item NOT updated to table", error.name, error.message);
            if (DDBSCALINGERRORS.includes(error.name)) {
                console.log("this is a scaling error so backing off for 1 second")
                await sleep(1000 * iteration);
            }
            else {
                console.log("not a scaling error so throwing exception");
                throw error;
            }
        }
    }
}
