import { useState, useEffect, useCallback } from 'react';
import { fetchReporteConsolidado, fetchReporteDetallado } from "@services/Reportes/reportes.service";
import { searchMaquinas, fetchAllMaquinas } from "@services/Maquinas/maquinas.service";
import { fetchAllClientes, searchClientes } from "@services/Clientes/clientes.service";
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import type { Maquina } from '@models/Maquina/maquina.types';
import type { ResumenConsolidado, DetalleTransaccion, ResumenDetallado, MaquinaConsolidada } from '@models/Reporte/reporte.types';
import { meses } from '@data/meses.data'; 

export const useInformes = () => {
    const [clientes, setClientes] = useState<ClienteParaTabla[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);

    const [selectedCliente, setSelectedCliente] = useState<number | null>(null);
    const [selectedMaquina, setSelectedMaquina] = useState<number | null>(null);
    const [selectedArea, setSelectedArea] = useState<number | null>(null);
    
    const currentDate = new Date();
    const [selectedMes, setSelectedMes] = useState<string>(
        String(currentDate.getMonth() + 1).padStart(2, '0')
    );
    const [selectedAño, setSelectedAño] = useState<string>(
        String(currentDate.getFullYear())
    );

    const [reportes, setReportes] = useState<MaquinaConsolidada[]>([]);
    const [resumen, setResumen] = useState<ResumenConsolidado | null>(null);
    
    const [transacciones, setTransacciones] = useState<DetalleTransaccion[]>([]);
    const [resumenDetallado, setResumenDetallado] = useState<ResumenDetallado | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const vistaActual = (reportes.length > 0 || resumen) ? 'consolidado' : 'lista';

    const generarAños = () => {
        const hoy = new Date();
        const añosArr = [];
        for (let i = 0; i < 5; i++) {
            const val = (hoy.getFullYear() - i).toString();
            añosArr.push({ value: val, label: val });
        }
        return añosArr;
    };
    const años = generarAños();
    const totalItems = reportes.length;

    const cargarDatosMaestros = useCallback(async () => {
        try {
            const [clientesData, maquinasData] = await Promise.all([
                fetchAllClientes(),
                fetchAllMaquinas()
            ]);

            setClientes(clientesData);
            setMaquinas(maquinasData);
        } catch (err) {
            console.error('Error carga maestros:', err);
            setError('Error al conectar con el servidor para cargar listas.');
        }
    }, []);

    const handleGenerarConsolidado = useCallback(async () => {
        if (!selectedCliente) return;
        if (!selectedMes || !selectedAño) {
            setError('Seleccione mes y año');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const periodo = `${selectedAño}-${selectedMes}`;

            const data = await fetchReporteConsolidado(
                selectedCliente,
                periodo,
                selectedArea || undefined,
                selectedMaquina || undefined
            );

            setReportes(data.detalles);
            setResumen(data.resumen);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Error al generar reporte');
            setReportes([]);
            setResumen(null);
        } finally {
            setLoading(false);
        }
    }, [selectedCliente, selectedMes, selectedAño, selectedArea, selectedMaquina]);

    const handleGenerarDetallado = useCallback(async () => {
        if (!selectedCliente) return;
        if (!selectedMes || !selectedAño) {
            setError('Seleccione mes y año');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const periodo = `${selectedAño}-${selectedMes}`;

            const data = await fetchReporteDetallado(
                selectedCliente,
                periodo,
                selectedArea || undefined,
                selectedMaquina || undefined
            );

            setTransacciones(data.detalles);
            setResumenDetallado(data.resumen);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Error al generar detallado');
            setTransacciones([]);
            setResumenDetallado(null);
        } finally {
            setLoading(false);
        }
    }, [selectedCliente, selectedMes, selectedAño, selectedArea, selectedMaquina]);

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
        setSelectedMes(String(currentDate.getMonth() + 1).padStart(2, '0'));
        setSelectedAño(String(currentDate.getFullYear()));
        
        setReportes([]);
        setResumen(null);
        setTransacciones([]);
        setResumenDetallado(null);
        setError(null);
    };

    useEffect(() => {
        cargarDatosMaestros();
    }, [cargarDatosMaestros]);

    const handleBuscarTodos = useCallback(() => {
        if (selectedCliente && selectedMes && selectedAño) {
            handleGenerarConsolidado();
            handleGenerarDetallado();
        }
    }, [selectedCliente, selectedMes, selectedAño, handleGenerarConsolidado, handleGenerarDetallado]);

    return {
        clientes,
        maquinas,
        selectedCliente, setSelectedCliente,
        selectedMaquina, setSelectedMaquina,
        selectedArea, setSelectedArea,
        selectedMes, setSelectedMes,
        selectedAño, setSelectedAño,
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
        handleGenerarConsolidado,
        handleGenerarDetallado,
        handleLimpiarFiltros,
        handleBuscarTodos,
        searchMaquinas: handleSearchMaquinas,
        searchClientes: handleSearchClientes,
    };
};