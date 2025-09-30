
const seconds = (s: number) => 1000 * s;
const minutes = (m: number) => seconds(60) * m;
const hours = (h: number) => minutes(60) * h;
const days = (d: number) => hours(24) * d;

const intervals = [
    { ge: days(365), divisor: days(365), unit: 'year' },
    { ge: days(30), divisor: days(30), unit: 'month' },
    { ge: days(7), divisor: days(7), unit: 'week' },
    { ge: days(1), divisor: days(1), unit: 'day' },
    { ge: hours(1), divisor: hours(1), unit: 'hour' },
    { ge: minutes(1), divisor: minutes(1), unit: 'minute' },
    { ge: seconds(5), divisor: seconds(1), unit: 'second' },
];

export function timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();

    if (diff < seconds(5)) {
        return 'just now';
    }

    for (const interval of intervals) {
        if (diff >= interval.ge) {
            const count = Math.floor(diff / interval.divisor);
            return `${count} ${interval.unit}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}
