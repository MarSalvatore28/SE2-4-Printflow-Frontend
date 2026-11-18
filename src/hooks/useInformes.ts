import { useState, useEffect, useCallback } from 'react';
import { fetchReporteConsolidado, fetchReporteDetallado } from "@services/Reportes/reportes.service";
import { searchMaquinas, fetchAllMaquinas } from "@services/Maquinas/maquinas.service";
import { fetchAllClientes, searchClientes } from "@services/Clientes/clientes.service";
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import type { Maquina } from '@models/Maquina/maquina.types';
import type { ResumenConsolidado, DetalleTransaccion, ResumenDetallado, MaquinaConsolidada } from '@models/Reporte/reporte.types';
import { meses } from '@data/meses.data';

// Resultado de una consulta, con la combinación de filtros que lo produjo.
interface InformeCargado {
    clave: string;
    reportes: MaquinaConsolidada[];
    resumen: ResumenConsolidado;
    transacciones: DetalleTransaccion[];
    resumenDetallado: ResumenDetallado;
}

const mesActual = () => String(new Date().getMonth() + 1).padStart(2, '0');
const añoActual = () => String(new Date().getFullYear());

const generarAños = () => {
    const hoy = new Date();
    const añosArr = [];
    for (let i = 0; i < 5; i++) {
        const val = (hoy.getFullYear() - i).toString();
        añosArr.push({ value: val, label: val });
    }
    return añosArr;
};

export const useInformes = () => {
    const [clientes, setClientes] = useState<ClienteParaTabla[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [errorMaestros, setErrorMaestros] = useState<string | null>(null);

    const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
    const [selectedMaquina, setSelectedMaquina] = useState<number | null>(null);
    const [selectedArea, setSelectedArea] = useState<number | null>(null);
    const [selectedMes, setSelectedMes] = useState<string>(mesActual);
    const [selectedAño, setSelectedAño] = useState<string>(añoActual);

    const [informe, setInforme] = useState<InformeCargado | null>(null);
    const [errorInforme, setErrorInforme] = useState<{ clave: string; mensaje: string } | null>(null);
    const [recargas, setRecargas] = useState(0);

    const años = generarAños();

    // El informe se pide solo cuando están los tres filtros obligatorios.
    // La clave cambia con cualquier filtro y descarta respuestas viejas.
    const completos = Boolean(selectedCliente && selectedMes && selectedAño);
    const periodo = `${selectedAño}-${selectedMes}`;
    const clave = completos
        ? `${selectedCliente}|${periodo}|${selectedArea ?? ''}|${selectedMaquina ?? ''}|${recargas}`
        : null;

    useEffect(() => {
        let cancelado = false;
        Promise.all([fetchAllClientes(), fetchAllMaquinas()])
            .then(([clientesData, maquinasData]) => {
                if (cancelado) return;
                setClientes(clientesData);
                setMaquinas(maquinasData);
            })
            .catch((err) => {
                console.error('Error carga maestros:', err);
                if (!cancelado) setErrorMaestros('Error al conectar con el servidor para cargar listas.');
            });
        return () => { cancelado = true; };
    }, []);

    useEffect(() => {
        if (!clave || !selectedCliente) return;
        let cancelado = false;
        const areaId = selectedArea || undefined;
        const maquinaId = selectedMaquina || undefined;

        Promise.all([
            fetchReporteConsolidado(selectedCliente, periodo, areaId, maquinaId),
            fetchReporteDetallado(selectedCliente, periodo, areaId, maquinaId)
        ])
            .then(([consolidado, detallado]) => {
                if (cancelado) return;
                setErrorInforme(null);
                setInforme({
                    clave,
                    reportes: consolidado.detalles,
                    resumen: consolidado.resumen,
                    transacciones: detallado.detalles,
                    resumenDetallado: detallado.resumen
                });
            })
            .catch((err) => {
                console.error(err);
                if (!cancelado) {
                    setErrorInforme({ clave, mensaje: err instanceof Error ? err.message : 'Error al generar el informe' });
                }
            });

        return () => { cancelado = true; };
    }, [clave, selectedCliente, periodo, selectedArea, selectedMaquina]);

    const vigente = informe && informe.clave === clave ? informe : null;
    const errorVigente = errorInforme && errorInforme.clave === clave ? errorInforme.mensaje : null;

    const reportes = vigente?.reportes ?? [];
    const resumen = vigente?.resumen ?? null;
    const transacciones = vigente?.transacciones ?? [];
    const resumenDetallado = vigente?.resumenDetallado ?? null;
    const loading = Boolean(clave) && !vigente && !errorVigente;
    const error = errorVigente ?? errorMaestros;
    const vistaActual = vigente ? 'consolidado' : 'lista';
    const totalItems = reportes.length;

    // Vuelve a pedir el informe con los mismos filtros.
    const recargarInforme = useCallback(() => setRecargas(n => n + 1), []);

    const handleSearchClientes = async (term: string) => {
        return await searchClientes(term);
    };

    const handleSearchMaquinas = async (term: string) => {
        return await searchMaquinas(term);
    };

    const handleLimpiarFiltros = () => {
        setSelectedCliente(null);
        setSelectedMaquina(null);
        setSelectedArea(null);
        setSelectedMes(mesActual());
        setSelectedAño(añoActual());
    };

    return {
        clientes,
        maquinas,
        selectedCliente, setSelectedCliente,
        selectedMaquina, setSelectedMaquina,
        selectedArea, setSelectedArea,
        selectedMes, setSelectedMes,
        selectedAño, setSelectedAño,
        filtrosCompletos: completos,
        reportes,
        resumen,
        transacciones,
        resumenDetallado,
        loading,
        error,
        vistaActual,
        totalItems,
        meses,
        años,
        recargarInforme,
        handleLimpiarFiltros,
        searchMaquinas: handleSearchMaquinas,
        searchClientes: handleSearchClientes,
    };
};
