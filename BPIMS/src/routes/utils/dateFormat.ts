export function formatTransactionDate(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    return `${formattedDate} ${formattedTime}`;
}

export function formatTransactionDateOnly(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return formattedDate;
}

export function formatTransactionTime(dateString: string): string {
    const date = new Date(dateString);

    const formattedDate = date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    return formattedTime;
}

export function capitalizeFirstLetter(name: string): string {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
