export function classifyDevice(device) {
    if (device.tipoDispositivo === 'mobile')
        return 'low';
    if (device.tipoDispositivo === 'tablet' && (device.memoriaGb || 0) < 8)
        return 'low';
    if ((device.memoriaGb || 0) >= 16 && device.suportaWebGPU)
        return 'high';
    if ((device.memoriaGb || 0) >= 8 || device.suportaWasm)
        return 'medium';
    return 'low';
}
