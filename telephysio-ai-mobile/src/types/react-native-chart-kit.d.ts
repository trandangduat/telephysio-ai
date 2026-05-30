declare module 'react-native-chart-kit' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    decimalPlaces?: number;
    color?: (opacity: number) => string;
    labelColor?: (opacity: number) => string;
    style?: ViewStyle;
    propsForDots?: Record<string, any>;
    propsForBackgroundLines?: Record<string, any>;
    propsForLabels?: Record<string, any>;
  }

  export interface LineChartData {
    labels: string[];
    datasets: { data: number[]; color?: (opacity: number) => string; strokeWidth?: number }[];
    legend?: string[];
  }

  export interface LineChartProps {
    data: LineChartData;
    width: number;
    height: number;
    chartConfig: ChartConfig;
    bezier?: boolean;
    style?: ViewStyle;
    withInnerLines?: boolean;
    withOuterLines?: boolean;
    withVerticalLines?: boolean;
    withHorizontalLines?: boolean;
    withDots?: boolean;
    withShadow?: boolean;
    withScrollableDot?: boolean;
    fromZero?: boolean;
    yAxisLabel?: string;
    yAxisSuffix?: string;
    xAxisLabel?: string;
    xLabelsOffset?: number;
    yLabelsOffset?: number;
    segments?: number;
    renderDotContent?: (params: { x: number; y: number; index: number }) => React.ReactNode;
    onDataPointClick?: (data: { value: number; dataset: any; x: number; y: number; getColor: (opacity: number) => string }) => void;
  }

  export class LineChart extends Component<LineChartProps> {}
}
