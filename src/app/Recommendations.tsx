'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RecommendationsCardProps {
  output: string;
}

export default function Recommendations({ output } : RecommendationsCardProps) {

    return(
        <Card className="flex-grow flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
                <div className="prose max-w-none">
                    {output ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {output}
                    </ReactMarkdown>
                    ) : (
                    <p className="text-border">Recommendations will appear here...</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}