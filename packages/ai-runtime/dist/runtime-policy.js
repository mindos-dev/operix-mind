export function isBedrockAllowed(plan) {
    return plan === 'EMPRESA';
}
export function fallbackFor(runtime) {
    if (runtime === 'local')
        return 'api_barata';
    if (runtime === 'api_barata')
        return 'cloud_forte';
    if (runtime === 'cloud_forte')
        return 'api_barata';
    return 'cloud_forte';
}
