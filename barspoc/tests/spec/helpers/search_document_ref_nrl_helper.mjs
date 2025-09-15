export const searchDocRef = async (queryStringsJson, odscode, APIENVIRONMENT, APIKEYSECRET, APIKNAMEPARAM) =>
{
  console.log("searchDocRef called with " + JSON.stringify(queryStringsJson) + " " + odscode);
  return {"body": JSON.stringify({"entry": [{"blah": "blaah1"}]})};
}
 
