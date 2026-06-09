import { createSAMLResponse, getSAMLSigningKeys } from './saml_common_functions.mjs';

export const handler = async (event) => {
  console.log('SAMLMetadataProcessor generating SAML metadata document');
  
  const issuer = process.env.ISSUER;
  
  try {
    // Get signing keys for certificate information
    const keys = await getSAMLSigningKeys();
    
    // Extract public key for metadata and strip PEM headers/footers
    // In production, you'd format this as proper X.509 certificate
    let publicKeyRaw = keys.certificate || keys.publicKey;
    
    // Strip PEM header and footer lines
    const publicKeyFormatted = publicKeyRaw
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s+/g, ''); // Remove all whitespace including newlines
    
      console.log('Public key formatted for metadata:', publicKeyFormatted);
    // SAML Metadata XML
    const metadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                     entityID="${issuer}">
  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo>
        <ds:KeyName>SamlSigningKey</ds:KeyName>
        <ds:X509Data>
          <ds:X509Certificate>${publicKeyFormatted}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</md:NameIDFormat>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                           Location="${issuer}/saml2/sso"/>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                           Location="${issuer}/saml2/sso"/>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>`;

    console.log('SAML metadata generated successfully');
    
    return createSAMLResponse(200, metadataXml, {
      'Content-Type': 'application/samlmetadata+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
  } catch (error) {
    console.error('SAML metadata generation error:', error);
    return createSAMLResponse(500, {
      error: 'server_error',
      error_description: 'Failed to generate SAML metadata'
    });
  }
};