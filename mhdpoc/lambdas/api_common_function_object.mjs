import { createSignedJwtForAuth,
  getOAuth2AccessToken,
  getOAuth2AccessTokenViaTokenExchange,
  getParamValue,
  getParameterCaseInsensitive,
  getPatientDemographicInfo,
  getSecretValue,
  environmentNeedsAuth,
  nrlEnvironmentMapping,
  getDiagnosticReportFromLocalServer } from './api_common_functions.mjs';

export const apiCommonFunctionObject = {
  createSignedJwtForAuth: createSignedJwtForAuth,
  getOAuth2AccessToken: getOAuth2AccessToken,
  getOAuth2AccessTokenViaTokenExchange: getOAuth2AccessTokenViaTokenExchange,
  getParamValue: getParamValue,
  getParameterCaseInsensitive: getParameterCaseInsensitive,
  getPatientDemographicInfo: getPatientDemographicInfo,
  getSecretValue: getSecretValue,
  environmentNeedsAuth: environmentNeedsAuth,
  nrlEnvironmentMapping: nrlEnvironmentMapping,
  getDiagnosticReportFromLocalServer: getDiagnosticReportFromLocalServer
}
