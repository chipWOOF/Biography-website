import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InsightCardProps {
  title: string;
  insights: string[];
  description?: string;
}

const InsightCard = ({ title, insights, description }: InsightCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {insights.map((item, idx) => (
            <Badge key={idx} variant="outline" className="block text-left">
              {item}
            </Badge>
          ))}
        </div>
        {description ? <p className="text-sm text-gray-600">{description}</p> : null}
      </CardContent>
    </Card>
  );
};

export { InsightCard };
