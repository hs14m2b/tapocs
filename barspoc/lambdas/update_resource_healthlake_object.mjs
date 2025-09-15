import { updateResource, updateResourceWithRetry } from "./update_resource_healthlake.mjs";

export class update_resource_healthlake{
  constructor(){
    this.updateResource = updateResource;
    this.updateResourceWithRetry = updateResourceWithRetry;
  }
}
