import * as HelloCdk from '../lib/hello-cdk-stack';
import * as cdk from 'aws-cdk-lib';

import { Template } from 'aws-cdk-lib/assertions';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/hello-cdk-stack.ts
test('S3 Bucket Created', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new HelloCdk.HelloCdkStack(app, 'MyTestStack');
    // THEN
  const template = Template.fromStack(stack);
  //console.log(JSON.stringify(template.toJSON(),null, 4));

  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'mabr8-cdkbucket'
  });
});
