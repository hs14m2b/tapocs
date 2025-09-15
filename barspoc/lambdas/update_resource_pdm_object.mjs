import { updateResource, updateResourceWithRetry, postBundle } from "./update_resource_pdm.mjs";

export class update_resource_pdm{
  constructor(){
    this.updateResource = updateResource;
    this.updateResourceWithRetry = updateResourceWithRetry;
    this.postBundle = postBundle;
  }
}
