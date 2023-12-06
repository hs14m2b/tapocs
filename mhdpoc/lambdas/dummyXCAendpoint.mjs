import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { deleteDocRef } from './delete_document_ref_sandpit.mjs';
import { sendDocRef } from './post_document_ref_sandpit.mjs';

const REGION = "eu-west-2";
const s3Client = new S3Client({
    apiVersion: '2006-03-01',
    region: REGION
});

const S3BUCKET = process.env['S3BUCKET'];
const MHD_3_MINIMAL_PROFILE = "ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Minimal_DocumentBundle";
const MHD_3_COMPREHENSIVE_PROFILE = "ihe.net/fhir/StructureDefinition/IHE_MHD_Provide_Comprehensive_DocumentBundle";
const MHD_4_MINIMAL_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Minimal.ProvideBundle";
const MHD_4_COMPREHENSIVE_PROFILE = "profiles.ihe.net/ITI/MHD/StructureDefinition/IHE.MHD.Comprehensive.ProvideBundle";
                                      

export const handler = async (event) => {
  console.log(JSON.stringify(event));
    try {
        console.log(event.body);
        
    } catch (error) {
        console.log("caught error " + error.message);
        let response = {
            statusCode: 500,
            "headers": {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "result": error.message })
        }
        return response;
    }
    let response = {
        statusCode: 200,
        "headers": {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "result": "OK" })
    }
    return response;
}

