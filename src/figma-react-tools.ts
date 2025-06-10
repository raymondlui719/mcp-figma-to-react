import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ComponentGenerator } from "./component-generator.js";
import { FigmaClient, FigmaNode } from "./figma-client.js";
import * as fs from "fs/promises";
import * as path from "path";

export function registerReactTools(
  server: McpServer,
  componentGenerator: ComponentGenerator,
  figmaClient: FigmaClient
): void {
  // Register generateReactComponent tool
  server.tool(
    "generateReactComponent",
    {
      componentName: z.string().describe("Name for the React component"),
      figmaNodeId: z.string().describe("Figma node ID"),
      fileKey: z.string().describe("Figma file key"),
    },
    async ({ componentName, figmaNodeId, fileKey }) => {
      try {
        // Get the Figma node data
        const nodeData = await figmaClient.getFileNodes(fileKey, [figmaNodeId]);
        const figmaNode = nodeData.nodes[figmaNodeId]?.document;

        if (!figmaNode) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Figma node with ID ${figmaNodeId} not found`,
              },
            ],
          };
        }

        // Generate the React component
        const componentCode = await componentGenerator.generateReactComponent(
          componentName,
          figmaNode
        );

        return {
          content: [
            {
              type: "text",
              text: componentCode,
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to generate React component: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Register generateComponentLibrary tool
  server.tool(
    "generateComponentLibrary",
    {
      components: z
        .array(
          z.object({
            name: z.string(),
            nodeId: z.string(),
          })
        )
        .describe("Components to generate"),
      fileKey: z.string().describe("Figma file key"),
    },
    async ({ components, fileKey }) => {
      try {
        // Get all node IDs
        const nodeIds = components.map((comp) => comp.nodeId);

        // Get the Figma node data for all components
        const nodesData = await figmaClient.getFileNodes(fileKey, nodeIds);

        // Prepare the components for generation
        const componentsForGeneration = components
          .filter((comp) => nodesData.nodes[comp.nodeId]?.document)
          .map((comp) => ({
            name: comp.name,
            node: nodesData.nodes[comp.nodeId].document,
          }));

        // Generate the component library
        const generatedComponents =
          await componentGenerator.generateComponentLibrary(
            componentsForGeneration
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                Object.entries(generatedComponents).map(([name, code]) => ({
                  name,
                  code,
                })),
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to generate component library: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Register writeComponentsToFiles tool
  server.tool(
    "writeComponentsToFiles",
    {
      components: z
        .array(
          z.object({
            name: z.string(),
            code: z.string(),
          })
        )
        .describe("Components to write to files"),
      outputDir: z.string().describe("Output directory"),
    },
    async ({ components, outputDir }) => {
      try {
        // Create the output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });

        // Write each component to a file
        const results = await Promise.all(
          components.map(async (component) => {
            const fileName = `${component.name}.tsx`;
            const filePath = path.join(outputDir, fileName);

            await fs.writeFile(filePath, component.code, "utf-8");

            return {
              name: component.name,
              path: filePath,
            };
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ results }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to write components to files: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Register figmaToReactWorkflow tool
  server.tool(
    "figmaToReactWorkflow",
    {
      fileKey: z.string().describe("Figma file key"),
      outputDir: z.string().describe("Output directory for components"),
    },
    async ({ fileKey, outputDir }) => {
      try {
        // Step 1: Extract components from Figma file
        const fileData = await figmaClient.getFile(fileKey);

        // Find all components in the file
        const components: Array<{ id: string; name: string; type: string }> =
          [];

        // Helper function to recursively traverse the document
        function findComponents(node: any) {
          if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
            components.push({
              id: node.id,
              name: node.name,
              type: node.type,
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

        // Step 2: Get the Figma node data for all components
        const nodeIds = components.map((comp) => comp.id);
        const nodesData = await figmaClient.getFileNodes(fileKey, nodeIds);

        // Step 3: Prepare the components for generation
        const componentsForGeneration = components
          .filter((comp) => nodesData.nodes[comp.id]?.document)
          .map((comp) => ({
            name: comp.name,
            node: nodesData.nodes[comp.id].document,
          }));

        // Step 4: Generate the component library
        const generatedComponents =
          await componentGenerator.generateComponentLibrary(
            componentsForGeneration
          );

        // Step 5: Create the output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });

        // Step 6: Write each component to a file
        const results = await Promise.all(
          Object.entries(generatedComponents).map(async ([name, code]) => {
            const fileName = `${name}.tsx`;
            const filePath = path.join(outputDir, fileName);

            await fs.writeFile(filePath, code, "utf-8");

            return {
              name,
              path: filePath,
            };
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  componentsFound: components.length,
                  componentsGenerated: results.length,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to execute Figma to React workflow: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}
