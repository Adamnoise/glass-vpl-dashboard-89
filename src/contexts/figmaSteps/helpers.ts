export const combineCodePieces = (generatedTsx: string, manualJsx: string, figmaData: any): string => {
  let finalCode = generatedTsx;

  // If manual JSX is provided, integrate it
  if (manualJsx.trim()) {
    // Find the return statement and add manual JSX as children or additional elements
    const returnMatch = finalCode.match(/return\s*\(\s*([\s\S]*?)\s*\);/);
    if (returnMatch) {
      const originalJsx = returnMatch[1].trim();
      
      // If the original JSX is an SVG, wrap both in a fragment
      if (originalJsx.startsWith('<svg')) {
        const mergedJsx = `
    <React.Fragment>
      ${originalJsx}
      {/* Additional JSX */}
      ${manualJsx}
    </React.Fragment>`;
        finalCode = finalCode.replace(returnMatch[0], `return (${mergedJsx}\n  );`);
      } else {
        // Otherwise, append to existing structure
        const mergedJsx = `${originalJsx}\n      {/* Additional JSX */}\n      ${manualJsx}`;
        finalCode = finalCode.replace(returnMatch[0], `return (\n    ${mergedJsx}\n  );`);
      }
    }
  }

  // Add Figma metadata as comments
  if (figmaData) {
    const metadata = `/*
 * Generated from Figma Design
 * File: ${figmaData.file?.name || 'Unknown'}
 * Generated: ${new Date().toISOString()}
 * Components: ${figmaData.metadata?.componentCount || 0}
 * Styles: ${figmaData.metadata?.styleCount || 0}
 */

`;
    finalCode = metadata + finalCode;
  }

  return finalCode;
};

export const combineCssCode = (baseCss: string, additionalCss: string, figmaData: any): string => {
  let finalCss = '';

  // Add header comment
  if (figmaData) {
    finalCss += `/*
 * Styles for Figma Component: ${figmaData.file?.name || 'Unknown'}
 * Generated: ${new Date().toISOString()}
 */

`;
  }

  // Add base CSS
  if (baseCss.trim()) {
    finalCss += `/* Base Styles */
${baseCss}

`;
  }

  // Add additional CSS
  if (additionalCss.trim()) {
    finalCss += `/* Additional Styles */
${additionalCss}

`;
  }

  // Add responsive utilities
  finalCss += `/* Responsive Utilities */
@media (max-width: 768px) {
  .figma-component {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .figma-component {
    padding: 0.5rem;
  }
}`;

  return finalCss;
};
