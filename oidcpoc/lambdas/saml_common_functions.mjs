import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { SignedXml } from 'xml-crypto';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const REGION = process.env.AWS_REGION || "eu-west-2";
const secretsClient = new SecretsManagerClient({ region: REGION });

/**
 * Get signing keys for SAML from AWS Secrets Manager
 */
export const getSAMLSigningKeys = async () => {
  const secretName = process.env.PRIVATEKEYSECRET;
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    const secret = JSON.parse(response.SecretString);
    
    return {
      privateKey: secret.private_key,
      publicKey: secret.public_key,
      certificate: secret.public_cert || secret.public_key
    };
  } catch (error) {
    console.error('Error retrieving SAML signing keys:', error);
    throw new Error('Failed to retrieve SAML signing keys');
  }
};

/**
 * Sign SAML Assertion XML using XML Digital Signature
 */
export const signSAMLAssertion = async (assertionXml, keys) => {
  console.log('🔐 Starting SAML assertion signing process...');
  
  try {
    // Debug: Input validation
    console.log('📝 Input validation:');
    console.log('  - assertionXml length:', assertionXml ? assertionXml.length : 'null');
    console.log('  - assertionXml preview:', assertionXml ? assertionXml.substring(0, 200) + '...' : 'null');
    console.log('  - keys provided:', keys ? 'yes' : 'no');
    
    if (!keys) {
      console.log('🔑 No keys provided, fetching from AWS Secrets Manager...');
      keys = await getSAMLSigningKeys();
      console.log('✅ Keys retrieved from AWS Secrets Manager');
    }
    
    // Debug: Key validation
    console.log('🔍 Key validation:');
    console.log('  - privateKey present:', keys.privateKey ? 'yes' : 'no');
    console.log('  - privateKey length:', keys.privateKey ? keys.privateKey.length : 0);
    console.log('  - privateKey starts with:', keys.privateKey ? keys.privateKey.substring(0, 50) : 'null');
    console.log('  - privateKey ends with:', keys.privateKey ? keys.privateKey.substring(keys.privateKey.length - 50) : 'null');
    console.log('  - publicKey present:', keys.publicKey ? 'yes' : 'no');
    console.log('  - certificate present:', keys.certificate ? 'yes' : 'no');
    
    // Debug: Detailed key format analysis
    if (keys.privateKey) {
      console.log('🔍 Private key format analysis:');
      console.log('  - Contains BEGIN PRIVATE KEY:', keys.privateKey.includes('-----BEGIN PRIVATE KEY-----'));
      console.log('  - Contains BEGIN RSA PRIVATE KEY:', keys.privateKey.includes('-----BEGIN RSA PRIVATE KEY-----'));
      console.log('  - Contains BEGIN ENCRYPTED PRIVATE KEY:', keys.privateKey.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----'));
      console.log('  - Contains newlines:', keys.privateKey.includes('\n'));
      console.log('  - Contains carriage returns:', keys.privateKey.includes('\r'));
      console.log('  - Contains Proc-Type (encrypted):', keys.privateKey.includes('Proc-Type:'));
      console.log('  - Contains DEK-Info (encrypted):', keys.privateKey.includes('DEK-Info:'));
      
      // Check if key needs format conversion
      let processedPrivateKey = keys.privateKey;
      
      // Convert PKCS#1 to PKCS#8 if needed using Node.js crypto
      if (keys.privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
        console.log('🔄 Converting PKCS#1 to PKCS#8 format using Node.js crypto...');
        try {
          const keyObject = crypto.createPrivateKey(keys.privateKey);
          processedPrivateKey = keyObject.export({
            type: 'pkcs8',
            format: 'pem'
          });
          console.log('✅ Key format converted to PKCS#8 using crypto module');
          console.log('  - New key starts with:', processedPrivateKey.substring(0, 50));
        } catch (conversionError) {
          console.error('❌ Key conversion failed:', conversionError.message);
          // Fallback to manual conversion
          try {
            const keyBody = keys.privateKey
              .replace('-----BEGIN RSA PRIVATE KEY-----', '')
              .replace('-----END RSA PRIVATE KEY-----', '')
              .replace(/\s+/g, '');
            
            processedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${keyBody.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
            console.log('⚠️  Using fallback manual conversion');
          } catch (fallbackError) {
            console.error('❌ Fallback conversion also failed:', fallbackError.message);
          }
        }
      }
      
      // Validate key format using crypto module
      try {
        console.log('🔍 Validating private key using crypto module...');
        const keyObject = crypto.createPrivateKey(processedPrivateKey);
        console.log('✅ Private key validation successful');
        console.log('  - Key type:', keyObject.asymmetricKeyType);
        console.log('  - Key size:', keyObject.asymmetricKeySize);
      } catch (validationError) {
        console.error('❌ Private key validation failed:', validationError.message);
        console.error('  - This suggests the key is not a valid RSA private key');
        throw new Error('Invalid private key format: ' + validationError.message);
      }
      
      // Clean up potential whitespace issues
      processedPrivateKey = processedPrivateKey.trim();
      
      // Update keys object with processed key
      keys.privateKey = processedPrivateKey;
      console.log('  - Final private key format check:');
      console.log('    - Length after processing:', keys.privateKey.length);
      console.log('    - Starts with BEGIN PRIVATE KEY:', keys.privateKey.includes('-----BEGIN PRIVATE KEY-----'));
    }
    
    // Create a new SignedXml instance
    console.log('🏗️  Creating SignedXml instance...');
    const sig = new SignedXml();
    
    // Configure namespace handling - xml-crypto should inherit namespaces from input XML
    // The ds namespace is already declared in the input assertion XML
    console.log('✅ SignedXml instance created - will use namespaces from input XML');
    
    // Set the private key for signing
    console.log('🔐 Setting private key for signing...');
    try {
      sig.privateKey = keys.privateKey;
      console.log('✅ Private key set successfully');
    } catch (keyError) {
      console.error('❌ Failed to set private key:');
      console.error('  - Key error message:', keyError.message);
      console.error('  - Key error type:', keyError.constructor.name);
      throw new Error('Private key format error: ' + keyError.message);
    }
    
    // Configure signature algorithm and canonicalization
    console.log('⚙️  Configuring signature algorithms...');
    sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
    sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';
    
    // Configure KeyInfo to include certificate with proper namespace
    if (keys.certificate && keys.certificate !== 'test-cert') {
      sig.keyInfoProvider = {
        getKeyInfo: function() {
          return `<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>${keys.certificate}</ds:X509Certificate></ds:X509Data></ds:KeyInfo>`;
        }
      };
    }
    
    console.log('  - signatureAlgorithm:', sig.signatureAlgorithm);
    console.log('  - canonicalizationAlgorithm:', sig.canonicalizationAlgorithm);
    console.log('  - KeyInfo configured:', sig.keyInfoProvider ? 'yes' : 'no');
    console.log('✅ Algorithms configured');
    
    // Add reference to the assertion element
    console.log('📋 Adding reference to assertion element...');
    const referenceConfig = {
      xpath: "//*[local-name(.)='Assertion']",
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/2001/10/xml-exc-c14n#'
      ]
    };
    console.log('  - Reference config:', JSON.stringify(referenceConfig, null, 2));
    
    sig.addReference(referenceConfig);
    console.log('✅ Reference added');
    
    // Compute the signature
    console.log('🎯 Computing signature...');
    const locationConfig = {
      location: {
        reference: "//*[local-name(.)='Assertion']/*[local-name(.)='Issuer']",
        action: "after"
      }
    };
    console.log('  - Location config:', JSON.stringify(locationConfig, null, 2));
    
    console.log('⏳ Calling computeSignature...');
    
    // Debug: Log the input XML being signed
    console.log('📋 Input XML for signing:');
    console.log('  - Input XML has ds namespace declaration:', assertionXml.includes('xmlns:ds='));
    console.log('  - Input XML ds namespace URI:', assertionXml.match(/xmlns:ds="([^"]*)"/) || 'not found');
    console.log(assertionXml);
    
    try {
      sig.computeSignature(assertionXml, locationConfig);
      console.log('✅ Signature computed successfully');
    } catch (signatureError) {
      console.error('❌ Failed to compute signature:');
      console.error('  - Signature error message:', signatureError.message);
      console.error('  - Signature error type:', signatureError.constructor.name);
      console.error('  - Signature error code:', signatureError.code);
      
      // Check for specific crypto errors
      if (signatureError.message.includes('DECODER routines')) {
        console.error('🔍 DECODER error detected - likely private key format issue');
        console.error('  - Try converting key format from PKCS#1 to PKCS#8');
        console.error('  - Check if key is encrypted (password protected)');
        console.error('  - Verify key has proper PEM format with correct headers/footers');
      }
      
      throw signatureError;
    }
    
    // Get the signed XML
    console.log('📤 Getting signed XML...');
    let signedXml = sig.getSignedXml();
    console.log('✅ Signed XML retrieved');
    console.log('  - Signed XML length:', signedXml ? signedXml.length : 'null');
    console.log('  - Contains ds:Signature (before fix):', signedXml ? signedXml.includes('<ds:Signature') : false);
    
    // Post-process to add ds: namespace prefixes to signature elements
    if (signedXml) {
      console.log('🔧 Adding ds: namespace prefixes to signature elements...');
      
      // Replace signature elements to use ds: prefix
      signedXml = signedXml
        .replace(/<Signature xmlns="http:\/\/www\.w3\.org\/2000\/09\/xmldsig#">/g, '<ds:Signature>')
        .replace(/<\/Signature>/g, '</ds:Signature>')
        .replace(/<SignedInfo>/g, '<ds:SignedInfo>')
        .replace(/<\/SignedInfo>/g, '</ds:SignedInfo>')
        .replace(/<CanonicalizationMethod /g, '<ds:CanonicalizationMethod ')
        .replace(/<\/CanonicalizationMethod>/g, '</ds:CanonicalizationMethod>')
        .replace(/<SignatureMethod /g, '<ds:SignatureMethod ')
        .replace(/<\/SignatureMethod>/g, '</ds:SignatureMethod>')
        .replace(/<Reference /g, '<ds:Reference ')
        .replace(/<\/Reference>/g, '</ds:Reference>')
        .replace(/<Transforms>/g, '<ds:Transforms>')
        .replace(/<\/Transforms>/g, '</ds:Transforms>')
        .replace(/<Transform /g, '<ds:Transform ')
        .replace(/<\/Transform>/g, '</ds:Transform>')
        .replace(/<DigestMethod /g, '<ds:DigestMethod ')
        .replace(/<\/DigestMethod>/g, '</ds:DigestMethod>')
        .replace(/<DigestValue>/g, '<ds:DigestValue>')
        .replace(/<\/DigestValue>/g, '</ds:DigestValue>')
        .replace(/<SignatureValue>/g, '<ds:SignatureValue>')
        .replace(/<\/SignatureValue>/g, '</ds:SignatureValue>')
        .replace(/<KeyInfo>/g, '<ds:KeyInfo>')
        .replace(/<\/KeyInfo>/g, '</ds:KeyInfo>')
        .replace(/<X509Data>/g, '<ds:X509Data>')
        .replace(/<\/X509Data>/g, '</ds:X509Data>')
        .replace(/<X509Certificate>/g, '<ds:X509Certificate>')
        .replace(/<\/X509Certificate>/g, '</ds:X509Certificate>');
        
      console.log('✅ Namespace prefixes added');
    }
    
    console.log('  - Contains ds:Signature (after fix):', signedXml ? signedXml.includes('<ds:Signature') : false);
    console.log('  - Contains ds:SignedInfo (after fix):', signedXml ? signedXml.includes('<ds:SignedInfo') : false);
    console.log('  - Contains ds:SignatureValue (after fix):', signedXml ? signedXml.includes('<ds:SignatureValue') : false);
    console.log('  - Contains ds:Reference (after fix):', signedXml ? signedXml.includes('<ds:Reference') : false);
    console.log('  - Complete Signed XML:');
    console.log(signedXml || 'null');
    
    // Validate namespace usage
    if (signedXml && !signedXml.includes('<ds:Signature')) {
      console.warn('⚠️  Warning: Signed XML does not contain ds:Signature elements');
      console.warn('     This suggests namespace prefix configuration may not be working');
    }
    
    console.log('🎉 SAML assertion signing completed successfully');
    return signedXml;
  } catch (error) {
    console.error('❌ Error signing SAML assertion:');
    console.error('  - Error message:', error.message);
    console.error('  - Error stack:', error.stack);
    console.error('  - Error type:', error.constructor.name);
    
    // Additional debug info for common issues
    if (error.message.includes('private key')) {
      console.error('🔍 Private key issue detected');
      console.error('  - Private key type:', typeof keys?.privateKey);
      console.error('  - Private key format check:', keys?.privateKey?.includes('-----BEGIN') ? 'PEM format' : 'Unknown format');
    }
    
    if (error.message.includes('xpath') || error.message.includes('reference')) {
      console.error('🔍 XPath/Reference issue detected');
      console.error('  - Input XML contains Assertion element:', assertionXml?.includes('<saml:Assertion') || assertionXml?.includes('<Assertion'));
      console.error('  - Input XML contains Issuer element:', assertionXml?.includes('<saml:Issuer') || assertionXml?.includes('<Issuer'));
    }
    
    throw new Error('Failed to sign SAML assertion: ' + error.message);
  }
};

/**
 * Generate a SAML Request/Response ID
 */
export const generateSAMLId = () => {
  return '_' + uuidv4().replace(/-/g, '');
};

/**
 * Generate current timestamp in SAML format (ISO 8601)
 */
export const getSAMLTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Parse query parameters from SAML requests
 */
export const parseSAMLQueryString = (queryString) => {
  if (!queryString) return {};
  
  const params = {};
  const pairs = queryString.split('&');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  
  return params;
};

/**
 * Validate basic SAML AuthnRequest parameters
 */
export const validateSAMLAuthnRequest = (params) => {
  const errors = [];
  
  if (!params.SAMLRequest) {
    errors.push('Missing SAMLRequest parameter');
  }
  
  return errors;
};

/**
 * Create SAML Error Response XML
 */
export const createSAMLErrorResponse = (requestId, issuer, statusCode, statusMessage, destination) => {
  const responseId = generateSAMLId();
  const timestamp = getSAMLTimestamp();
  
  const samlErrorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="${responseId}"
                Version="2.0"
                IssueInstant="${timestamp}"
                InResponseTo="${requestId}"
                Destination="${destination}">
  <saml:Issuer>${issuer}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="${statusCode}"/>
    <samlp:StatusMessage>${statusMessage}</samlp:StatusMessage>
  </samlp:Status>
</samlp:Response>`;

  return Buffer.from(samlErrorResponse).toString('base64');
};

/**
 * Create SAML Response XML with signed assertion
 */
export const createSAMLResponseXML = async (requestId, issuer, audience, subject) => {
  const responseId = generateSAMLId();
  const timestamp = getSAMLTimestamp();
  const assertionId = generateSAMLId();
  
  const notOnOrAfter = new Date(Date.now() + 3600000).toISOString();
  
  // Build the assertion XML separately for signing
  const assertionXml = `<?xml version="1.0" encoding="UTF-8"?>
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                ID="${assertionId}"
                Version="2.0"
                IssueInstant="${timestamp}">
  <saml:Issuer>${issuer}</saml:Issuer>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">${subject}</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData InResponseTo="${requestId}"
                                    Recipient="${audience}"
                                    NotOnOrAfter="${notOnOrAfter}"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions NotBefore="${timestamp}" NotOnOrAfter="${notOnOrAfter}">
    <saml:AudienceRestriction>
      <saml:Audience>${audience}</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AuthnStatement AuthnInstant="${timestamp}">
    <saml:AuthnContext>
      <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
    </saml:AuthnContext>
  </saml:AuthnStatement>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>test@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="name">
      <saml:AttributeValue>Test User</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>`;

  // Sign the assertion
  const signedAssertion = await signSAMLAssertion(assertionXml);
  
  // Extract just the assertion element from the signed XML (remove XML declaration)
  const assertionMatch = signedAssertion.match(/<saml:Assertion[\s\S]*<\/saml:Assertion>/);
  const signedAssertionElement = assertionMatch ? assertionMatch[0] : signedAssertion;
  
  // Build the complete SAML response with the signed assertion
  const samlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="${responseId}"
                Version="2.0"
                IssueInstant="${timestamp}"
                InResponseTo="${requestId}"
                Destination="${audience}">
  <saml:Issuer>${issuer}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  ${signedAssertionElement}
</samlp:Response>`;

  return Buffer.from(samlResponse).toString('base64');
};

/**
 * Create HTTP response with proper headers
 */
export const createSAMLResponse = (statusCode, body, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      ...additionalHeaders
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
};

/**
 * Basic SAML Request parsing (minimal implementation)
 */
export const parseSAMLRequest = (samlRequest) => {
  try {
    const decodedRequest = Buffer.from(samlRequest, 'base64').toString('utf-8');
    
    const requestIdMatch = decodedRequest.match(/ID="([^"]+)"/);
    const issuerMatch = decodedRequest.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/);
    const acsUrlMatch = decodedRequest.match(/AssertionConsumerServiceURL="([^"]+)"/);
    
    // Check for passive authentication request
    const isPassiveMatch = decodedRequest.match(/IsPassive="(true|false)"/i);
    const isPassive = isPassiveMatch ? isPassiveMatch[1].toLowerCase() === 'true' : false;
    
    // Check for forced authentication request  
    const forceAuthnMatch = decodedRequest.match(/ForceAuthn="(true|false)"/i);
    const forceAuthn = forceAuthnMatch ? forceAuthnMatch[1].toLowerCase() === 'true' : false;
    
    return {
      requestId: requestIdMatch ? requestIdMatch[1] : null,
      issuer: issuerMatch ? issuerMatch[1] : null,
      acsUrl: acsUrlMatch ? acsUrlMatch[1] : null,
      isPassive: isPassive,
      forceAuthn: forceAuthn,
      rawRequest: decodedRequest
    };
  } catch (error) {
    console.error('Error parsing SAML request:', error);
    return null;
  }
};