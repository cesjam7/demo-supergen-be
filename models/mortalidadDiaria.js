var db = require('../dbconnection');
const moment = require('moment');

var mortalidadDiaria = {
    getLotes: async (Data) => {
        let json = {}
        try {
            let rows = await db.query(`SELECT idLevante, GROUP_CONCAT(DISTINCT lote_str ORDER BY TipoGenero
            SEPARATOR '-') as Lote FROM lotes WHERE idLevante != 1 GROUP BY idLevante`)
            json = {
                success: true,
                message: "Extracción de Lotes realizado exitosamente.",
                rows
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor /Cartilla/Lotes",
                error: error.code
            }
        }
        return json;
    },
    getCartilla: async (Data) => {
        let json = {}
        try {
            let { idLevante, fecIni, fecFin, TipoCartilla } = Data;

            let cons_prod = await db.query(`SELECT idProduccion FROM produccion WHERE idLevante = ?`, [idLevante])

            let cons_lotes = await db.query(`SELECT idLevante, SUM(IF(TipoGenero = "LH",NumHembras, 0)) AS NroAvesInicioLH, 
            SUM(IF(TipoGenero = "LM",NumHembras, 0)) AS NroAvesInicioLM
            FROM lotes WHERE idLevante = ? GROUP BY idLevante;`, [idLevante])

            let NroAvesInicioLH = 0
            let NroAvesInicioLM = 0
            if (cons_lotes.length != 0) {
                NroAvesInicioLH = cons_lotes[0].NroAvesInicioLH
                NroAvesInicioLM = cons_lotes[0].NroAvesInicioLM
            }

            let idProduccion = null;
            if (cons_prod.length != 0) {
                idProduccion = cons_prod[0].idProduccion;
            }
            //Se sacan la mortalidad_det 
            let periodosMortalidad = await db.query(`SELECT SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
            COUNT(DISTINCT(Semana)) AS rowspan FROM mortalidad_det ms 
            WHERE ms.idLevante = ? GROUP BY Periodo`, [idLevante])
            //si tenemos produccion se saca la mortalidad_prod_det
            // y se aumenta el rowspan que es la cantidad de filas
            // que se espera
            if (idProduccion != null) {
                let periodosMortalidad_prod = await db.query(`SELECT SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
                COUNT(DISTINCT(Semana)) AS rowspan FROM mortalidad_prod_det ms 
                WHERE ms.idProduccion = ? GROUP BY Periodo`, [idProduccion])

                for (let i = 0; i < periodosMortalidad_prod.length; i++) {
                    const p_prod = periodosMortalidad_prod[i];
                    let exist = false
                    for (let j = 0; j < periodosMortalidad.length; j++) {
                        const p = periodosMortalidad[j];
                        if (p_prod.Periodo == p.Periodo) {
                            p.rowspan = p.rowspan + p_prod.rowspan;
                            exist = true;
                        }
                    }
                    if (exist != true) {
                        periodosMortalidad.push(p_prod);
                    }
                }
            }
            periodosMortalidad.forEach(e => { 
                e.exist = false;
                e.rowspan = 0;
            })

            if (TipoCartilla.title == "Mortalidad") {
                let rowsMortalidad = await db.query(`SELECT fecha,GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str 
                    SEPARATOR '-') as NombreLote, ms.idLevante, ms.Semana, SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
                    0 as rowspan, MIN(fecha) as MinimaFecha, MAX(fecha) as MaximaFecha,
                    IF(SUBSTR(MAX(fecha), 9, 11) = SUBSTR(MIN(fecha), 9, 11), SUBSTR(MAX(fecha), 9, 11),
                    CONCAT(SUBSTR(MIN(fecha), 9, 11)," AL ",SUBSTR(MAX(fecha), 9, 11))) as RangoFecha,
                    0 AS NroAvesInicioLH, SUM(IF(lo.TipoGenero = "LH",ms.NoAves, 0)) AS MortalidadLH, 
                    SUM(IF(lo.TipoGenero = "LH",ms.NoEliminados, 0)) as DescartesLH, 
                    SUM(IF(lo.TipoGenero = "LH",ms.ErSex + ms.SelGen, 0)) as VentasLH,
                    0 as IngresosLH, 0 as NroAvesFinalLH, 0 AS NroAvesInicioLM,
                    SUM(IF(lo.TipoGenero = "LM",ms.NoAves, 0)) AS MortalidadLM,
                    SUM(IF(lo.TipoGenero = "LM",ms.NoEliminados, 0)) as DescartesLM,
                    SUM(IF(lo.TipoGenero = "LM",ms.ErSex + ms.SelGen, 0)) as VentasLM,
                    0 as IngresosLM, 0 as NroAvesFinalLM FROM mortalidad_det ms
                    INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idLevante = ?
                    GROUP BY ms.fecha, Periodo`, [idLevante])

                if (idProduccion != null) {
                    let rowsMortalidad_prod = await db.query(`SELECT fecha,GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str SEPARATOR '-') as NombreLote,
                    ms.idProduccion, ms.Semana, SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo, 0 as rowspan,            
                    IF(SUBSTR(MAX(fecha), 9, 11) = SUBSTR(MIN(fecha), 9, 11), SUBSTR(MAX(fecha), 9, 11),
                    CONCAT(SUBSTR(MIN(fecha), 9, 11)," AL ",SUBSTR(MAX(fecha), 9, 11))) as RangoFecha,
                    MIN(fecha) as MinimaFecha, MAX(fecha) as MaximaFecha,
                    0 AS NroAvesInicioLH, SUM(IF(lo.TipoGenero = "LH",ms.NoAves, 0)) AS MortalidadLH, 
                    SUM(IF(lo.TipoGenero = "LH",ms.NoEliminados, 0)) as DescartesLH,
                    0 as VentasLH, 0 as IngresosLH,
                    0 as NroAvesFinalLH, 0 AS NroAvesInicioLM,
                    SUM(IF(lo.TipoGenero = "LM",ms.NoAves, 0)) AS MortalidadLM,
                    SUM(IF(lo.TipoGenero = "LM",ms.NoEliminados, 0)) as DescartesLM,
                    0 as VentasLM, 0 as IngresosLM,
                    0 as NroAvesFinalLM FROM mortalidad_prod_det ms
                    INNER JOIN lotes lo ON lo.idLote = ms.idLote WHERE ms.idProduccion = ?
                    GROUP BY ms.fecha, Periodo`, [idProduccion]);

                    if (rowsMortalidad_prod.length != 0) {
                        for (let i = 0; i < rowsMortalidad_prod.length; i++) {
                            const rMp = rowsMortalidad_prod[i];
                            let cons_ven_ing = await db.query(`SELECT SUM(T.TrasladoLH) AS TrasladoLH, 
                                SUM(T.Cant_IngresoLH) AS Cant_IngresoLH, SUM(T.VentasLH) AS VentasLH,
                                SUM(T.TrasladoLM) AS TrasladoLM, SUM(T.Cant_IngresoLM) AS Cant_IngresoLM, SUM(T.VentasLM) AS VentasLM
                                FROM(SELECT COALESCE(SUM(IF(lo.TipoGenero = "LH",
                                tsv.Traslado, 0)),0) AS TrasladoLH, COALESCE(SUM(IF(lo.TipoGenero = "LH",tsv.Venta, 0)
                                ),0) AS VentasLH, 0 AS Cant_IngresoLH, COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Traslado,
                                0)),0) AS TrasladoLM, COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Venta, 0)),0) AS VentasLM,
                                0 AS Cant_IngresoLM FROM traslado_ingreso_ventas tsv
                                INNER JOIN lotes lo ON lo.idLote = tsv.idLoteOrigen
                                WHERE idProduccionOrigen = ? AND Fecha between ? AND ? UNION
                                SELECT 0 AS TrasladoLH, 0 AS VentaLH, COALESCE(SUM(IF(lo.TipoGenero = "LH",
                                tsv.Cant_Ingreso, 0)),0) AS Cant_IngresoLH, 0 AS TrasladoLM, 0 AS VentaLM, 
                                COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Cant_Ingreso, 0)),0) AS Cant_IngresoLM
                                FROM traslado_ingreso_ventas tsv INNER JOIN lotes lo ON lo.idLote = tsv.idLoteDestino
                                WHERE idProduccionDestino = ? AND Fecha between ? AND ?) as T`, [idProduccion, rMp.MinimaFecha,
                                rMp.MaximaFecha, idProduccion, rMp.MinimaFecha, rMp.MaximaFecha])
                            if (cons_ven_ing.length != 0) {
                                rMp.VentasLH = cons_ven_ing[0].VentasLH
                                rMp.IngresosLH = (cons_ven_ing[0].Cant_IngresoLH - cons_ven_ing[0].TrasladoLH)
                                rMp.VentasLM = cons_ven_ing[0].VentasLM
                                rMp.IngresosLM = (cons_ven_ing[0].Cant_IngresoLM - cons_ven_ing[0].TrasladoLM)
                            }
                            rowsMortalidad.push(rMp)
                        }
                    }
                }
                
                var periodo_actual = {
                    rowspan: 0,
                    periodo: "",
                    init: 0
                }
                var periodos_reales = [];
                if (rowsMortalidad.length != 0) {
                    rowsMortalidad.forEach((e, i) => {
                        let stop = rowsMortalidad.length-1;

                        if(periodo_actual.periodo ==""){
                            periodo_actual.periodo = e.Periodo;
                            periodo_actual.rowspan = periodo_actual.rowspan + 1;
                        } else {
                            if(i < stop && periodo_actual.periodo == e.Periodo){
                                periodo_actual.periodo = e.Periodo;
                                periodo_actual.rowspan = periodo_actual.rowspan + 1;
                            } else if(i < stop && periodo_actual.periodo != e.Periodo){
                                let obj ={
                                    periodo: periodo_actual.periodo,
                                    rowspan: periodo_actual.rowspan,
                                    init: periodo_actual.init
                                };
                                periodos_reales.push(obj);
                                periodo_actual.periodo = e.Periodo;
                                periodo_actual.rowspan = 1;
                                periodo_actual.init = i;
                            } else if(i == stop && periodo_actual.periodo == e.Periodo) {
                                periodo_actual.rowspan = periodo_actual.rowspan + 1;
                                let obj ={
                                    periodo: periodo_actual.periodo,
                                    rowspan: periodo_actual.rowspan,
                                    init: periodo_actual.init
                                };
                                periodos_reales.push(obj);
                            }
                        }
                        /*if (e.Semana == 1) {
                            e.NroAvesInicioLH = NroAvesInicioLH
                            e.NroAvesInicioLM = NroAvesInicioLM
                        } else if (e.Semana > 1) {
                            e.NroAvesInicioLH = rowsMortalidad[i - 1].NroAvesFinalLH
                            e.NroAvesInicioLM = rowsMortalidad[i - 1].NroAvesFinalLM
                        }*/
                        if (i == 0) {
                            e.NroAvesInicioLH = NroAvesInicioLH
                            e.NroAvesInicioLM = NroAvesInicioLM
                        } else {
                            e.NroAvesInicioLH = rowsMortalidad[i - 1].NroAvesFinalLH
                            e.NroAvesInicioLM = rowsMortalidad[i - 1].NroAvesFinalLM
                        }
                        e.NroAvesFinalLH = e.NroAvesInicioLH - e.MortalidadLH - e.DescartesLH - e.VentasLH + e.IngresosLH
                        e.NroAvesFinalLM = e.NroAvesInicioLM - e.MortalidadLM - e.DescartesLM - e.VentasLM + e.IngresosLM
                        e.NroAvesInicio = e.NroAvesInicioLH + e.NroAvesInicioLM
                        e.Mortalidad = e.MortalidadLH + e.MortalidadLM
                        e.porcMortalidad = Number(((e.Mortalidad / e.NroAvesInicio) * 100).toFixed(2))
                        e.Descartes = e.DescartesLH + e.DescartesLM
                        e.porcDescartes = Number(((e.Descartes / e.NroAvesInicio) * 100).toFixed(2))
                        e.Ventas = e.VentasLH + e.VentasLM
                        e.porcVentas = Number(((e.Ventas / e.NroAvesInicio) * 100).toFixed(2))
                        e.Ingresos = e.IngresosLH + e.IngresosLM
                        e.porcIngresos = Number(((e.Ingresos / e.NroAvesInicio) * 100).toFixed(2))
                        e.NroAvesFinal = e.NroAvesFinalLH + e.NroAvesFinalLM
                        if ((typeof fecIni == "undefined" || fecIni == null) && (typeof fecFin == "undefined" || fecFin == null)) {
                            e.show = true
                        } else {
                            if (e.MinimaFecha >= new Date(fecIni) && e.MaximaFecha <= new Date(fecFin)) {
                                e.show = true
                            } else {
                                e.show = false
                            }
                        }

                        /*periodosMortalidad.forEach(p => {
                            if (p.Periodo == e.Periodo) {
                                if (p.exist == false) {
                                    e.rowspan = p.rowspan
                                    e.active = true
                                    p.exist = true
                                } else {
                                    e.active = false
                                }
                            }
                        });*/
                    });
                }

                periodos_reales.forEach((e)=>{
                    rowsMortalidad[e.init].rowspan = e.rowspan;
                    rowsMortalidad[e.init].active = true;
                })
                
                json = {
                    success: true,
                    message: "Extracción de data realizada exitosamente.",
                    rowsMortalidad,
                    TipoCartilla: TipoCartilla.title,
                    periodos_reales: periodos_reales
                }
            } else if (TipoCartilla.title == "Alimentos") {
                let alimentos = await db.query(`SELECT w.idAlimento, w.AR_CDESCRI FROM (
                    SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI 
                    FROM alimento_levante_det ald INNER JOIN tipo_alimento ta ON ta.idAlimento = ald.idAlimento
                    WHERE idLevante = ${idLevante}
                    UNION ALL
                    SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI 
                    FROM alimento_prod_det apd INNER JOIN tipo_alimento ta ON ta.idAlimento = apd.idAlimento
                    WHERE idProduccion = ${idProduccion}) w
                    GROUP BY idAlimento, w.AR_CDESCRI ORDER BY idAlimento`)

                let rowsAlimentos = await db.query(`SELECT GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str 
                    SEPARATOR '-') as NombreLote, ald.idLevante, ald.Semana, SUBSTR(REPLACE(fecha,'-',''), 1, 6)
                    as Periodo, 0 as rowspan, MIN(fecha) as MinimaFecha, MAX(fecha) as MaximaFecha,
                    IF(SUBSTR(MAX(fecha), 9, 11) = SUBSTR(MIN(fecha), 9, 11), SUBSTR(MAX(fecha), 9, 11),
                    CONCAT(SUBSTR(MIN(fecha), 9, 11)," AL ",SUBSTR(MAX(fecha), 9, 11))) as RangoFecha
                    FROM alimento_levante_det ald INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                    WHERE ald.idLevante = ${idLevante} GROUP BY ald.Semana, Periodo UNION ALL
                    SELECT GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str SEPARATOR '-') as NombreLote,
                    ald.idProduccion, ald.Semana, SUBSTR(REPLACE(fecha,'-',''), 1, 6) as Periodo,
                    0 as rowspan, MIN(fecha) as MinimaFecha, MAX(fecha) as MaximaFecha,
                    IF(SUBSTR(MAX(fecha), 9, 11) = SUBSTR(MIN(fecha), 9, 11), SUBSTR(MAX(fecha), 9, 11),
                    CONCAT(SUBSTR(MIN(fecha), 9, 11)," AL ",SUBSTR(MAX(fecha), 9, 11))) as RangoFecha
                    FROM alimento_prod_det ald INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                    WHERE ald.idProduccion = ${idProduccion} GROUP BY ald.Semana, Periodo`)

                if (idProduccion != null) {
                    let alimentos_prod = await db.query(`SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI 
                    FROM alimento_prod_det apd INNER JOIN tipo_alimento ta ON ta.idAlimento = apd.idAlimento
                    WHERE idProduccion = ${idProduccion} GROUP BY idAlimento, AR_CDESCRI ORDER BY AR_CDESCRI`)

                    if (alimentos_prod.length != 0) {
                        for (let i = 0; i < alimentos_prod.length; i++) {
                            const ap = alimentos_prod[i]
                            let exist = false
                            for (let j = 0; j < alimentos.length; j++) {
                                const a = alimentos[j]
                                if (ap.idAlimento == a.idAlimento) {
                                    exist = true
                                }
                            }
                            if (exist == false) {
                                alimentos.push(ap)
                            }
                        }
                    }
                }

                if (rowsAlimentos.length != 0) {
                    for (let i = 0; i < rowsAlimentos.length; i++) {
                        const e = rowsAlimentos[i];
                        if ((typeof fecIni == "undefined" || fecIni == null) && (typeof fecFin == "undefined" || fecFin == null)) {
                            e.show = true
                        } else {
                            if (e.MinimaFecha >= new Date(fecIni) && e.MaximaFecha <= new Date(fecFin)) {
                                e.show = true
                            } else {
                                e.show = false
                            }
                        }
                        let numeros = []
                        let sumLH = 0
                        let numerosLM = []
                        let sumLM = 0
                        for (let r = 0; r < alimentos.length; r++) {
                            const a = alimentos[r];
                            let cons_ali = await db.query(`SELECT SUM(w.CantAlimentoLH) as CantAlimentoLH, SUM(w.CantAlimentoLM) as CantAlimentoLM FROM (
                                SELECT COALESCE(SUM(IF(lo.TipoGenero = "LH",(ald.CantAlimento+ald.CantAlimentoDescarte), 0)),0) as CantAlimentoLH,
                                COALESCE(SUM(IF(lo.TipoGenero = "LM",(ald.CantAlimento+ald.CantAlimentoDescarte), 0)),0) as CantAlimentoLM 
                                FROM alimento_levante_det ald INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                                WHERE idAlimento = ${a.idAlimento} and ald.idLevante = ${idLevante} and ald.Fecha BETWEEN ? and ?
                                UNION ALL
                                SELECT COALESCE(SUM(IF(lo.TipoGenero = "LH",ald.CantAlimento, 0)),0) as CantAlimentoLH,
                                COALESCE(SUM(IF(lo.TipoGenero = "LM",ald.CantAlimento, 0)),0) as CantAlimentoLM FROM alimento_prod_det ald
                                INNER JOIN lotes lo ON lo.idLote = ald.idLote WHERE idAlimento = ${a.idAlimento} and ald.idProduccion = ${idProduccion} and 
                                ald.Fecha BETWEEN ? and ?) w`, [new Date(e.MinimaFecha), new Date(e.MaximaFecha), new Date(e.MinimaFecha), new Date(e.MaximaFecha)])
                            let aliLH = 0
                            let aliLM = 0
                            if (cons_ali.length != 0) {
                                aliLH = cons_ali[0].CantAlimentoLH
                                sumLH += aliLH
                                aliLM = cons_ali[0].CantAlimentoLM
                                sumLM += aliLM
                            }
                            numeros.push(aliLH)
                            numerosLM.push(aliLM)
                        }
                        numeros.push(Number(sumLH.toFixed(2)))
                        numerosLM.push(Number(sumLM.toFixed(2)))
                        for (let j = 0; j < numerosLM.length; j++) {
                            const nu = numerosLM[j];
                            numeros.push(nu)
                        }
                        e.numeros = numeros
                        periodosMortalidad.forEach(p => {
                            if (p.Periodo == e.Periodo) {
                                if (p.exist == false) {
                                    e.rowspan = p.rowspan
                                    e.active = true
                                    p.exist = true
                                } else {
                                    e.active = false
                                }
                            }
                        })
                    }
                }

                json = {
                    success: true,
                    message: "Extracción de data realizada exitosamente.",
                    alimentos,
                    rowsAlimentos,
                    TipoCartilla: TipoCartilla.title
                }
            } else if (TipoCartilla.title == "PHI") {
                let rowsPHI = [];
                if (idProduccion != null) {
                    let periodosPHI = await db.query(`SELECT Periodo, COUNT(DISTINCT(Semana)) AS rowspan 
                    FROM produccion_huevos_det ms WHERE ms.idProduccion = ? GROUP BY Periodo`, [idProduccion])

                    periodosPHI.forEach(e => { e.exist = false })

                    rowsPHI = await db.query(`SELECT 
                        GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str SEPARATOR '-') as NombreLote,
                        ms.idProduccion, ms.Semana, Periodo, 0 as rowspan,
                        IF(SUBSTR(MAX(fechaRegistro), 1, 2) = SUBSTR(MIN(fechaRegistro), 1, 2), SUBSTR(MAX(fechaRegistro), 1, 2),
                        CONCAT(SUBSTR(MIN(fechaRegistro), 1, 2)," AL ",SUBSTR(MAX(fechaRegistro), 1, 2))) as RangoFecha,
                        MIN(fechaRegistro) as MinimaFecha, MAX(fechaRegistro) as MaximaFecha,
                        SUM(IF(lo.TipoGenero = "LH",ms.TotalHI, 0)) AS TotalHILH,
                        SUM(IF(lo.TipoGenero = "LM",ms.TotalHI, 0)) AS TotalHILM,
                        SUM(ms.TotalHNI_Comercial) AS TotalHNI_Comercial,
                        SUM(ms.TotalHNI_REF) as TotalHNI_REF, 0 AS HNI_RotoLH, 0 AS HNI_RotoLM
                        FROM produccion_huevos_det ms
                        INNER JOIN lotes lo ON lo.idLote = ms.IdLote WHERE ms.idProduccion = ${idProduccion}
                        GROUP BY ms.Semana, Periodo`);

                    if (rowsPHI.length != 0) {
                        let SaldoInicial = 0
                        for (let i = 0; i < rowsPHI.length; i++) {
                            const e = rowsPHI[i];
                            e.TotalProduccion = e.TotalHILH + e.TotalHILM + e.TotalHNI_Comercial + e.TotalHNI_REF
                            e.TotalHI = e.TotalHILH + e.TotalHILM
                            e.porcTotalHI = Number((e.TotalHI / e.TotalProduccion * 100).toFixed(0))
                            e.porcTotalHNI_Comercial = Number((e.TotalHNI_Comercial / e.TotalProduccion * 100).toFixed(0))
                            e.MinimaFecha = e.MinimaFecha.split('-').reverse().join('-')
                            e.MaximaFecha = e.MaximaFecha.split('-').reverse().join('-')
                            let consRotos = await db.query(`SELECT 
                            COALESCE(SUM(IF(lo.TipoGenero = "LH",cr.HC, 0)),0) AS RotosLH,
                            COALESCE(SUM(IF(lo.TipoGenero = "LM",cr.HC, 0)),0) AS RotosLM
                            FROM cargas_resumen cr INNER JOIN lotes lo ON lo.idLote = cr.Lote
                            WHERE cr.Fecha_Carga BETWEEN '${e.MinimaFecha}' and '${e.MaximaFecha}'
                            and lo.idProduccion = ${idProduccion}`)
                            if (consRotos.length != 0) {
                                e.HNI_RotoLH = consRotos[0].RotosLH
                                e.HNI_RotoLM = consRotos[0].RotosLM
                            }
                            e.TotalRF = e.TotalHNI_REF + e.HNI_RotoLH + e.HNI_RotoLM
                            e.porcTotalRF = Number((e.TotalRF / e.TotalProduccion * 100).toFixed(0))
                            let consSalidasHC = await db.query(`SELECT 
                            COALESCE(SUM(IF(cr.TipoOperacion = "V",cr.Cantidad, 0)),0) AS Ventas,
                            COALESCE(SUM(IF(cr.TipoOperacion = "D",cr.Cantidad, 0)),0) AS Desmedro,
                            COALESCE(SUM(IF(cr.TipoOperacion = "PF",cr.Cantidad, 0)),0) AS PruebaFertilidad
                            FROM salidas_huevos_comerciales cr INNER JOIN lotes lo ON lo.idLote = cr.idLote
                            WHERE cr.Fecha BETWEEN '${e.MinimaFecha}' and '${e.MaximaFecha}'
                            and lo.idProduccion = ${idProduccion}`)
                            if (consSalidasHC.length != 0) {
                                e.Ventas = consSalidasHC[0].Ventas
                                e.Desmedro = consSalidasHC[0].Desmedro
                                e.PruebaFertilidad = consSalidasHC[0].PruebaFertilidad
                            }
                            e.SaldoInicial = SaldoInicial
                            e.SaldoFinal = SaldoInicial + e.TotalHNI_Comercial - e.Ventas - e.Desmedro - e.PruebaFertilidad
                            SaldoInicial = e.SaldoFinal
                            if ((typeof fecIni == "undefined" || fecIni == null) && (typeof fecFin == "undefined" || fecFin == null)) {
                                e.show = true
                            } else {
                                if (new Date(e.MinimaFecha) >= new Date(fecIni) && new Date(e.MaximaFecha) <= new Date(fecFin)) {
                                    e.show = true
                                } else {
                                    e.show = false
                                }
                            }

                            periodosPHI.forEach(p => {
                                if (p.Periodo == e.Periodo) {
                                    if (p.exist == false) {
                                        e.rowspan = p.rowspan
                                        e.active = true
                                        p.exist = true
                                    } else {
                                        e.active = false
                                    }
                                }
                            })
                        }
                    }
                }
                json = {
                    success: true,
                    message: "Extracción de data realizada exitosamente.",
                    rowsPHI,
                    TipoCartilla: TipoCartilla.title
                }
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor /Cartilla/getCartilla",
                error: error.code
            }
        }
        return json;
    }
}
module.exports = mortalidadDiaria;