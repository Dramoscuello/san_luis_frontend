export const confirmAlert = (confirm, message, onAccept, options = {}) => {
    const defaultOptions = {
        header: 'Confirmación',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancelar',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Confirmar',
            severity: 'danger'
        }
    };

    confirm.require({
        message,
        ...defaultOptions,
        ...options,
        accept: () => {
            if (onAccept && typeof onAccept === 'function') {
                onAccept();
            }
        }
    });
}