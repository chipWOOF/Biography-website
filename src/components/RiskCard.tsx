import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface RiskCardProps {
  title: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  description: string;
}

const RiskCard = ({ title, riskLevel, score, description }: RiskCardProps) => {
  const badgeVariant = riskLevel === 'HIGH' ? 'destructive' : riskLevel === 'MEDIUM' ? 'secondary' : 'default';

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold">{Math.round(score * 100)}%</p>
            <p className="text-sm text-muted-foreground">Risk score</p>
          </div>
          <Badge variant={badgeVariant}>{riskLevel}</Badge>
        </div>
        <Progress value={Math.round(score * 100)} />
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
};

export { RiskCard };
