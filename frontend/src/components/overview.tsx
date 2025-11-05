import { ChartAreaInteractive } from './charts/ChartAreaInteractive';

interface OverviewProps {
  servers: any[];
}

export function Overview({ servers }: OverviewProps) {
  return <ChartAreaInteractive />;
}
