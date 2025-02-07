import type { OpenNextConfig } from '@opennextjs/aws/types/open-next.js';
const config = {
  default: {
    override: {
      wrapper: 'aws-lambda', 
      converter: 'aws-apigw-v2',
    },
  },
  dangerous: {
    disableTagCache: true,
    disableIncrementalCache: true,
    openNextDebug: true
  }
} satisfies OpenNextConfig;
 
export default config;