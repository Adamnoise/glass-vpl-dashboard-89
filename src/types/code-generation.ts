
export interface CodeGenerationConfig {
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'html';
  typescript: boolean;
  styling: 'css' | 'scss' | 'tailwind' | 'styled-components';
  componentLibrary?: 'mui' | 'antd' | 'chakra' | 'custom';
  optimization: {
    treeshaking: boolean;
    bundleAnalysis: boolean;
    codesplitting: boolean;
    lazyLoading: boolean;
  };
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    screenReader: boolean;
    keyboardNavigation: boolean;
    colorContrast: boolean;
  };
  testing: {
    unitTests: boolean;
    integrationTests: boolean;
    e2eTests: boolean;
    visualRegression: boolean;
  };
}

export interface GeneratedCode {
  id: string;
  timestamp: Date;
  config: CodeGenerationConfig;
  files: CodeFile[];
  structure: ProjectStructure;
  metrics: CodeMetrics;
  quality: QualityAssessment;
  preview: string;
  buildStatus: 'success' | 'warning' | 'error';
  buildLogs: BuildLog[];
}

export interface QualityAssessment {
  overall: number;
  categories: {
    visual: number;
    code: number;
    performance: number;
    accessibility: number;
    maintainability: number;
    security: number;
  };
  issues: QualityIssue[];
  recommendations: string[];
  aiSuggestions?: string[];
}

export interface QualityIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  category: 'visual' | 'code' | 'performance' | 'accessibility' | 'maintainability' | 'security';
}

export interface CodeFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
  language: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
}

export interface ProjectStructure {
  root: string;
  components: string[];
  hooks: string[];
  utils: string[];
  types: string[];
  styles: string[];
  tests: string[];
  assets: string[];
}

export interface CodeMetrics {
  linesOfCode: number;
  componentCount: number;
  totalSize: number;
  complexity: number;
  maintainabilityIndex: number;
  duplicateLines: number;
  testCoverage: number;
  bundleSize: number;
  loadTime: number;
  performanceScore: number;
  generationTime: number;
}

export interface BuildLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface ComponentMapping {
  figmaNodeId: string;
  componentName: string;
  componentType: 'functional' | 'class' | 'hook';
  props: ComponentProp[];
  state: StateDefinition[];
  methods: MethodDefinition[];
  lifecycle: LifecycleMethod[];
  styling: StylingDefinition;
  accessibility: AccessibilityFeatures;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description: string;
}

export interface StateDefinition {
  name: string;
  type: string;
  initialValue: any;
  updaters: string[];
}

export interface MethodDefinition {
  name: string;
  parameters: Parameter[];
  returnType: string;
  description: string;
  implementation: string;
}

export interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: any;
}

export interface LifecycleMethod {
  name: string;
  phase: 'mount' | 'update' | 'unmount';
  implementation: string;
}

export interface StylingDefinition {
  approach: 'css' | 'scss' | 'tailwind' | 'styled-components';
  classes: string[];
  variables: CSSVariable[];
  responsive: ResponsiveBreakpoint[];
  animations: AnimationDefinition[];
}

export interface CSSVariable {
  name: string;
  value: string;
  description: string;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  styles: Record<string, string>;
}

export interface AnimationDefinition {
  name: string;
  keyframes: Keyframe[];
  duration: string;
  timing: string;
  iterations: string;
}

export interface Keyframe {
  offset: number;
  styles: Record<string, string>;
}

export interface AccessibilityFeatures {
  ariaLabels: AriaLabel[];
  keyboardNavigation: KeyboardHandler[];
  screenReader: ScreenReaderFeature[];
  colorContrast: ContrastCheck;
  focusManagement: FocusFeature[];
}

export interface AriaLabel {
  element: string;
  attribute: string;
  value: string;
  description: string;
}

export interface KeyboardHandler {
  key: string;
  action: string;
  element: string;
  description: string;
}

export interface ScreenReaderFeature {
  type: 'landmark' | 'heading' | 'description' | 'live-region';
  element: string;
  content: string;
  level?: number;
}

export interface ContrastCheck {
  foreground: string;
  background: string;
  ratio: number;
  wcagLevel: 'AA' | 'AAA';
  passes: boolean;
}

export interface FocusFeature {
  element: string;
  tabIndex: number;
  focusVisible: boolean;
  trapFocus?: boolean;
}
