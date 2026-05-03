import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  title: string;
  value: string;
  label?: string;
  badge?: string;
}

const StatCard = ({ title, value, label, badge }: StatCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-3xl font-semibold">{value}</p>
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </div>
        {label ? <p className="text-sm text-gray-600">{label}</p> : null}
      </CardContent>
    </Card>
  );
};

export { StatCard };
