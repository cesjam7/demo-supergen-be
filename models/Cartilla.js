var db = require('../dbconnection');
var fs = require('fs');
var Excel = require('exceljs');
const moment = require('moment');
var workbook = new Excel.Workbook();

var Cartilla = {
    Lotes: async () => {
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
                    GROUP BY ms.semana, Periodo`, [idLevante])
                const dataTrasladoLevante = await db.query(`SELECT semana_mls,SUM(T.TrasladoLH) AS TrasladoLH, 
                SUM(T.Cant_IngresoLH) AS Cant_IngresoLH, SUM(T.VentasLH) AS VentasLH,
                SUM(T.TrasladoLM) AS TrasladoLM, SUM(T.Cant_IngresoLM) AS Cant_IngresoLM, SUM(T.VentasLM) AS VentasLM
                FROM(
                SELECT COALESCE(SUM(IF(lo.TipoGenero = "LH",
                tsv.Traslado, 0)),0) AS TrasladoLH, COALESCE(SUM(IF(lo.TipoGenero = "LH",tsv.Venta, 0)
                ),0) AS VentasLH, 0 AS Cant_IngresoLH, COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Traslado,
                0)),0) AS TrasladoLM, COALESCE(SUM(IF(lo.TipoGenero = "LM",tsv.Venta, 0)),0) AS VentasLM,
                0 AS Cant_IngresoLM,mls.semana_mls  FROM traslado_ingreso_ventas tsv
                INNER JOIN lotes lo ON lo.idLote = tsv.idLoteOrigen
                left join (select idLote , fecha fec_mls , max(semana) semana_mls 
                           from mortalidad_det where idLevante='${idLevante}' 
                           group by idLote, fecha) mls on mls.idLote=tsv.idLoteOrigen and mls.fec_mls=tsv.Fecha           
               WHERE idLevanteOrigen =${idLevante} AND Fecha between ? AND ? 
                ) as T group by semana_mls
`, [fecIni, fecFin])
                if (rowsMortalidad.length > 0 && dataTrasladoLevante.length > 0) {
                    for (const mortalidadLevante of rowsMortalidad) {
                        const ingresoLh = dataTrasladoLevante.find(d => d.semana_mls == mortalidadLevante.Semana)
                        if (ingresoLh != undefined) {
                            mortalidadLevante.IngresosLH = -1 * ingresoLh.TrasladoLH
                        }
                    }


                }

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
                    GROUP BY ms.semana, Periodo`, [idProduccion]);

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
                        /*let stop = rowsMortalidad.length-1;

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
                        }*/
                        if (e.Semana == 1) {
                            e.NroAvesInicioLH = NroAvesInicioLH
                            e.NroAvesInicioLM = NroAvesInicioLM
                        } else if (e.Semana > 1) {
                            e.NroAvesInicioLH = rowsMortalidad[i - 1].NroAvesFinalLH
                            e.NroAvesInicioLM = rowsMortalidad[i - 1].NroAvesFinalLM
                        }
                        /*if (i == 0) {
                            e.NroAvesInicioLH = NroAvesInicioLH
                            e.NroAvesInicioLM = NroAvesInicioLM
                        } else {
                            e.NroAvesInicioLH = rowsMortalidad[i - 1].NroAvesFinalLH
                            e.NroAvesInicioLM = rowsMortalidad[i - 1].NroAvesFinalLM
                        }*/
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
                        });
                    });
                }

                /*periodos_reales.forEach((e)=>{
                    rowsMortalidad[e.init].rowspan = e.rowspan;
                    rowsMortalidad[e.init].active = true;
                })*/

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
    },
    ExportExcelAlimentos: function (alimentos = [], rowsAlimentos = [], lotesSelected) {
        let rutaCM = "/template/consulta_cartilla_alimento.xlsx";
        const fileCartilla = this;
        try {
            if (fs.existsSync("./template/consulta_cartilla alimento.xlsx")) {
                fs.unlinkSync("./template/consulta_cartilla_alimento.xlsx")
            }
            workbook.xlsx.readFile('./template/Plantilla consulta cartilla alimento.xlsx')
                .then(async function (work) {
                    return new Promise((resolve, reject) => {
                        workbook.eachSheet(async function (worksheet, sheetId) {
                            const consLevante = await db.query(`SELECT GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str 
                                SEPARATOR '-') as nombreLote FROM lotes WHERE idLevante = ${lotesSelected}`);
                            const nombreLote = consLevante.length != 0 ? consLevante[0].nombreLote : 'LH45-LM46'
                            const lotesName = nombreLote.split("-");
                            const borderStyles = {
                                top: { style: "thin" },
                                left: { style: "thin" },
                                bottom: { style: "thin" },
                                right: { style: "thin" }
                            };
                            worksheet.name = `${lotesName[0]}-${lotesName[1]} Alimento`;
                            worksheet.getCell("A2").value = `PRODUCCION CONSUMO ALIMENTOS ${nombreLote}-${moment().format("YYYY")}`
                            worksheet.getCell("A2").font = {
                                bold: true,
                                size: 12
                            }
                            worksheet.mergeCells(2, 1, 2, alimentos.length * 2 + 5);
                            let cellN = 5;
                            let cellP = 5;
                            let initNumberColumnForNubers = 4;
                            fileCartilla.generateCabeceraCartillaAlimentosPorLotes(alimentos, lotesName[0], worksheet)
                            fileCartilla.generateCabeceraCartillaAlimentosPorLotes(alimentos, lotesName[1], worksheet, alimentos.length + 5)
                            rowsAlimentos.forEach((alimento, index) => {
                                const row = worksheet.getRow(cellN);
                                if (alimento.show) {
                                    worksheet.getCell(`A${cellN}`).value = alimento.Periodo;
                                    worksheet.getCell(`A${cellN}`).font = {
                                        size: 9, family: "calibri"
                                    }
                                    worksheet.getCell(`B${cellN}`).value = alimento.RangoFecha;
                                    worksheet.getCell(`B${cellN}`).font = {
                                        size: 8,
                                        bold: true
                                    };
                                    worksheet.getCell(`B${cellN}`).border = borderStyles;
                                    worksheet.getCell(`C${cellN}`).value = `Semana ${alimento.Semana}`;
                                    worksheet.getCell(`C${cellN}`).font = {
                                        family: "calibri",
                                        size: 8,
                                        bold: true
                                    };
                                    worksheet.getCell(`C${cellN}`).border = borderStyles;
                                    alimento.numeros.forEach((numero) => {
                                        row.getCell(initNumberColumnForNubers).value = numero
                                        row.getCell(initNumberColumnForNubers).border = borderStyles;
                                        initNumberColumnForNubers++;
                                    })
                                    initNumberColumnForNubers = 4;
                                    if (alimento.active == true) {
                                        worksheet.mergeCells(`A${cellP}:A${(cellP + (alimento.rowspan - 1))}`)
                                        worksheet.getCell(`A${cellP}`).border = {
                                            top: { style: "thin" },
                                            left: { style: "thin" },
                                            bottom: { style: "thin" },
                                            right: { style: "thin" }
                                        }
                                        worksheet.getCell('A' + (cellP)).alignment = {
                                            vertical: 'middle',
                                            horizontal: 'center'
                                        }
                                        cellP = cellP + alimento.rowspan;
                                    }
                                    cellN++;
                                }
                            })
                            setTimeout(() => resolve(), 2000);
                        })
                    }).then(data => {
                        workbook.xlsx.writeFile("./template/consulta_cartilla_alimento.xlsx").then(function () {
                            console.log("xls file is written.");
                        });
                    })
                });
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM
            }
        }
        return json
    },
    generateCabeceraCartillaAlimentosPorLotes: function (alimentos = [], lote, worksheet, initColumn = 4) {
        let counterColumn = initColumn;
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };

        const row = worksheet.getRow(4);
        alimentos.forEach((alimento) => {
            row.getCell(counterColumn).value = alimento.AR_CDESCRI
            row.getCell(counterColumn).font = {
                size: 8
            }
            row.getCell(counterColumn).alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            row.getCell(counterColumn).border = borderStyles
            counterColumn++;
        })
        row.getCell(counterColumn).value = "TOTAl"
        row.getCell(counterColumn).alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        row.getCell(counterColumn).font = {
            size: 8
        }
        row.getCell(counterColumn).border = borderStyles;
        worksheet.getRow(3).getCell(initColumn).value = lote
        worksheet.getRow(3).getCell(initColumn).alignment = { vertical: "middle", horizontal: "center" }
        worksheet.getRow(3).getCell(initColumn).border = borderStyles;
        worksheet.mergeCells(3, initColumn, 3, counterColumn)

    },
    nombreMes: (param) => {
        if (param == '01') {
            return 'Enero';
        } else if (param == '02') {
            return 'Febrero';
        } else if (param == '03') {
            return 'Marzo';
        } else if (param == '04') {
            return 'Abril';
        } else if (param == '05') {
            return 'Mayo';
        } else if (param == '06') {
            return 'Junio';
        } else if (param == '07') {
            return 'Julio';
        } else if (param == '08') {
            return 'Agosto';
        } else if (param == '09') {
            return 'Setiembre';
        } else if (param == '10') {
            return 'Octubre';
        } else if (param == '11') {
            return 'Noviembre';
        } else if (param == '12') {
            return 'Diciembre';
        }
    },
    YearMonth: (param) => {
        let m = param.substr(4, 5);
        let y = param.substr(0, 4);
        return Cartilla.nombreMes(m).substr(0, 3) + ".-" + y.substr(2, 4);
    },
    ExportExcelPhi: async (data) => {
        let rutaTemplateCPHI = "/template/CPHI.xlsx";
        try {
            const { idLevante, fecIni, fecFin, TipoCartilla, Rows, Alimentos } = data
            const today = new Date();
            const yearOfToday = today.getFullYear();
            if (fs.existsSync(`.${rutaTemplateCPHI}`)) {
                fs.unlinkSync(`.${rutaTemplateCPHI}`)
            }
            const consLevante = await db.query(`SELECT GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str 
    SEPARATOR '-') as nombreLote FROM lotes WHERE idLevante = ${idLevante}`);
            const nombreLote = consLevante.length != 0 ? consLevante[0].nombreLote : 'LH45-LM46'
            workbook.xlsx.readFile("./template/PlantillaCPHI.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.name = `${nombreLote} PHI`
                            worksheet.getCell("B1").value = `PRODUCCON DE HUEVOS FERTILES y NO FERTILES ${nombreLote}-${yearOfToday}`
                            let cellN = 5;
                            let cellP = 5;
                            for (let i = 0; i < Rows.length; i++) {
                                const c = Rows[i];
                                let bottom = 'thin'
                                if (typeof Rows[i + 1] != "undefined") {
                                    if (c.Periodo != Rows[i + 1].Periodo) {
                                        bottom = 'medium'
                                    }
                                } else {
                                    bottom = 'medium'
                                }
                                if (c.show == true) {
                                    //RangoFecha
                                    worksheet.getCell('C' + (cellN)).value = c.RangoFecha
                                    worksheet.getCell('D' + (cellN)).value = "Semana " + c.Semana
                                    worksheet.getCell('E' + (cellN)).value = c.TotalHILH
                                    worksheet.getCell('F' + (cellN)).value = c.TotalHILM
                                    worksheet.getCell('G' + (cellN)).value = c.TotalHNI_Comercial
                                    worksheet.getCell('H' + (cellN)).value = c.TotalHNI_REF
                                    worksheet.getCell('I' + (cellN)).value = c.TotalProduccion
                                    worksheet.getCell('J' + (cellN)).value = c.TotalHILH
                                    worksheet.getCell('K' + (cellN)).value = 0
                                    worksheet.getCell('M' + (cellN)).value = c.HNI_RotoLH
                                    worksheet.getCell('N' + (cellN)).value = c.TotalHILM
                                    worksheet.getCell('O' + (cellN)).value = 0
                                    worksheet.getCell('P' + (cellN)).value = 0
                                    worksheet.getCell('Q' + (cellN)).value = c.HNI_RotoLM
                                    worksheet.getCell('R' + (cellN)).value = c.TotalHILH
                                    worksheet.getCell('S' + (cellN)).value = c.TotalHILM
                                    worksheet.getCell('T' + (cellN)).value = c.TotalHI
                                    worksheet.getCell('U' + (cellN)).value = c.porcTotalHI
                                    worksheet.getCell('V' + (cellN)).value = c.TotalHNI_Comercial
                                    worksheet.getCell('W' + (cellN)).value = c.porcTotalHNI_Comercial
                                    worksheet.getCell('X' + (cellN)).value = c.TotalRF
                                    worksheet.getCell('Y' + (cellN)).value = c.porcTotalRF
                                    worksheet.getCell('Z' + (cellN)).value = c.TotalProduccion
                                    worksheet.getCell('AA' + (cellN)).value = c.TotalHNI_Comercial
                                    worksheet.getCell('AB' + (cellN)).value = c.Ventas
                                    worksheet.getCell('AC' + (cellN)).value = c.Desmedro
                                    worksheet.getCell('AD' + (cellN)).value = c.PruebaFertilidad
                                    worksheet.getCell('AE' + (cellN)).value = c.SaldoFinal
                                    if (c.active == true) {
                                        worksheet.mergeCells('B' + (cellP) + ':B' + (cellP + (c.rowspan - 1)))
                                        worksheet.getCell('B' + (cellP)).value = Cartilla.YearMonth(c.Periodo)
                                        worksheet.getCell('B' + (cellP + (c.rowspan - 1)) + ':AE' + (cellP + (c.rowspan - 1))).border = {
                                            bottom: { style: "medium" }
                                        }
                                        worksheet.getCell('B' + (cellP)).alignment = {
                                            vertical: 'middle',
                                            horizontal: 'center'
                                        }
                                        cellP += c.rowspan;
                                    }
                                    cellN++
                                }
                            }

                            worksheet.columns.forEach(function (column, i) {
                                var maxLength = 0;
                                column["eachCell"](function (cell, colNumber) {
                                    if (colNumber > 3) {
                                        var columnLength = cell.value ? cell.value.toString().length - 4 : 8;
                                        if (columnLength > maxLength) {
                                            maxLength = columnLength;
                                        }
                                    }
                                });
                                column.width = maxLength < 8 ? 8 : maxLength;
                            });
                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateCPHI}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: rutaTemplateCPHI
            }
        } catch (err) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateCPHI
            }
        }
        return json;
    },
    ExportExcelMortalidad: async function (Data) {
        let rutaCM = "/template/CM.xlsx";
        try {
            let { idLevante, fecIni, fecFin, TipoCartilla, Rows, Alimentos } = Data;

            if (fs.existsSync("./template/CM.xlsx")) {
                await fs.unlinkSync("./template/CM.xlsx")
            }

            let f = new Date()
            let yyyy = f.getFullYear()

            let consLevante = await db.query(`SELECT GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str 
                SEPARATOR '-') as nombreLote FROM lotes WHERE idLevante = ${idLevante}`);

            let nombreLote = 'LH45-LM46'
            if (consLevante.length != 0) {
                nombreLote = consLevante[0].nombreLote
            }

            workbook.xlsx.readFile('./template/PlantillaCM.xlsx')
                .then(async function (work) {
                    return new Promise((resolve, reject) => {
                        workbook.eachSheet(async function (worksheet, sheetId) {
                            worksheet.name = `${nombreLote} mort`;
                            worksheet.getCell('A1').value = `MORTALIDAD Y DESCARTE ABUELAS LOTE ${nombreLote} - ${yyyy}`

                            let cellN = 4;
                            let cellP = 4;
                            for (let i = 0; i < Rows.length; i++) {
                                const c = Rows[i];
                                let bottom = 'thin'
                                // if(i == 0){
                                //     console.log('cell :>> ', worksheet.getCell('A2'));
                                // }
                                if (typeof Rows[i + 1] != "undefined") {
                                    if (c.Periodo != Rows[i + 1].Periodo) {
                                        bottom = 'medium'
                                    }
                                } else {
                                    bottom = 'medium'
                                }
                                if (c.show == true) {
                                    //RangoFecha
                                    worksheet.getCell('B' + (cellN)).value = c.RangoFecha
                                    worksheet.getCell('B' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8,
                                        bold: true
                                    }
                                    worksheet.getCell('B' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "medium" },
                                        bottom: { style: bottom },
                                        right: { style: "medium" }
                                    }
                                    //Semana
                                    worksheet.getCell('C' + (cellN)).value = "Semana " + c.Semana
                                    worksheet.getCell('C' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8,
                                        bold: true
                                    }
                                    worksheet.getCell('C' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "medium" },
                                        bottom: { style: bottom },
                                        right: { style: "medium" }
                                    }
                                    worksheet.getCell('C' + (cellN)).fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'f7cacc' }
                                    }
                                    //NroAvesInicioLH
                                    worksheet.getCell('D' + (cellN)).value = c.NroAvesInicioLH
                                    worksheet.getCell('D' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('D' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //MortalidadLH
                                    worksheet.getCell('E' + (cellN)).value = c.MortalidadLH
                                    worksheet.getCell('E' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('E' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //DescartesLH
                                    worksheet.getCell('F' + (cellN)).value = c.DescartesLH
                                    worksheet.getCell('F' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('F' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //VentasLH
                                    worksheet.getCell('G' + (cellN)).value = c.VentasLH
                                    worksheet.getCell('G' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('G' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //IngresosLH
                                    worksheet.getCell('H' + (cellN)).value = c.IngresosLH
                                    worksheet.getCell('H' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('H' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesFinalLH
                                    worksheet.getCell('I' + (cellN)).value = c.NroAvesFinalLH
                                    worksheet.getCell('I' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('I' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesInicioLM
                                    worksheet.getCell('J' + (cellN)).value = c.NroAvesInicioLM
                                    worksheet.getCell('J' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('J' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //MortalidadLM
                                    worksheet.getCell('K' + (cellN)).value = c.MortalidadLM
                                    worksheet.getCell('K' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('K' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //DescartesLM
                                    worksheet.getCell('L' + (cellN)).value = c.DescartesLM
                                    worksheet.getCell('L' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('L' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //VentasLM
                                    worksheet.getCell('M' + (cellN)).value = c.VentasLM
                                    worksheet.getCell('M' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('M' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //IngresosLM
                                    worksheet.getCell('N' + (cellN)).value = c.IngresosLM
                                    worksheet.getCell('N' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('N' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesFinalLM
                                    worksheet.getCell('O' + (cellN)).value = c.NroAvesFinalLM
                                    worksheet.getCell('O' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('O' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesInicio
                                    worksheet.getCell('P' + (cellN)).value = c.NroAvesInicio
                                    worksheet.getCell('P' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8,
                                        bold: true
                                    }
                                    worksheet.getCell('P' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "medium" },
                                        bottom: { style: bottom },
                                        right: { style: "medium" }
                                    }
                                    //Mortalidad
                                    worksheet.getCell('Q' + (cellN)).value = c.Mortalidad
                                    worksheet.getCell('Q' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('Q' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //porcMortalidad
                                    worksheet.getCell('R' + (cellN)).value = c.porcMortalidad
                                    worksheet.getCell('R' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('R' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //Descartes
                                    worksheet.getCell('S' + (cellN)).value = c.Descartes
                                    worksheet.getCell('S' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('S' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //porcDescartes
                                    worksheet.getCell('T' + (cellN)).value = c.porcDescartes
                                    worksheet.getCell('T' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('T' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //Ventas
                                    worksheet.getCell('U' + (cellN)).value = c.Ventas
                                    worksheet.getCell('U' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('U' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //porcVentas
                                    worksheet.getCell('V' + (cellN)).value = c.porcVentas
                                    worksheet.getCell('V' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('V' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //Ingresos
                                    worksheet.getCell('W' + (cellN)).value = c.Ingresos
                                    worksheet.getCell('W' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('W' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //porcIngresos
                                    worksheet.getCell('X' + (cellN)).value = c.porcIngresos
                                    worksheet.getCell('X' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8
                                    }
                                    worksheet.getCell('X' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "thin" },
                                        bottom: { style: bottom },
                                        right: { style: "thin" }
                                    }
                                    //NroAvesFinal
                                    worksheet.getCell('Y' + (cellN)).value = c.NroAvesFinal
                                    worksheet.getCell('Y' + (cellN)).font = {
                                        name: 'Calibri',
                                        size: 8,
                                        bold: true
                                    }
                                    worksheet.getCell('Y' + (cellN)).border = {
                                        top: { style: "thin" },
                                        left: { style: "medium" },
                                        bottom: { style: bottom },
                                        right: { style: "medium" }
                                    }
                                    if (c.active == true) {
                                        // worksheet.getCell('A'+(cellN)).value = c.Periodo
                                        await worksheet.mergeCells('A' + (cellP) + ':A' + (cellP + (c.rowspan - 1)))
                                        worksheet.getCell('A' + (cellP)).value = Cartilla.YearMonth(c.Periodo)
                                        worksheet.getCell('A' + (cellP + (c.rowspan - 1)) + ':Z' + (cellP + (c.rowspan - 1))).border = {
                                            bottom: { style: "medium" }
                                        }
                                        worksheet.getCell('A' + (cellP)).alignment = {
                                            vertical: 'middle',
                                            horizontal: 'center'
                                        }
                                        cellP = cellP + c.rowspan;
                                    }
                                    cellN++
                                }
                            }
                            worksheet.columns.forEach(function (column, i) {
                                var maxLength = 0;
                                column["eachCell"](function (cell, colNumber) {
                                    if (colNumber > 3) {
                                        var columnLength = cell.value ? cell.value.toString().length - 4 : 8;
                                        if (columnLength > maxLength) {
                                            maxLength = columnLength;
                                        }
                                    }
                                });
                                column.width = maxLength < 8 ? 8 : maxLength;
                            });
                            setTimeout(() => resolve(), 2000);
                        })
                    }).then(data => {
                        workbook.xlsx.writeFile("./template/CM.xlsx").then(function () {
                            console.log("xls file is written.");
                        });
                    })
                });
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM
            }
        } catch (error) {
            console.log('error :>> ', error);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM
            }
        }
        return json
    }
};
module.exports = Cartilla;