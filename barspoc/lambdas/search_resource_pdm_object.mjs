import { searchResource, searchResourceWithRetry, getResource, getResourcePatient } from "./search_resource_pdm.mjs";

export class search_resource_pdm{
  constructor(){
    this.searchResource = searchResource;
    this.searchResourceWithRetry = searchResourceWithRetry;
    this.getResource = getResource;
    this.getResourcePatient = getResourcePatient;
  }
}
