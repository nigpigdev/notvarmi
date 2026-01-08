'use client';

import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function TimeAgo({ date }) {
    if (!date) return null;

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return (
        <span title={dateObj.toLocaleString('tr-TR')}>
            {formatDistanceToNow(dateObj, { addSuffix: true, locale: tr })}
        </span>
    );
}
