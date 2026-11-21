import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Search, X, Loader2, ChevronDown } from 'lucide-react';

interface BuscadorInteligenteProps<T> {
    placeholder?: string;
    buscarFn: (termino: string) => Promise<T[]>;
    onSeleccionar: (item: T) => void;
    renderItem: (item: T) => React.ReactNode;
    getItemKey: (item: T) => string | number;
    getItemLabel?: (item: T) => string;
    minCaracteres?: number;
    debounceTime?: number;
    className?: string;
    disabled?: boolean;
    itemsCompletos?: T[];
    onEnter?: (termino: string) => void;
    onClear?: () => void;
    onInputChange?: (value: string) => void;
    onSearchClick?: (termino: string) => void;
    initialValue?: string;
    isInModal?: boolean;
}

export function BuscadorInteligente<T>({
    placeholder = "Buscar...",
    buscarFn,
    onSeleccionar,
    renderItem,
    getItemKey,
    getItemLabel,
    minCaracteres = 1,
    debounceTime = 300,
    className = "",
    disabled = false,
    itemsCompletos = [],
    onEnter,
    onClear,
    onInputChange,
    onSearchClick,
    initialValue = "",
    isInModal = false
}: BuscadorInteligenteProps<T>) {

    const [termino, setTermino] = useState(initialValue);
    const [resultados, setResultados] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<number | null>(null);
    const initialValueRef = useRef(initialValue);
    const itemSeleccionadoRef = useRef(false);
    const lastSearchedTermRef = useRef<string | null>(null);
    const idLista = useId();
    const idOpcion = (index: number) => `${idLista}-opcion-${index}`;

    // La opción marcada con las flechas siempre queda a la vista dentro de la lista
    useEffect(() => {
        if (!mostrarResultados || indiceSeleccionado < 0) return;
        document.getElementById(`${idLista}-opcion-${indiceSeleccionado}`)?.scrollIntoView?.({ block: 'nearest' });
    }, [idLista, indiceSeleccionado, mostrarResultados]);

    useEffect(() => {
        if (isInModal && !itemSeleccionadoRef.current) {
            return;
        }

        if (initialValue !== initialValueRef.current && !itemSeleccionadoRef.current) {
            setTermino(initialValue);
            initialValueRef.current = initialValue;
        }
        itemSeleccionadoRef.current = false;
    }, [initialValue, isInModal]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setMostrarResultados(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const realizarBusqueda = useCallback(async (valorBusqueda: string) => {
        if (itemSeleccionadoRef.current) {
            return;
        }

        if (valorBusqueda === lastSearchedTermRef.current) {
            return;
        }

        if (isInModal && valorBusqueda === initialValueRef.current && initialValueRef.current !== "") {
            return;
        }

        if (valorBusqueda === initialValueRef.current && initialValueRef.current !== "") {
            return;
        }

        if (valorBusqueda.length === 0) {
            setResultados(itemsCompletos);
            lastSearchedTermRef.current = "";
            return;
        }

        if (valorBusqueda.length < minCaracteres) {
            setResultados([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const datos = await buscarFn(valorBusqueda);
            setResultados(datos);
            lastSearchedTermRef.current = valorBusqueda;
            setIndiceSeleccionado(-1);
        } catch (err) {
            console.error('Error en búsqueda:', err);
            setError('Error al buscar');
            setResultados([]);
            lastSearchedTermRef.current = null;
        } finally {
            setLoading(false);
        }
    }, [buscarFn, minCaracteres, itemsCompletos, isInModal]);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            realizarBusqueda(termino);
        }, debounceTime);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [termino, debounceTime, realizarBusqueda]);

    const handleInputClick = () => {
        if (termino.length === 0 && itemsCompletos.length > 0) {
            setResultados(itemsCompletos);
            setMostrarResultados(true);
        } else if (termino.length >= minCaracteres) {
            setMostrarResultados(true);
        }
    };

    const handleSeleccionar = (item: T) => {
        itemSeleccionadoRef.current = true; 
        onSeleccionar(item);
        if (getItemLabel) {
            const label = getItemLabel(item);
            setTermino(label);
            initialValueRef.current = label;
        }
        setMostrarResultados(false);
        setIndiceSeleccionado(-1);
    };

    const handleLimpiar = () => {
        setTermino("");
        initialValueRef.current = "";
        itemSeleccionadoRef.current = false;
        lastSearchedTermRef.current = "";
        setResultados(itemsCompletos);
        setMostrarResultados(false);
        setError(null);
        setIndiceSeleccionado(-1);
        if (onClear) onClear();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!mostrarResultados || !resultados || resultados.length === 0) {
            if (e.key === 'ArrowDown' && itemsCompletos.length > 0) {
                e.preventDefault();
                setResultados(itemsCompletos);
                setMostrarResultados(true);
                setIndiceSeleccionado(0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIndiceSeleccionado(prev =>
                    prev < resultados.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setIndiceSeleccionado(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (resultados && indiceSeleccionado >= 0 && indiceSeleccionado < resultados.length) {
                    handleSeleccionar(resultados[indiceSeleccionado]);
                } else if (onEnter) {
                    onEnter(termino);
                    setMostrarResultados(false);
                }
                break;
            case 'Escape':
                // Cierra solo la lista, no el modal en el que esté el buscador
                e.stopPropagation();
                setMostrarResultados(false);
                setIndiceSeleccionado(-1);
                break;
        }
    };

    const generarKeyUnica = (item: T, index: number, esResultadoBusqueda: boolean): string => {
        try {
            const baseKey = getItemKey(item);
            const prefijo = esResultadoBusqueda ? 'search' : 'initial';
            const keyFinal = `${prefijo}-${baseKey}`;

            if (!baseKey && baseKey !== 0) {
                console.warn(`Item sin key válida en lista ${prefijo}:`, item);
                return `${prefijo}-fallback-${index}`;
            }

            return keyFinal;
        } catch (error) {
            console.error('Error generando key:', error, item);
            return `error-${index}-${Math.random()}`;
        }
    };

    const listaVisible = mostrarResultados && !error && resultados.length > 0;
    const opcionActiva = listaVisible && indiceSeleccionado >= 0 && indiceSeleccionado < resultados.length
        ? idOpcion(indiceSeleccionado)
        : undefined;

    const alTeclearOpcion = (e: React.KeyboardEvent, item: T) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSeleccionar(item);
        }
    };

    let botonLimpiar: React.ReactNode = null;
    if (loading) {
        botonLimpiar = <Loader2 aria-hidden="true" className="w-5 h-5 text-primary animate-spin" />;
    } else if (termino.length > 0) {
        botonLimpiar = (
            <button
                onClick={handleLimpiar}
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                type="button"
                aria-label="Limpiar búsqueda"
            >
                <X aria-hidden="true" className="w-5 h-5" />
            </button>
        );
    }

    const renderResultados = () => {
        if (error) {
            return (
                <div className="p-4 text-center text-red-600" role="alert">
                    <p>{error}</p>
                </div>
            );
        }
        if (resultados.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500" role="status">
                    <p>No se encontraron resultados</p>
                </div>
            );
        }
        const esResultadoBusqueda = termino.length >= minCaracteres;
        return (
            <ul id={idLista} role="listbox" aria-label={placeholder} className="py-1">
                {resultados.map((item, index) => (
                    <li
                        key={generarKeyUnica(item, index, esResultadoBusqueda)}
                        id={idOpcion(index)}
                        role="option"
                        aria-selected={index === indiceSeleccionado}
                        tabIndex={-1}
                        onClick={() => handleSeleccionar(item)}
                        onKeyDown={(e) => alTeclearOpcion(e, item)}
                        className={`px-4 py-2 cursor-pointer transition-colors ${index === indiceSeleccionado
                                ? 'bg-secondary/10 border-l-4 border-primary'
                                : 'hover:bg-gray-50'
                            }`}
                        onMouseEnter={() => setIndiceSeleccionado(index)}
                    >
                        {renderItem(item)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search aria-hidden="true" className="w-5 h-5 text-gray-400" />
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        role="combobox"
                        aria-label={placeholder}
                        aria-autocomplete="list"
                        aria-expanded={listaVisible}
                        aria-controls={listaVisible ? idLista : undefined}
                        aria-activedescendant={opcionActiva}
                        value={termino}
                        onChange={(e) => {
                            itemSeleccionadoRef.current = false; 
                            const val = e.target.value;
                            setTermino(val);
                            setMostrarResultados(true);
                            if (val === '' && onClear) {
                                onClear();
                                setResultados(itemsCompletos);
                            }
                            if (onInputChange) onInputChange(val);
                        }}
                        onKeyDown={handleKeyDown}
                        onClick={handleInputClick}
                        onFocus={handleInputClick}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    />

                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                        {botonLimpiar}

                        <button
                            onClick={() => {
                                if (mostrarResultados) {
                                    setMostrarResultados(false);
                                } else {
                                    setResultados(itemsCompletos);
                                    setMostrarResultados(true);
                                }
                            }}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            type="button"
                            aria-label={mostrarResultados ? 'Ocultar opciones' : 'Mostrar opciones'}
                        >
                            <ChevronDown aria-hidden="true" className={`w-5 h-5 transition-transform ${mostrarResultados ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {onSearchClick && (
                    <button
                        type="button"
                        onClick={() => {
                            onSearchClick(termino);
                            setMostrarResultados(false);
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 font-medium"
                    >
                        <Search className="w-4 h-4" />
                        Buscar
                    </button>
                )}
            </div>

            {termino.length > 0 && termino.length < minCaracteres && !mostrarResultados && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-500">
                        Escribe al menos {minCaracteres} caracteres para buscar
                    </p>
                </div>
            )}

            {mostrarResultados && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {renderResultados()}
                </div>
            )}
        </div>
    );
}

export default BuscadorInteligente;