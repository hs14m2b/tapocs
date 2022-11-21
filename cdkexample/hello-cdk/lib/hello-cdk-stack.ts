import * as cdk from 'aws-cdk-lib';

import { aws_s3 as s3 } from 'aws-cdk-lib';

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'mabr8-cdkbucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: 'mabr8-cdkbucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.KMS_MANAGED
    });
  }
}