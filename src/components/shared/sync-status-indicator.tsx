'use client';

import { Clock } from 'lucide-react';

export function SyncStatusIndicator() {
    return (
        <div className="fixed bottom-4 left-4 z-50">
            <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span>State: <strong>Live</strong></span>
            </div>
        </div>
    );
}
