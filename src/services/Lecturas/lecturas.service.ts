// S3-04 · Lectura manual: registrar los contadores leídos en la máquina
import { apiFetch } from '@services/api';
import { ErrorLecturaManual, type LecturaManual, type LecturaManualFormData } from '@models/Lectura/lectura.types';

const RESOURCE_URL = '/api/lecturas';

/**
 * Registra la lectura. Si la API la rechaza (datos inválidos, asignación no vigente o una regla
 * de validarLectura), lanza ErrorLecturaManual con el motivo que mandó el backend, tal cual.
 */
export async function registrarLecturaManual(datos: LecturaManualFormData): Promise<LecturaManual> {
    const res = await apiFetch(`${RESOURCE_URL}/manual`, {
        method: 'POST',
        body: JSON.stringify(datos),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
        throw new ErrorLecturaManual(
            body?.message || `No se pudo registrar la lectura (${res.status})`,
            body?.codigo ?? null
        );
    }
    return body.data as LecturaManual;
}
