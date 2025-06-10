#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { FigmaClient } from './figma-client.js';
import { registerFigmaTools } from './figma-tools.js';
import { ComponentGenerator } from './component-generator.js';
import { registerReactTools } from './figma-react-tools.js";

import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

// Get Figma API token from environment variable
const FIGMA_API_TOKEN = process.env.FIGMA_API_TOKEN;
if (!FIGMA_API_TOKEN) {
  console.error('FIGMA_API_TOKEN environment variable is required');
  process.exit(1);
}

// Create the MCP server
const server = new McpServer({
  name: 'Figma to React Converter',
  version: '1.0.0',
  description: 'MCP server for converting Figma designs to React components'
});

// Initialize Figma client and component generator
const figmaClient = new FigmaClient(FIGMA_API_TOKEN);
const componentGenerator = new ComponentGenerator();

// Register tools with the server
registerFigmaTools(server, figmaClient);
registerReactTools(server, componentGenerator, figmaClient);

// Determine the transport to use based on command-line arguments
const transportArg = process.argv.find(arg => arg.startsWith('--transport='));
const transportType = transportArg ? transportArg.split('=')[1] : 'stdio';

async function main() {
  try {
    if (transportType === 'stdio') {
      // Use stdio transport for local MCP server
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('Figma to React MCP server running on stdio');
    } else if (transportType === 'sse') {
      // Set up Express server
      const app = express();
      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
      
      app.use(express.json());
      
      // Health check endpoint
      app.get('/health', (_req, res) => {
        res.status(200).send('OK');
      });
      
      // SSE endpoint
      app.get('/sse', async (req: express.Request, res: express.Response) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const transport = new SSEServerTransport('/messages', res);
        await server.connect(transport);
        
        req.on('close', async () => {
          await server.close();
        });
      });
      
      // Message endpoint
      app.post('/messages', express.json(), async (req: express.Request, res: express.Response) => {
        // This endpoint would be used by the client to send messages to the server
        res.status(200).json({ status: 'ok' });
      });
      
      // Start the Express server
      const httpServer = app.listen(port, () => {
        console.error(`Figma to React MCP server running on port ${port}`);
      });
      
      // Handle server shutdown
      process.on('SIGINT', async () => {
        console.error('Shutting down server...');
        await server.close();
        httpServer.close();
        process.exit(0);
      });
    } else {
      console.error(`Unsupported transport type: ${transportType}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error);