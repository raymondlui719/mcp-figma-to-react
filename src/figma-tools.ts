import { FigmaClient } from './figma-client.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerFigmaTools(server: McpServer, figmaClient: FigmaClient): void {
  // Register getFigmaProject tool
  server.tool(
    'getFigmaProject',
    {
      fileKey: z.string().describe('Figma file key')
    },
    async ({ fileKey }) => {
      try {
        const fileData = await figmaClient.getFile(fileKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: fileData.name,
                documentId: fileData.document.id,
                lastModified: fileData.lastModified,
                version: fileData.version,
                componentCount: Object.keys(fileData.components || {}).length,
                styleCount: Object.keys(fileData.styles || {}).length
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Failed to get Figma project: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  // Register getFigmaComponentNodes tool
  server.tool(
    'getFigmaComponentNodes',
    {
      fileKey: z.string().describe('Figma file key'),
      nodeIds: z.array(z.string()).describe('Node IDs to fetch')
    },
    async ({ fileKey, nodeIds }) => {
      try {
        const nodesData = await figmaClient.getFileNodes(fileKey, nodeIds);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(nodesData.nodes, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Failed to get Figma component nodes: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  // Register extractFigmaComponents tool
  server.tool(
    'extractFigmaComponents',
    {
      fileKey: z.string().describe('Figma file key')
    },
    async ({ fileKey }) => {
      try {
        const fileData = await figmaClient.getFile(fileKey);
        
        // Find all components in the file
        const components: Array<{ id: string, name: string, type: string }> = [];
        
        // Helper function to recursively traverse the document
        function findComponents(node: any) {
          if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
            components.push({
              id: node.id,
              name: node.name,
              type: node.type
            });
          }
          
          if (node.children) {
            for (const child of node.children) {
              findComponents(child);
            }
          }
        }
        
        // Start traversal from the document root
        findComponents(fileData.document);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ components }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Failed to extract Figma components: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  // Register getFigmaComponentSets tool
  server.tool(
    'getFigmaComponentSets',
    {
      fileKey: z.string().describe('Figma file key')
    },
    async ({ fileKey }) => {
      try {
        const componentSets = await figmaClient.getComponentSets(fileKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(componentSets, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Failed to get Figma component sets: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
}