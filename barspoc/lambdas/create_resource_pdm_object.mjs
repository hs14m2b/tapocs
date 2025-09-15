import { createResource, createResourceWithRetry } from "./create_resource_pdm.mjs";

export class create_resource_pdm{
  constructor(){
    this.createResource = createResource;
    this.createResourceWithRetry = createResourceWithRetry;
  }
}
