import {
  generateAuthorizationCode,
  generateCodeVerifier,
  parseQueryString,
  validateAuthorizationRequest,
  createResponse,
  getParameterCaseInsensitive
} from '../../lambdas/oidc_common_functions.mjs';

describe("OIDC Common Functions", function() {
  
  describe("generateAuthorizationCode", function() {
    it("should generate a non-empty authorization code", function() {
      const code = generateAuthorizationCode();
      expect(code).toBeDefined();
      expect(code.length).toBeGreaterThan(0);
      expect(typeof code).toBe('string');
    });
    
    it("should generate unique codes", function() {
      const code1 = generateAuthorizationCode();
      const code2 = generateAuthorizationCode();
      expect(code1).not.toEqual(code2);
    });
  });
  
  describe("generateCodeVerifier", function() {
    it("should generate a non-empty code verifier", function() {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(verifier.length).toBeGreaterThan(0);
      expect(typeof verifier).toBe('string');
    });
  });
  
  describe("parseQueryString", function() {
    it("should parse empty query string", function() {
      const result = parseQueryString("");
      expect(result).toEqual({});
    });
    
    it("should parse null query string", function() {
      const result = parseQueryString(null);
      expect(result).toEqual({});
    });
    
    it("should parse simple query string", function() {
      const result = parseQueryString("key1=value1&key2=value2");
      expect(result).toEqual({
        key1: "value1",
        key2: "value2"
      });
    });
    
    it("should handle URL encoding", function() {
      const result = parseQueryString("redirect_uri=https%3A%2F%2Fexample.com%2Fcallback");
      expect(result).toEqual({
        redirect_uri: "https://example.com/callback"
      });
    });
    
    it("should handle empty values", function() {
      const result = parseQueryString("key1=&key2=value2");
      expect(result).toEqual({
        key1: "",
        key2: "value2"
      });
    });
  });
  
  describe("validateAuthorizationRequest", function() {
    it("should validate required parameters for code flow", function() {
      const validParams = {
        response_type: "code",
        client_id: "test-client",
        redirect_uri: "https://example.com/callback"
      };
      
      const errors = validateAuthorizationRequest(validParams);
      expect(errors).toEqual([]);
    });
    
    it("should validate required parameters for id_token flow", function() {
      const validParams = {
        response_type: "id_token",
        client_id: "test-client",
        redirect_uri: "https://example.com/callback",
        nonce: "test-nonce"
      };
      
      const errors = validateAuthorizationRequest(validParams);
      expect(errors).toEqual([]);
    });
    
    it("should require response_type", function() {
      const params = {
        client_id: "test-client",
        redirect_uri: "https://example.com/callback"
      };
      
      const errors = validateAuthorizationRequest(params);
      expect(errors).toContain("response_type is required");
    });
    
    it("should require client_id", function() {
      const params = {
        response_type: "code",
        redirect_uri: "https://example.com/callback"
      };
      
      const errors = validateAuthorizationRequest(params);
      expect(errors).toContain("client_id is required");
    });
    
    it("should require redirect_uri", function() {
      const params = {
        response_type: "code",
        client_id: "test-client"
      };
      
      const errors = validateAuthorizationRequest(params);
      expect(errors).toContain("redirect_uri is required");
    });
    
    it("should support both code and id_token response types", function() {
      // Test valid response types
      const codeParams = {
        response_type: "code",
        client_id: "test-client", 
        redirect_uri: "https://example.com/callback"
      };
      const codeErrors = validateAuthorizationRequest(codeParams);
      expect(codeErrors).toEqual([]);
      
      const idTokenParams = {
        response_type: "id_token",
        client_id: "test-client", 
        redirect_uri: "https://example.com/callback",
        nonce: "test-nonce"
      };
      const idTokenErrors = validateAuthorizationRequest(idTokenParams);
      expect(idTokenErrors).toEqual([]);
    });
    
    it("should reject unsupported response types", function() {
      const params = {
        response_type: "token",
        client_id: "test-client", 
        redirect_uri: "https://example.com/callback"
      };
      
      const errors = validateAuthorizationRequest(params);
      expect(errors).toContain('response_type must be either "code" or "id_token"');
    });
    
    it("should require nonce for id_token response type", function() {
      const params = {
        response_type: "id_token",
        client_id: "test-client", 
        redirect_uri: "https://example.com/callback"
      };
      
      const errors = validateAuthorizationRequest(params);
      expect(errors).toContain('nonce is required when response_type is "id_token"');
    });
    
    it("should validate response_mode when provided", function() {
      // Valid response modes
      const validModes = ["query", "fragment", "form_post"];
      validModes.forEach(mode => {
        const params = {
          response_type: "code",
          client_id: "test-client",
          redirect_uri: "https://example.com/callback",
          response_mode: mode
        };
        
        const errors = validateAuthorizationRequest(params);
        expect(errors).toEqual([]);
      });
      
      // Invalid response mode
      const invalidParams = {
        response_type: "code",
        client_id: "test-client",
        redirect_uri: "https://example.com/callback",
        response_mode: "invalid_mode"
      };
      
      const errors = validateAuthorizationRequest(invalidParams);
      expect(errors).toContain('response_mode must be "query", "fragment", or "form_post"');
    });
    
    it("should allow missing response_mode (defaults to query)", function() {
      const params = {
        response_type: "code",
        client_id: "test-client",
        redirect_uri: "https://example.com/callback"
      };
      
      const errors = validateAuthorizationRequest(params);
      expect(errors).toEqual([]);
    });
  });
  
  describe("createResponse", function() {
    it("should create basic HTTP response", function() {
      const response = createResponse(200, { message: "success" });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('{"message":"success"}');
      expect(response.headers['Content-Type']).toBe('application/json');
    });
    
    it("should handle string body", function() {
      const response = createResponse(200, "plain text");
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("plain text");
    });
    
    it("should include CORS headers", function() {
      const response = createResponse(200, {});
      
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
    });
    
    it("should merge custom headers", function() {
      const customHeaders = { 'Custom-Header': 'test-value' };
      const response = createResponse(200, {}, customHeaders);
      
      expect(response.headers['Custom-Header']).toBe('test-value');
      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });
  
  describe("getParameterCaseInsensitive", function() {
    it("should find header with exact case", function() {
      const event = {
        headers: {
          "Authorization": "Bearer token123"
        }
      };
      
      const result = getParameterCaseInsensitive(event, "Authorization");
      expect(result).toBe("Bearer token123");
    });
    
    it("should find header with different case", function() {
      const event = {
        headers: {
          "authorization": "Bearer token123"
        }
      };
      
      const result = getParameterCaseInsensitive(event, "Authorization");
      expect(result).toBe("Bearer token123");
    });
    
    it("should return null for missing header", function() {
      const event = {
        headers: {
          "Content-Type": "application/json"
        }
      };
      
      const result = getParameterCaseInsensitive(event, "Authorization");
      expect(result).toBeNull();
    });
    
    it("should handle missing headers object", function() {
      const event = {};
      
      const result = getParameterCaseInsensitive(event, "Authorization");
      expect(result).toBeNull();
    });
  });
});