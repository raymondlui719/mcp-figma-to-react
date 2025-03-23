import * as prettier from 'prettier';
import { FigmaNode } from './figma-client.js';
import { convertFigmaStylesToTailwind } from './figma-tailwind-converter.js';
import { enhanceWithAccessibility } from './accessibility.js';

interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
}

interface ReactComponentParts {
  jsx: string;
  imports: string[];
  props: PropDefinition[];
  styles?: Record<string, any>;
}

// Helper function to convert Figma node name to a valid React component name
function toComponentName(name: string): string {
  // Remove invalid characters and convert to PascalCase
  return name
    .replace(/[^\w\s-]/g, '')
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Helper function to convert Figma node name to a valid prop name
function toPropName(name: string): string {
  // Convert to camelCase
  const parts = name
    .replace(/[^\w\s-]/g, '')
    .split(/[-_\s]+/);
  
  return parts[0].toLowerCase() + 
    parts.slice(1)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
}

// Extract potential props from Figma node
function extractProps(node: FigmaNode): PropDefinition[] {
  const props: PropDefinition[] = [];
  
  // Text content could be a prop
  if (node.type === 'TEXT' && node.characters) {
    const propName = toPropName(node.name) || 'text';
    props.push({
      name: propName,
      type: 'string',
      defaultValue: JSON.stringify(node.characters),
      description: `Text content for ${node.name}`
    });
  }
  
  // If node has a "variant" property, it could be a prop
  if (node.name.toLowerCase().includes('variant')) {
    props.push({
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline' | 'text'",
      defaultValue: "'primary'",
      description: 'Visual variant of the component'
    });
  }
  
  // If node looks like a button, add onClick prop
  if (node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn')) {
    props.push({
      name: 'onClick',
      type: '() => void',
      description: 'Function called when button is clicked'
    });
  }
  
  // If node has children that could be dynamic, add children prop
  if (node.children && node.children.length > 0) {
    // Check if it has a container-like name
    if (
      node.name.toLowerCase().includes('container') || 
      node.name.toLowerCase().includes('wrapper') ||
      node.name.toLowerCase().includes('layout') ||
      node.name.toLowerCase().includes('section')
    ) {
      props.push({
        name: 'children',
        type: 'React.ReactNode',
        description: 'Child elements to render inside the component'
      });
    }
  }
  
  // Add className prop for styling customization
  props.push({
    name: 'className',
    type: 'string',
    description: 'Additional CSS classes to apply'
  });
  
  return props;
}

// Convert a Figma node to JSX
function figmaNodeToJSX(node: FigmaNode, level = 0): ReactComponentParts {
  const imports: string[] = [];
  const allProps: PropDefinition[] = [];
  
  // Default result
  let result: ReactComponentParts = {
    jsx: '',
    imports: [],
    props: []
  };
  
  // Handle different node types
  switch (node.type) {
    case 'TEXT':
      // Extract text content and convert to JSX
      const textContent = node.characters || '';
      const tailwindClasses = convertFigmaStylesToTailwind(node);
      const textProps = extractProps(node);
      
      result = {
        jsx: `<p className="${tailwindClasses.join(' ')}">{${textProps[0]?.name || 'text'}}</p>`,
        imports: [],
        props: textProps
      };
      break;
      
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'POLYGON':
    case 'STAR':
    case 'VECTOR':
    case 'LINE':
      // Convert to a div with appropriate styling
      const shapeClasses = convertFigmaStylesToTailwind(node);
      
      result = {
        jsx: `<div className="${shapeClasses.join(' ')} ${node.type.toLowerCase()} ${node.name.toLowerCase().replace(/\s+/g, '-')}"></div>`,
        imports: [],
        props: []
      };
      break;
      
    case 'COMPONENT':
    case 'INSTANCE':
    case 'FRAME':
    case 'GROUP':
      // These are container elements that might have children
      const containerClasses = convertFigmaStylesToTailwind(node);
      const containerProps = extractProps(node);
      
      // Process children if they exist
      let childrenJSX = '';
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const childResult = figmaNodeToJSX(child, level + 1);
          childrenJSX += `\n${'  '.repeat(level + 1)}${childResult.jsx}`;
          
          // Collect imports and props from children
          imports.push(...childResult.imports);
          allProps.push(...childResult.props);
        }
        childrenJSX += `\n${'  '.repeat(level)}`;
      }
      
      // If this is a component that looks like a button
      if (node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn')) {
        result = {
          jsx: `<button 
  className="${containerClasses.join(' ')} ${node.name.toLowerCase().replace(/\s+/g, '-')}"
  onClick={onClick}
>${childrenJSX}</button>`,
          imports: imports,
          props: [...containerProps, ...allProps]
        };
      } else {
        // Check if we should use children prop
        const hasChildrenProp = containerProps.some(p => p.name === 'children');
        
        result = {
          jsx: `<div 
  className="${containerClasses.join(' ')} ${node.name.toLowerCase().replace(/\s+/g, '-')}"
>${hasChildrenProp ? '{children}' : childrenJSX}</div>`,
          imports: imports,
          props: [...containerProps, ...(hasChildrenProp ? [] : allProps)]
        };
      }
      break;
      
    case 'IMAGE':
      // Convert to an img tag
      const imageClasses = convertFigmaStylesToTailwind(node);
      
      result = {
        jsx: `<img 
  src="${node.name.toLowerCase().replace(/\s+/g, '-')}.png" 
  className="${imageClasses.join(' ')}" 
  alt="${node.name}"
/>`,
        imports: [],
        props: [{
          name: 'src',
          type: 'string',
          description: 'Image source URL'
        }]
      };
      break;
      
    default:
      // Default to a simple div
      result = {
        jsx: `<div className="${node.name.toLowerCase().replace(/\s+/g, '-')}"></div>`,
        imports: [],
        props: []
      };
  }
  
  return result;
}

export class ComponentGenerator {
  async generateReactComponent(componentName: string, figmaNode: FigmaNode): Promise<string> {
    // Extract styles, structure, and props from Figma node
    const componentParts = figmaNodeToJSX(figmaNode);
    
    // Enhance with accessibility features
    const enhancedJSX = enhanceWithAccessibility(componentParts.jsx, figmaNode);
    
    // Deduplicate props
    const uniqueProps = componentParts.props.filter((prop, index, self) => 
      index === self.findIndex(p => p.name === prop.name)
    );
    
    // Create component template
    const componentCode = `
import React from 'react';
${componentParts.imports.join('\n')}

interface ${componentName}Props {
  ${uniqueProps.map(prop => 
    `/** ${prop.description || ''} */
  ${prop.name}${prop.type.includes('?') || prop.defaultValue ? '?' : ''}: ${prop.type};`
  ).join('\n  ')}
}

export const ${componentName} = ({ 
  ${uniqueProps.map(p => 
    p.defaultValue 
      ? `${p.name} = ${p.defaultValue}` 
      : p.name
  ).join(', ')} 
}: ${componentName}Props) => {
  return (
    ${enhancedJSX}
  );
};
`;
    
    // Format the code
    try {
      return await prettier.format(componentCode, {
        parser: 'typescript',
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 2
      });
    } catch (error) {
      console.error('Error formatting component code:', error);
      return componentCode;
    }
  }

  async generateComponentLibrary(components: Array<{ name: string, node: FigmaNode }>): Promise<Record<string, string>> {
    const generatedComponents: Record<string, string> = {};
    
    for (const { name, node } of components) {
      const componentName = toComponentName(name);
      generatedComponents[componentName] = await this.generateReactComponent(componentName, node);
    }
    
    return generatedComponents;
  }
}