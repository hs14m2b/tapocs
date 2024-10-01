console.log('Loading function');
import { postMessageToFDPStream } from './api_common_functions.mjs';
const access_token = "";
const FDP_STREAM_FQDN = "solutionexchange.federateddataplatform.nhs.uk";
const FDP_STREAM_PATH = "/stream-proxy/api/streams/ri.foundry.main.dataset.6fe5a3fa-6711-4fd5-80d1-178ecfa3ab41/views/ri.foundry-streaming.main.view.3ef0d360-5842-45ee-8a59-bfde517906d4/jsonRecords";

export const handler = async (event) => {
    console.log(JSON.stringify(event));
    /* Process the list of records and transform them */
    const output = [];

    try {
        const array_for_fdp = event.records.map((record) => ({"value": record}));
        console.log("array of records to send to FDP is " + JSON.stringify(array_for_fdp));
        let fdp_result = await postMessageToFDPStream(array_for_fdp, access_token, FDP_STREAM_FQDN, FDP_STREAM_PATH);
        console.log("Result from sending to FDP is " + JSON.stringify(fdp_result));
        output = event.records.map((record)=>({
            /* This transformation is the "identity" transformation, the data is left intact */
            recordId: record.recordId,
            result: "Ok",
            kafkaRecordValue: record.kafkaRecordValue,
        }));
        return { records: output };
    } catch (error) {
        console.log("Failed to process record in batch form...");
        console.log(error);
    }

    for (let record of event.records){
        let processing_result = await processKafkaRecord(record);
        output.push(processing_result);
    }
    console.log(`Processing completed.  Successful records ${output.length}.`);
    console.log(JSON.stringify(output));
    return { records: output };
};

async function processKafkaRecord(record){
    let post_array = [{"value": record}];
    let post_array_string = JSON.stringify(post_array).replace(/(\r\n|\n|\r)/gm, "");
    console.log("Processing record: " + post_array_string);
    let result="Ok";
    try {
        let fdp_result = await postMessageToFDPStream(post_array, access_token, FDP_STREAM_FQDN, FDP_STREAM_PATH);
        console.log("Result from sending to FDP is " + JSON.stringify(fdp_result));
    } catch (error) {
        console.log(error);
        result = "Dropped";
    }
    let returnRecord = {
        /* This transformation is the "identity" transformation, the data is left intact */
        recordId: record.recordId,
        result: result,
        kafkaRecordValue: record.kafkaRecordValue,
    }
    return returnRecord;
}