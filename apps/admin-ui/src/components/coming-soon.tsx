import { Construction } from 'lucide-react';
import { Card, CardContent } from '@biashara-mall/ui/components/ui/card';

export function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Construction className="size-8 text-on-surface-variant" />
        <h2 className="text-title-md text-on-surface">{label}</h2>
        <p className="text-body-sm text-on-surface-variant">Coming soon.</p>
      </CardContent>
    </Card>
  );
}
