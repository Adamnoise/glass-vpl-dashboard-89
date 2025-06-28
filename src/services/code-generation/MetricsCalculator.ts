
import { CodeMetrics, CodeFile } from '@/types/code-generation';

export class MetricsCalculator {
  private static instance: MetricsCalculator;

  static getInstance(): MetricsCalculator {
    if (!MetricsCalculator.instance) {
      MetricsCalculator.instance = new MetricsCalculator();
    }
    return MetricsCalculator.instance;
  }

  private constructor() {}

  /**
   * Calculate code metrics
   */
  calculateMetrics(finalCode: any, startTime: number): CodeMetrics {
    const totalSize = finalCode.files.reduce((sum: number, file: CodeFile) => sum + file.size, 0);
    const componentFile = finalCode.files.find((f: CodeFile) => f.path.includes('Component'));
    const complexity = componentFile ? this.calculateComplexity(componentFile.content) : 1;
    
    return {
      linesOfCode: finalCode.files.reduce((sum: number, file: CodeFile) => sum + file.content.split('\n').length, 0),
      componentCount: finalCode.files.filter((f: CodeFile) => f.path.includes('Component')).length,
      totalSize,
      complexity,
      maintainabilityIndex: componentFile ? this.calculateMaintainabilityIndex(componentFile.content) : 80,
      duplicateLines: componentFile ? this.findDuplicateLines(componentFile.content) : 0,
      testCoverage: 0, // Default value
      bundleSize: totalSize, // Use totalSize as bundleSize for now
      loadTime: 0, // Default value
      performanceScore: 85, // Default good score
      generationTime: Date.now() - startTime
    };
  }

  private calculateComplexity(content: string): number {
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s*{/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g
    ];
    
    let complexity = 1;
    
    complexityIndicators.forEach(regex => {
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  private calculateMaintainabilityIndex(content: string): number {
    const linesOfCode = content.split('\n').length;
    const complexity = this.calculateComplexity(content);
    
    return Math.max(0, Math.min(100, 100 - (complexity * 2) - (linesOfCode / 10)));
  }

  private findDuplicateLines(content: string): number {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lineCount = new Map<string, number>();
    
    lines.forEach(line => {
      lineCount.set(line, (lineCount.get(line) || 0) + 1);
    });
    
    let duplicates = 0;
    lineCount.forEach(count => {
      if (count > 1) {
        duplicates += count - 1;
      }
    });
    
    return duplicates;
  }
}

export const metricsCalculator = MetricsCalculator.getInstance();
