# MCP Figma to React Converter

This is a Model Context Protocol (MCP) server that converts Figma designs to React components. It provides tools for fetching Figma designs and generating React components with TypeScript and Tailwind CSS.

## Features

- Fetch Figma designs using the Figma API
- Extract components from Figma designs
- Generate React components with TypeScript
- Apply Tailwind CSS classes based on Figma styles
- Enhance components with accessibility features
- Support for both stdio and SSE transports

## Prerequisites

- Node.js 18 or higher
- A Figma API token

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Configuration

You need to set the `FIGMA_API_TOKEN` environment variable to your Figma API token. You can get a personal access token from the Figma account settings page.

## Usage

### Running as a local MCP server

```bash
FIGMA_API_TOKEN=your_token_here npm start
```

Or with explicit transport:

```bash
FIGMA_API_TOKEN=your_token_here node dist/index.js --transport=stdio
```

### Running as an HTTP server

```bash
FIGMA_API_TOKEN=your_token_here node dist/index.js --transport=sse
```

## Available Tools

### Figma Tools

- `getFigmaProject`: Get a Figma project structure
- `getFigmaComponentNodes`: Get component nodes from a Figma file
- `extractFigmaComponents`: Extract components from a Figma file
- `getFigmaComponentSets`: Get component sets from a Figma file

### React Tools

- `generateReactComponent`: Generate a React component from a Figma node
- `generateComponentLibrary`: Generate multiple React components from Figma components
- `writeComponentsToFiles`: Write generated components to files
- `figmaToReactWorkflow`: Complete workflow to convert Figma designs to React components

## Example Workflow

1. Get a Figma file key (the string after `figma.com/file/` in the URL)
2. Use the `figmaToReactWorkflow` tool with the file key and output directory
3. The tool will extract components, generate React code, and save the files

## Development

For development, you can use the watch mode:

```bash
npm run dev
```

## License

ISC
