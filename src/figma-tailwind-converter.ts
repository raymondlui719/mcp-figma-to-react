// Helper functions for color conversion
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
}

// Map RGB color to closest Tailwind color
function mapToTailwindColor(hexColor: string): string {
  // This is a simplified implementation
  // In a real-world scenario, you would have a more comprehensive mapping
  const tailwindColors: Record<string, string> = {
    "#000000": "text-black",
    "#ffffff": "text-white",
    "#ef4444": "text-red-500",
    "#3b82f6": "text-blue-500",
    "#10b981": "text-green-500",
    "#f59e0b": "text-yellow-500",
    "#6366f1": "text-indigo-500",
    "#8b5cf6": "text-purple-500",
    "#ec4899": "text-pink-500",
    "#6b7280": "text-gray-500",
    // Add more color mappings as needed
  };

  // Find the closest color by calculating the distance in RGB space
  let minDistance = Number.MAX_VALUE;
  let closestColor = "text-black";

  const r1 = parseInt(hexColor.slice(1, 3), 16);
  const g1 = parseInt(hexColor.slice(3, 5), 16);
  const b1 = parseInt(hexColor.slice(5, 7), 16);

  for (const [color, className] of Object.entries(tailwindColors)) {
    const r2 = parseInt(color.slice(1, 3), 16);
    const g2 = parseInt(color.slice(3, 5), 16);
    const b2 = parseInt(color.slice(5, 7), 16);

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = className;
    }
  }

  return closestColor;
}

// Map font size to Tailwind class
function mapFontSizeToTailwind(fontSize: number): string {
  if (fontSize <= 12) return "text-xs";
  if (fontSize <= 14) return "text-sm";
  if (fontSize <= 16) return "text-base";
  if (fontSize <= 18) return "text-lg";
  if (fontSize <= 20) return "text-xl";
  if (fontSize <= 24) return "text-2xl";
  if (fontSize <= 30) return "text-3xl";
  if (fontSize <= 36) return "text-4xl";
  if (fontSize <= 48) return "text-5xl";
  return "text-6xl";
}

// Map font weight to Tailwind class
function mapFontWeightToTailwind(fontWeight: number): string {
  if (fontWeight < 400) return "font-light";
  if (fontWeight < 500) return "font-normal";
  if (fontWeight < 600) return "font-medium";
  if (fontWeight < 700) return "font-semibold";
  return "font-bold";
}

// Map size values to Tailwind size classes
function mapToTailwindSize(size: number): string {
  // This is a simplified implementation
  if (size <= 4) return "1";
  if (size <= 8) return "2";
  if (size <= 12) return "3";
  if (size <= 16) return "4";
  if (size <= 20) return "5";
  if (size <= 24) return "6";
  if (size <= 32) return "8";
  if (size <= 40) return "10";
  if (size <= 48) return "12";
  if (size <= 64) return "16";
  if (size <= 80) return "20";
  if (size <= 96) return "24";
  if (size <= 128) return "32";
  if (size <= 160) return "40";
  if (size <= 192) return "48";
  if (size <= 256) return "64";
  if (size <= 320) return "80";
  if (size <= 384) return "96";
  return "full";
}

export function convertFigmaStylesToTailwind(figmaStyles: any): string[] {
  const tailwindClasses: string[] = [];

  // Convert colors
  if (figmaStyles.fills && figmaStyles.fills.length > 0) {
    const fill = figmaStyles.fills[0];
    if (fill && fill.type === "SOLID") {
      const { r, g, b } = fill.color;
      // Convert RGB to hex and find closest Tailwind color
      const hexColor = rgbToHex(r * 255, g * 255, b * 255);
      const tailwindColor = mapToTailwindColor(hexColor);
      tailwindClasses.push(tailwindColor);

      // Add opacity if needed
      if (fill.opacity && fill.opacity < 1) {
        const opacityValue = Math.round(fill.opacity * 100);
        tailwindClasses.push(`opacity-${opacityValue}`);
      }
    }
  }

  // Convert typography
  if (figmaStyles.style) {
    const { fontSize, fontWeight, lineHeight, letterSpacing } =
      figmaStyles.style;

    // Map font size to Tailwind classes
    if (fontSize) {
      tailwindClasses.push(mapFontSizeToTailwind(fontSize));
    }

    // Map font weight
    if (fontWeight) {
      tailwindClasses.push(mapFontWeightToTailwind(fontWeight));
    }

    // Map line height
    if (lineHeight) {
      // Simplified mapping
      if (lineHeight <= 1) tailwindClasses.push("leading-none");
      else if (lineHeight <= 1.25) tailwindClasses.push("leading-tight");
      else if (lineHeight <= 1.5) tailwindClasses.push("leading-normal");
      else if (lineHeight <= 1.75) tailwindClasses.push("leading-relaxed");
      else tailwindClasses.push("leading-loose");
    }

    // Map letter spacing
    if (letterSpacing) {
      // Simplified mapping
      if (letterSpacing <= -0.05) tailwindClasses.push("tracking-tighter");
      else if (letterSpacing <= 0) tailwindClasses.push("tracking-tight");
      else if (letterSpacing <= 0.05) tailwindClasses.push("tracking-normal");
      else if (letterSpacing <= 0.1) tailwindClasses.push("tracking-wide");
      else tailwindClasses.push("tracking-wider");
    }
  }

  // Convert layout properties
  if (figmaStyles.absoluteBoundingBox) {
    const { width, height } = figmaStyles.absoluteBoundingBox;
    tailwindClasses.push(`w-${mapToTailwindSize(width)}`);
    tailwindClasses.push(`h-${mapToTailwindSize(height)}`);
  }

  // Convert border radius
  if (figmaStyles.cornerRadius) {
    if (figmaStyles.cornerRadius <= 2) tailwindClasses.push("rounded-sm");
    else if (figmaStyles.cornerRadius <= 4) tailwindClasses.push("rounded");
    else if (figmaStyles.cornerRadius <= 6) tailwindClasses.push("rounded-md");
    else if (figmaStyles.cornerRadius <= 8) tailwindClasses.push("rounded-lg");
    else if (figmaStyles.cornerRadius <= 12) tailwindClasses.push("rounded-xl");
    else if (figmaStyles.cornerRadius <= 16)
      tailwindClasses.push("rounded-2xl");
    else if (figmaStyles.cornerRadius <= 24)
      tailwindClasses.push("rounded-3xl");
    else tailwindClasses.push("rounded-full");
  }

  // Convert borders
  if (figmaStyles.strokes && figmaStyles.strokes.length > 0) {
    const stroke = figmaStyles.strokes[0];
    if (stroke && stroke.type === "SOLID") {
      const { r, g, b } = stroke.color;
      const hexColor = rgbToHex(r * 255, g * 255, b * 255);
      const tailwindColor = mapToTailwindColor(hexColor).replace(
        "text-",
        "border-"
      );
      tailwindClasses.push(tailwindColor);

      // Border width
      if (figmaStyles.strokeWeight) {
        if (figmaStyles.strokeWeight <= 1) tailwindClasses.push("border");
        else if (figmaStyles.strokeWeight <= 2)
          tailwindClasses.push("border-2");
        else if (figmaStyles.strokeWeight <= 4)
          tailwindClasses.push("border-4");
        else tailwindClasses.push("border-8");
      }
    }
  }

  // Convert shadows
  if (figmaStyles.effects) {
    const shadowEffect = figmaStyles.effects.find(
      (effect: any) => effect.type === "DROP_SHADOW"
    );
    if (shadowEffect) {
      if (
        shadowEffect.offset.x === 0 &&
        shadowEffect.offset.y === 1 &&
        shadowEffect.radius <= 2
      ) {
        tailwindClasses.push("shadow-sm");
      } else if (shadowEffect.offset.y <= 3 && shadowEffect.radius <= 4) {
        tailwindClasses.push("shadow");
      } else if (shadowEffect.offset.y <= 8 && shadowEffect.radius <= 10) {
        tailwindClasses.push("shadow-md");
      } else if (shadowEffect.offset.y <= 15 && shadowEffect.radius <= 15) {
        tailwindClasses.push("shadow-lg");
      } else {
        tailwindClasses.push("shadow-xl");
      }
    }
  }

  return tailwindClasses;
}
