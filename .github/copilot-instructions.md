# Transitioning an MCP Server from stdio to SSE for Copilot Studio

## Summary
This document guides an LLM to:
- Transition an MCP server from stdio to SSE transport in code.
- Expose an HTTP SSE endpoint for interaction.
- Configure a Copilot Studio Custom Connector.
- Secure and deploy the SSE endpoint.
- Generate the corresponding OpenAPI JSON schema file describing all tools and parameters (Step 6).

## Prerequisites
- Existing MCP server using stdio transport.
- Familiarity with your programming language (JavaScript/TypeScript, Python, C#, or Java).
- Access to Copilot Studio’s Custom Connector interface.

## Step 1: Replace stdio Transport
1. In your code, swap:
   ```js
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   const transport = new StdioServerTransport(mcpServer);
   ```
   with:
   ```js
   import { StreamableHttpServerTransport } from "@modelcontextprotocol/sdk/server/streamable-http.js";
   const transport = new StreamableHttpServerTransport(mcpServer);
   ```

2. For Python:
   ```python
   from mcp.server.sse import SseServerTransport
   transport = SseServerTransport(mcpServer)
   ```

3. For C#/.NET:
   ```csharp
   services.AddServerTransport<SseServerTransport>();
   ```

## Step 2: Expose an HTTP SSE Endpoint
Use your web framework to route POST and GET on `/mcp`:
```js
const express = require("express");
const app = express();
app.use(express.raw({ type: "*/*" }));
const transport = new StreamableHttpServerTransport(mcpServer);

app.all("/mcp", (req, res) => {
  transport.handleHttpRequest(req, res);
});

app.listen(3000, () => console.log("SSE MCP listening on http://localhost:3000/mcp"));
```

## Step 3: Configure Copilot Studio Connector
Create a `connector.yaml`:
```yaml
schema: mcp/v1
id: my-mcp-connector
transport:
  type: sse
  url: https://my-domain.com/mcp
authentication:
  type: bearer
```
Import via **Connectors → Custom → MCP** in Copilot Studio.

## Step 4: Secure and Deploy
- Serve over HTTPS with TLS.
- Restrict CORS to trusted origins.
- Require `Authorization: Bearer <token>` headers.

## Step 5: Testing
1. SSE listener:
   ```bash
   curl -N https://my-domain.com/mcp
   ```
2. JSON-RPC invocation:
   ```bash
   curl -X POST -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' https://my-domain.com/mcp
   ```

## Step 6: Generate OpenAPI JSON Schema File
Instruct the LLM to create `mcp-openapi-schema.json` with:
1. **OpenAPI metadata** (`openapi`, `info`, `servers`).
2. **Paths** for `/mcp` GET (SSE) and POST (JSON-RPC).
3. **Components > schemas** defining:
   - `JsonRpcRequest` schema (method, params, id).
   - `JsonRpcResponse` schema (jsonrpc, id, result, error).
   - Individual tool parameter schemas.
4. **Tool Definitions**: Under `components.schemas`, add a schema per tool with:
   ```json
   "ToolNameParams": {
     "type": "object",
     "properties": {
       "param1": { "type": "string" },
       "param2": { "type": "integer" }
     },
     "required": ["param1"]
   }
   ```
5. Reference each tool schema in the POST request body:
   ```json
   "paths": {
     "/mcp": {
       "post": {
         "requestBody": {
           "content": {
             "application/json": {
               "schema": {
                 "oneOf": [
                   { "$ref": "#/components/schemas/ToolNameParams" },
                   { "$ref": "#/components/schemas/OtherToolParams" }
                 ]
               }
             }
           }
         }
       }
     }
   }
   ```
6. Ensure the LLM writes the file at the repository root as `mcp-openapi-schema.json`.

---


