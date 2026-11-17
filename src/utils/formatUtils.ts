export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '$0.00';
    }
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

/** Formatea un número entero con coma como separador de miles (sin decimales) */
export const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

/** Formatea un monto monetario: coma como sep. de miles, punto decimal, 2 decimales */
export const formatMoney = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0,00';
    }
    // Intl con es-EC usa punto como separador de miles y coma decimal — lo invertimos
    // usando 'en-US' para obtener el formato correcto internacional (1,234.56)
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/** Formatea fecha a YYYY/MM/DD sin ajuste de zona horaria */
export const formatFechaISO = (fechaStr: string | null | undefined): string => {
    if (!fechaStr) return 'N/A';
    const parte = fechaStr.substring(0, 10); // toma solo YYYY-MM-DD
    const [anio, mes, dia] = parte.split('-');
    if (!anio || !mes || !dia) return parte;
    return `${anio}/${mes}/${dia}`;
};