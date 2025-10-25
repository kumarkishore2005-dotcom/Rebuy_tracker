
'use client';

import { useMemo } from 'react';
import { useGame } from '@/contexts/game-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

function ActionLogSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                </div>
            ))}
        </div>
    );
}

export function ActionLog() {
    const { logs, isLoading } = useGame();

    const sortedLogs = useMemo(() => {
        return [...logs].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }, [logs]);

    if (isLoading) {
        return <ActionLogSkeleton />;
    }

    return (
        <ScrollArea className="h-96 w-full">
            <div className="p-1">
                {sortedLogs.length > 0 ? (
                    sortedLogs.map(log => (
                        <div key={log.id} className="flex items-start gap-3 text-sm mb-3">
                            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                {format(log.createdAt.toDate(), 'h:mm:ss a')}
                            </span>
                            <p className="flex-1 leading-snug">{log.message}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No actions logged yet.</p>
                )}
            </div>
        </ScrollArea>
    );
}
