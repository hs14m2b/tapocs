import { signSAMLAssertion } from '../../lambdas/saml_common_functions.mjs';

describe('SAML Assertion Signing Validation', () => {

  // Real RSA key pair for testing purposes
  const testKeys = {
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQD1sIPhTAwkshR/
v4oOH2C+8ssCKQI3yy9ZsOfgKrseWvAMQ2vL5XktF6Q7kQBPXmOZq6viBnh9ZFOu
xnbJjVbubTJipAHX4ZQcgJiiltwolGAHB3RrYsSGAzfBCz3i9lje67uIHbtqY9Bp
oIpdveugRtyB9p2v9GjBWoJ/j2dAX6QUfivJ1jYmmg3gNeGdlVkDuOVozJ4nADO3
yCxdV4+sqGpjiC1DhD9WCRMHARTRHETIOMR1ZaQ7HTwaO6cgOzEqvKGd/YG//HDe
Gs0OmyG59ne687M9/4y7UqNVPVqUyFBezLm5//XbNx89ko7eXctoQwsAGdgnLLSc
QTyYRWmRAgMBAAECggEAaySDHqkvUoFmdx9scSQ16I+xAEwp73LoP1DqjdOUrnQx
4uc0B0MXSRbaRC/D1tjuzoETAAqaWPR7mehqvRKqKmfsZR/oveBd2uApsB3h/MBX
8DjMCFiWI2sb0U+5uVR9BRoAOifdJ1RH+whLzv2X19mPKA4ITkdjt45lAoPjHyq7
f1XUvhPvC5eEHl1LmffokGVvwL6EGIvhCyVoi+FLE8sD/BHU8KtA1SXVxmfNMLo8
fMt5qvlY2VkWRrfUDcEhzvJhQYaF6MMg/DIYygfzIy3f7zqp6RjJERbXuBKG9nPo
v+zb4g/FkBIZer+nzXtLfdNj7W6GMg6AnlNOIk1iEQKBgQD9U3VqKgHsiu497Fmm
h8EPHSXl5h+atZ/PTVlSuUEkDtaXF0Rwl6//BwJiKZRx4mf8PY0F78Chi4rlHlND
+4YxoD5wBk74ZJmL3A/5NwFvY9lftFuOLMPjkl7DNI+uMUpN1kjFyC3XCyrACuvX
8KpMPVPwX0uCbRDznLcRir03pwKBgQD4SGvJpqF4ulFq7t4KXTScYHu1LllqkV9N
meuumTb/ng07djRSRZIY0j6qcwh/UDyRI/LhCh04HnIh9V40cZYCg5yuvrOqSlut
XwcFUjy+vbkH21xoP9KgOMEP+CvWOnpTnciafReYvbTvQnpDcM74FNZdup3u0fbl
wGjFbTx8BwKBgQCm9S9oVeFIvdQA+dmoOMaTqHlGyOFBfLyjyu246KG3GxRxJgOU
VVTINx1qBs9wM3CnPQXJyNbjYW2cTd1A6+/omx0rhezcJqlQFSxt6sPGXz9vpRXG
YViFjv1nmCet/YxkOnth5unXVePKCCih/FqwvqaowJWqkyld9YZuSEsm9wKBgQCZ
1k2rGWsNYeyWpEDCDTRO/F1KStiudjql24wzl82DHsw2HqyWmXLHnGWluTb3o6CT
kcGo/FpUblDrh5wCRKrdDe1kPNcX2ZDqYGn6OxVWXjmqi5m7ImiATAobufp3d65Z
5vbn+kBHrKvSX89fwCMNheO5GatH0aL4gnqocWG7uwKBgQDOC4UE/blp+9zFp5IV
/c7MpCvDjDLOAi0i3rWoxiVIsT8+iNyb/VbtF50nWLaJKw2CPMyVKFEbQozADvMy
A8bLwPxx4XpwTpUG9e3zYiE5BBgNBNuGVh/ORnAjUHWBsIksWdRWQRIrshgqp5ok
YL83Djz7m+CSaLRTJUa7bTf8EQ==
-----END PRIVATE KEY-----`,
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9bCD4UwMJLIUf7+KDh9g
vvLLAikCN8svWbDn4Cq7HlrwDENry+V5LRekO5EAT15jmaur4gZ4fWRTrsZ2yY1W
7m0yYqQB1+GUHICYopbcKJRgBwd0a2LEhgM3wQs94vZY3uu7iB27amPQaaCKXb3r
oEbcgfadr/RowVqCf49nQF+kFH4rydY2JpoN4DXhnZVZA7jlaMyeJwAzt8gsXVeP
rKhqY4gtQ4Q/VgkTBwEU0RxEyDjEdWWkOx08GjunIDsxKryhnf2Bv/xw3hrNDpsh
ufZ3uvOzPf+Mu1KjVT1alMhQXsy5uf/12zcfPZKO3l3LaEMLABnYJyy0nEE8mEVp
kQIDAQAB
-----END PUBLIC KEY-----`,
    certificate: 'test-cert'
  };

  const testAssertionXml = `<?xml version="1.0" encoding="UTF-8"?>
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                ID="_test12345"
                Version="2.0"
                IssueInstant="2024-01-01T12:00:00.000Z">
  <saml:Issuer>https://test-issuer.example.com</saml:Issuer>
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">testuser@example.com</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData InResponseTo="_request123"
                                    Recipient="https://service-provider.com/acs"
                                    NotOnOrAfter="2024-01-01T13:00:00.000Z"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions NotBefore="2024-01-01T12:00:00.000Z" NotOnOrAfter="2024-01-01T13:00:00.000Z">
    <saml:AudienceRestriction>
      <saml:Audience>https://service-provider.com</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AuthnStatement AuthnInstant="2024-01-01T12:00:00.000Z">
    <saml:AuthnContext>
      <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
    </saml:AuthnContext>
  </saml:AuthnStatement>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>testuser@example.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="name">
      <saml:AttributeValue>Test User</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>`;

  it('should sign SAML assertion and produce valid digital signature structure', async () => {
    // Sign the assertion using test keys
    const signedXml = await signSAMLAssertion(testAssertionXml, testKeys);
    console.log('Signed SAML Assertion:');
    console.log(signedXml);
    // Verify the signed XML contains required signature elements
    expect(signedXml).toContain('<ds:Signature');
    expect(signedXml).toContain('<ds:SignedInfo');
    expect(signedXml).toContain('<ds:SignatureValue');
    expect(signedXml).toContain('<ds:Reference');
    expect(signedXml).toContain('</ds:Signature>');
    
    // Verify signature placement (should be after the Issuer element)
    const issuerEndIndex = signedXml.indexOf('</saml:Issuer>') + '</saml:Issuer>'.length;
    const signatureIndex = signedXml.indexOf('<ds:Signature');
    
    expect(issuerEndIndex).toBeGreaterThan(-1);
    expect(signatureIndex+1).toBeGreaterThan(issuerEndIndex);
    
    // Verify original assertion content is preserved
    expect(signedXml).toContain('ID="_test12345"');
    expect(signedXml).toContain('https://test-issuer.example.com');
    expect(signedXml).toContain('testuser@example.com');
    expect(signedXml).toContain('Test User');
    
    console.log('Signed SAML Assertion Preview:');
    console.log(signedXml.substring(0, 500) + '...');
  }, 15000);

  it('should use correct signature algorithms in signed assertion', async () => {
    const signedXml = await signSAMLAssertion(testAssertionXml, testKeys);
    
    // Verify RSA-SHA256 signature algorithm
    expect(signedXml).toContain('Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"');
    
    // Verify exclusive canonicalization
    expect(signedXml).toContain('Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"');
    
    // Verify SHA-256 digest algorithm
    expect(signedXml).toContain('Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"');
    
    // Verify enveloped signature transform
    expect(signedXml).toContain('Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"');
  }, 15000);

  it('should include signature value and digest value in signed assertion', async () => {
    const signedXml = await signSAMLAssertion(testAssertionXml, testKeys);
    
    // Check that SignatureValue contains base64 encoded signature
    const signatureValueMatch = signedXml.match(/<ds:SignatureValue[^>]*>([A-Za-z0-9+/=\s]+)<\/ds:SignatureValue>/);
    expect(signatureValueMatch).not.toBeNull();
    expect(signatureValueMatch[1].trim().length).toBeGreaterThan(100); // RSA-2048 signature should be ~256 bytes base64 encoded
    
    // Check that DigestValue contains base64 encoded digest
    const digestValueMatch = signedXml.match(/<ds:DigestValue[^>]*>([A-Za-z0-9+/=\s]+)<\/ds:DigestValue>/);
    expect(digestValueMatch).not.toBeNull();
    expect(digestValueMatch[1].trim().length).toEqual(44); // SHA-256 digest is 32 bytes, base64 encoded = 44 chars
  }, 15000);

  it('should reference the correct assertion element in signature', async () => {
    const signedXml = await signSAMLAssertion(testAssertionXml, testKeys);
    
    // The reference URI should point to the assertion element by its ID
    expect(signedXml).toContain('URI="#_test12345"');
    
    // Verify the Reference element structure
    expect(signedXml).toMatch(/<ds:Reference[^>]*URI="#_test12345"[^>]*>/);
  }, 15000);

  it('should maintain XML namespaces and structure after signing', async () => {
    const signedXml = await signSAMLAssertion(testAssertionXml, testKeys);
    
    // Verify required namespaces are present
    expect(signedXml).toContain('xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"');
    expect(signedXml).toContain('xmlns:ds="http://www.w3.org/2000/09/xmldsig#"');
    
    // Verify assertion structure is intact
    expect(signedXml).toContain('<saml:Subject>');
    expect(signedXml).toContain('<saml:Conditions');
    expect(signedXml).toContain('<saml:AuthnStatement');
    expect(signedXml).toContain('<saml:AttributeStatement>');
    
    // Verify XML is well-formed (basic check)
    expect(signedXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(signedXml.split('<saml:Assertion').length).toEqual(2); // Should only have one Assertion element
  }, 15000);

  it('should produce different signature values for different assertions', async () => {
    // Create a slightly different assertion
    const modifiedAssertionXml = testAssertionXml.replace('_test12345', '_test67890');
    
    const signedXml1 = await signSAMLAssertion(testAssertionXml, testKeys);
    const signedXml2 = await signSAMLAssertion(modifiedAssertionXml, testKeys);
    
    // Extract signature values
    const sig1Match = signedXml1.match(/<ds:SignatureValue[^>]*>([A-Za-z0-9+/=\s]+)<\/ds:SignatureValue>/);
    const sig2Match = signedXml2.match(/<ds:SignatureValue[^>]*>([A-Za-z0-9+/=\s]+)<\/ds:SignatureValue>/);
    
    expect(sig1Match).not.toBeNull();
    expect(sig2Match).not.toBeNull();
    
    // Signature values should be different
    expect(sig1Match[1].trim()).not.toEqual(sig2Match[1].trim());
  }, 15000);

  it('should throw error when signing fails with invalid keys', async () => {
    const invalidKeys = {
      privateKey: 'invalid-key',
      publicKey: 'invalid-key',
      certificate: 'invalid-cert'
    };
    
    await expectAsync(signSAMLAssertion(testAssertionXml, invalidKeys))
      .toBeRejectedWithError(/^Failed to sign SAML assertion/);
  }, 15000);

});
