import { deleteResource, deleteResourceWithRetry } from "./delete_resource_pdm.mjs";

export class delete_resource_pdm{
  constructor(){
    this.deleteResource = deleteResource;
    this.deleteResourceWithRetry = deleteResourceWithRetry;
  }
}
