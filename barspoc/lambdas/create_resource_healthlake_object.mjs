import { createResource, createResourceWithRetry } from "./create_resource_healthlake.mjs";

export class create_resource_healthlake{
  constructor(){
    this.createResource = createResource;
    this.createResourceWithRetry = createResourceWithRetry;
  }
}
