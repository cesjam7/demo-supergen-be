const { poolPromise } = require('../dbconnectionMSSQL')
var db = require('../dbconnection');
const cartillaModel = require('./Cartilla');
const moment = require('moment');
var Depreciacion = {
    getData: async function (Hoja) {
        function nombreMes(param) {
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
        }
        function YearMonth(param) {
            let m = param.substr(4, 5);
            let y = param.substr(0, 4);

            return nombreMes(m) + " " + y;
        }
        function formatDate(params) {
            if (typeof params == "undefined") {
                var hoy = new Date();
            } else {
                var hoy = new Date(params);
            }
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = dd + '/' + mm + '/' + yyyy;
            return hoy;
        }
        function calculateFecha(params) {
            let hoy = new Date(params);
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = yyyy + '' + mm;

            let cant_dias = new Date(yyyy, mm, 0).getDate();
            return cant_dias - dd;
        }
        function calculateFechaNoSobrante(params) {
            let hoy = new Date(params);
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = yyyy + '' + mm;

            return new Date(yyyy, mm, 0).getDate();
        }
        function formatGroup(param) {
            Array.prototype.unique = function (a) {
                return function () { return this.filter(a) }
            }(function (a, b, c) {
                return c.indexOf(a, b + 1) < 0
            });
            let individual = param.split(',');
            return (individual.unique()).join('-');
        }
        function obtainDate(param) {
            let m = param.substr(4, 5);
            let y = param.substr(0, 4);

            let cant_dias = new Date(y, m, 0).getDate();

            return cant_dias + "/" + m + "/" + y;
        }
        function DatePeriodo(params) {
            var hoy = new Date(params);
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = yyyy + '' + mm;
            return hoy;
        }
        function FIFF(params) {
            let y = params.substr(0, 4);
            let m = params.substr(4, 6);
            let cant_dias = new Date(y, m, 0).getDate();
            return {
                FecIn: y + '-' + m + '-' + cant_dias,
                FecFin: y + '-' + m + '-' + '01',
            }
        }
        function formatDateGuion(params) {
            if (typeof params == "undefined") {
                var hoy = new Date();
            } else {
                var hoy = new Date(params);
            }
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = yyyy + '-' + mm + '-' + dd;
            return hoy;
        }
        function ddmmyyyyGuiones(params) {
            if (typeof params == "undefined") {
                var hoy = new Date();
            } else {
                var hoy = new Date(params);
            }
            var dd = hoy.getDate();
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = dd + '-' + mm + '-' + yyyy;
            return hoy;
        }
        function DatePeriodo_1(params) {
            var hoy = new Date(params);
            var mm = hoy.getMonth() + 1;
            var yyyy = hoy.getFullYear();

            if (mm == 1) {
                mm = 12;
                yyyy = yyyy - 1;
            } else {
                mm = mm - 1;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            hoy = yyyy + '' + mm;
            return hoy;
        }
        Array.prototype.unique = function (a) {
            return function () { return this.filter(a) }
        }(function (a, b, c) {
            return c.indexOf(a, b + 1) < 0
        });
        let codigo
        let ytwo = Hoja.Periodo.substr(2, 2);
        if (Hoja.hojaLote == 'Depreciacion') {
            let cam = await db.query("SELECT * FROM costo_aves_mensual WHERE idLevante = ? and Periodo = ? and TipoLote != ?",
                [Hoja.idLevante, Hoja.Periodo, 'LEV'])
            if (cam.length == 0) {
                return {
                    success: false,
                    message: 'Por favor verifique costos o produccion del lote seleccionado.'
                }
            } else {
                let prod = await db.query("SELECT * FROM produccion WHERE idLevante = ?", [Hoja.idLevante]);
                let porc = await db.query("SELECT * FROM depreciacion WHERE Year = ?", [Hoja.Periodo.substr(0, 4)]);
                let ValorAnual = 0;
                let ValorMensual = 0;
                if (porc.length != 0) {
                    ValorAnual = porc[0].ValorAnual;
                    ValorMensual = porc[0].ValorMensual;
                }
                let idProduccion = prod[0].idProduccion
                let FechaIniProduccion = formatDate(prod[0].FechaInicioDepreciacion)
                let fip = DatePeriodo(prod[0].FechaInicioDepreciacion);
                let ffp = DatePeriodo(prod[0].FechaFinProduccion);
                let cons_periodo = await db.query("SELECT * FROM periodo WHERE YearMonth >= ? and YearMonth <= ?",
                    [fip, ffp])
                let Periodos = [];
                for (let i = 0; i < cons_periodo.length; i++) {
                    const e = cons_periodo[i];
                    if (e.YearMonth <= Hoja.Periodo) {
                        Periodos.push(e);
                    }
                }
                let lotes_all = await db.query("SELECT * FROM lotes WHERE idLevante = ?", [Hoja.idLevante]);
                let agrup = [];
                for (let l = 0; l < lotes_all.length; l++) {
                    const e = lotes_all[l];
                    agrup.push(e.idLote);
                }
                let filas = [];
                let sumMensualHem = 0;
                let sumMensualMac = 0;

                let TotalActivoMac = 0;
                let NroAvesFinMac = 0;
                let DepreciacionInicialMac = 0
                let TotalActivoHem = 0;
                let NroAvesFinHem = 0;
                let DepreciacionInicialHem = 0
                for (let j = 0; j < Periodos.length; j++) {
                    const e = Periodos[j].YearMonth;
                    let r = await db.query(`SELECT * FROM costos_depreciacion_h WHERE idLevante = ? and PeriodoNumero = ?`,
                        [Hoja.idLevante, e]);
                    if (Periodos[j].Estado == 0 && r.length != 0) {
                        for (let w = 0; w < r.length; w++) {
                            const f = r[w];
                            f.numeros = JSON.parse(f.numeros)
                            if (w == 0) {
                                TotalActivoHem = Number(f.numeros[9])
                                NroAvesFinHem = Number(f.numeros[10])
                                DepreciacionInicialHem = Number(f.numeros[15])
                            } else if (w == 1) {
                                TotalActivoMac = Number(f.numeros[9])
                                NroAvesFinMac = Number(f.numeros[10])
                                DepreciacionInicialMac = Number(f.numeros[15])
                            }
                            filas.push(f);
                        }
                    } else {
                        await db.query(`DELETE FROM costos_depreciacion_h WHERE idLevante = ? and PeriodoNumero = ?`,
                            [Hoja.idLevante, e]);
                        //CONSULTA A COSTEO
                        let cam_all = await db.query("SELECT * FROM costo_aves_mensual WHERE idLevante = ? and Periodo = ? and TipoLote != ?",
                            [Hoja.idLevante, e, 'LEV'])

                        //CONSULTA A STOCK_AVES_MENSUAL

                        const fechaInicio = moment(e, "YYYYMM").startOf('month')
                        const fechaFin = moment(e, "YYYYMM").endOf('month')
                        console.log("fechaInici", fechaInicio.format("YYYY-MM-DD"), fechaFin.format("YYYY-MM-DD"))
                        const cartilla = (await cartillaModel.getCartilla({
                            idLevante: Hoja.idLevante, fecIn: fechaInicio.format("YYYY-MM-DD"), fecFin: fechaFin.format("YYYY-MM-DD"), TipoCartilla: { class: "", style: { borderBottom: "2px solid #e30512" }, title: "Mortalidad" }
                        })).rowsMortalidad
                        const cartillaMap = cartilla.filter(c => c.Semana > 24 && moment(c.fecha).format("YYYYMM") == e)
                        console.log("cartilla", cartillaMap)
                        const cartillaSum = cartillaMap.reduce((prev, curr) => {
                            prev.VentasLH += curr.VentasLH
                            prev.VentasLM += curr.VentasLM
                            prev.MortalidadLM += curr.MortalidadLM
                            prev.MortalidadLH += curr.MortalidadLH
                            prev.DescartesLH += curr.DescartesLH
                            prev.DescartesLM += curr.DescartesLM
                            prev.IngresosLH += curr.IngresosLH
                            prev.IngresosLM += curr.IngresosLM
                            return prev;
                        }, { VentasLH: 0, VentasLM: 0, MortalidadLM: 0, MortalidadLH: 0, DescartesLH: 0, DescartesLM: 0, IngresosLH: 0, IngresosLM: 0 })
                        const { NroAvesInicioLM = 0, NroAvesInicioLH = 0 } = cartillaMap[0] || {}
                        console.log("avesLm", NroAvesInicioLM, "lh", NroAvesInicioLH)
                        /* let sam_all = await db.query(`SELECT lo.lote_str, SUM(NroAvesIniciadas) as NroAvesIniciadas,
                        (SUM(Mortalidad) + SUM(Descarte)) as MyD,
                        SUM(FinCampania) as Venta, SUM(Ingreso) as Transferencia 
                        FROM stock_aves_mensual sam 
                        INNER JOIN lotes lo on lo.idLote = sam.idLote WHERE lo.idLote IN (${agrup.join(',')}) 
                        and Periodo = ${e} GROUP BY lo.lote_str
                        ORDER BY lo.lote_str`) */

                        let sam_all = [{ Venta: cartillaSum.VentasLM, MyD: cartillaSum.DescartesLM + cartillaSum.MortalidadLM }, { Venta: cartillaSum.VentasLH, MyD: cartillaSum.DescartesLH + cartillaSum.MortalidadLH }]




                        //CONSULTA A UNIDADES PRODUCIDAS
                        let unidprod_all = await db.query(`SELECT * 
                        FROM proyeccion_incubables
                        WHERE Periodo = ${e} and idLevante = ${Hoja.idLevante}`)

                        //HEMBRAS
                        let CostoAvesHem = 0;
                        //AVES DE NUMEROS DE AVES DE INICIO
                        let NroAvesHem = 0;
                        let CostoUnitHem = 0;
                        if (j == 0) {
                            if (cam_all.length == 0) {
                                return {
                                    success: false,
                                    message: 'Por favor verifique costos o produccion del lote seleccionado.'
                                }
                            } else {
                                CostoAvesHem = cam_all[0].CostoAvesHem
                                NroAvesHem = cam_all[0].NroAvesHem
                                NroAvesHem = NroAvesInicioLH

                                CostoUnitHem = cam_all[0].CostoUnitHem
                            }
                        } else {
                            CostoAvesHem = TotalActivoHem
                            NroAvesHem = NroAvesFinHem
                            NroAvesHem = NroAvesInicioLH
                            CostoUnitHem = CostoAvesHem / NroAvesHem
                        }

                        //MACHOS
                        let CostoAvesMac = 0;
                        let NroAvesMac = 0;
                        let CostoUnitMac = 0;
                        if (j == 0) {
                            if (cam_all.length == 0) {
                                return {
                                    success: false,
                                    message: 'Por favor verifique costos o produccion del lote seleccionado.'
                                }
                            } else {
                                CostoAvesMac = cam_all[0].CostoAvesMac
                                NroAvesMac = NroAvesInicioLM
                                CostoUnitMac = cam_all[0].CostoUnitMac
                            }
                        } else {
                            CostoAvesMac = TotalActivoMac
                            //NroAvesMac = NroAvesFinMac
                            NroAvesMac = NroAvesInicioLM
                            CostoUnitMac = CostoAvesMac / NroAvesMac
                        }

                        let RT = await Depreciacion.obtainTransfer({ Periodo: Hoja.Periodo, idProduccion, CostoUnitHem, CostoUnitMac })

                        //HEMBRAS LH
                        let TransferHem = RT.cant_trans_LH
                        let CostoTransferHem = RT.costo_trans_LH
                        let VentaHem = (sam_all[0].Venta) * (-1)
                        let CostoVentaHem = (CostoUnitHem * VentaHem)
                        let MyDHem = (sam_all[0].MyD) * (-1)
                        let CostoMyDHem = (CostoUnitHem * MyDHem)
                        TotalActivoHem = CostoAvesHem + CostoTransferHem + CostoVentaHem + CostoMyDHem
                        NroAvesFinHem = NroAvesHem + TransferHem + VentaHem + MyDHem
                        let PrecioUnitHem
                        let InicVtaMortHem
                        let MensualHem = 0
                        let AcumHem = 0
                        let CostoExcepHem
                        let CostoProducHem
                        let ActivoNetoHem

                        //MACHOS LM
                        let TransferMac = RT.cant_trans_LM
                        let CostoTransferMac = RT.costo_trans_LM
                        let VentaMac = (sam_all[1].Venta) * (-1)
                        let CostoVentaMac = (CostoUnitMac * VentaMac)
                        let MyDMac = (sam_all[1].MyD) * (-1)
                        let CostoMyDMac = (CostoUnitMac * MyDMac)
                        TotalActivoMac = CostoAvesMac + CostoTransferMac + CostoVentaMac + CostoMyDMac
                        NroAvesFinMac = NroAvesMac + TransferMac + VentaMac + MyDMac
                        let PrecioUnitMac
                        let InicVtaMortMac
                        let MensualMac = 0
                        let AcumMac = 0
                        let CostoExcepMac
                        let CostoProducMac
                        let ActivoNetoMac

                        if (unidprod_all.length != 0) {
                            MensualHem = unidprod_all[0].ResultadoLH;
                            MensualMac = unidprod_all[0].ResultadoLM;
                            if (j == 0) {
                                DepreciacionInicialHem = 0;
                                DepreciacionInicialMac = 0;
                            }
                        }

                        PrecioUnitHem = DepreciacionInicialHem / NroAvesHem
                        InicVtaMortHem = -PrecioUnitHem * (VentaHem + MyDHem)
                        AcumHem = DepreciacionInicialHem - InicVtaMortHem + MensualHem
                        CostoExcepHem = -CostoVentaHem + VentaHem * PrecioUnitHem
                        CostoProducHem = -CostoMyDHem + MyDHem * PrecioUnitHem
                        ActivoNetoHem = TotalActivoHem - AcumHem
                        sumMensualHem = sumMensualHem + MensualHem

                        PrecioUnitMac = DepreciacionInicialMac / NroAvesMac
                        InicVtaMortMac = -PrecioUnitMac * (VentaMac + MyDMac)
                        AcumMac = DepreciacionInicialMac - InicVtaMortMac + MensualMac
                        CostoExcepMac = -CostoVentaMac + VentaMac * PrecioUnitMac
                        CostoProducMac = -CostoMyDMac + MyDMac * PrecioUnitMac
                        ActivoNetoMac = TotalActivoMac - AcumMac
                        sumMensualMac = sumMensualMac + MensualMac

                        //TOTALES
                        let CostoAves = CostoAvesHem + CostoAvesMac
                        // let NroAves = NroAvesHem + NroAvesMac
                        // let CostoUnit = CostoUnitHem + CostoUnitMac
                        let CostoTransferencia = CostoTransferHem + CostoTransferMac
                        let CostoVenta = CostoVentaHem + CostoVentaMac
                        let CostoMyD = CostoMyDHem + CostoMyDMac
                        let TotalActivo = TotalActivoHem + TotalActivoMac
                        // let NroAvesFin = NroAvesFinHem + NroAvesFinMac
                        let DepreciacionInicial = DepreciacionInicialHem + DepreciacionInicialMac
                        let InicVtaMort = InicVtaMortHem + InicVtaMortMac
                        let Mensual = MensualHem + MensualMac
                        let Acum = AcumHem + AcumMac
                        let CostoExcep = CostoExcepHem + CostoExcepMac
                        let CostoProduc = CostoProducHem + CostoProducMac
                        let ActivoNeto = ActivoNetoHem + ActivoNetoMac

                        let n1 = [CostoAvesHem.toFixed(2), NroAvesHem, CostoUnitHem.toFixed(2), CostoTransferHem.toFixed(2),
                            TransferHem, CostoVentaHem.toFixed(2), VentaHem, CostoMyDHem.toFixed(2),
                            MyDHem, TotalActivoHem.toFixed(2), NroAvesFinHem, DepreciacionInicialHem.toFixed(2),
                        PrecioUnitHem.toFixed(2), InicVtaMortHem.toFixed(2), MensualHem.toFixed(2),
                        AcumHem.toFixed(2), CostoTransferHem.toFixed(2), CostoExcepHem.toFixed(2),
                        CostoProducHem.toFixed(2), ActivoNetoHem.toFixed(2)];

                        filas.push({
                            Periodo: YearMonth(e),
                            PeriodoNumero: e,
                            class: '',
                            numeros: n1
                        })

                        console.log("numero hembras", NroAvesHem, "j", j)
                        await db.query(`INSERT INTO costos_depreciacion_h (idLevante, Periodo, PeriodoNumero, class, numeros)
                        VALUES (?,?,?,?,?)`, [Hoja.idLevante, YearMonth(e), e, '', JSON.stringify(n1)]);

                        let n2 = [CostoAvesMac.toFixed(2), NroAvesMac, CostoUnitMac.toFixed(2), CostoTransferMac.toFixed(2),
                            TransferMac, CostoVentaMac.toFixed(2), VentaMac, CostoMyDMac.toFixed(2),
                            MyDMac, TotalActivoMac.toFixed(2), NroAvesFinMac, DepreciacionInicialMac.toFixed(2),
                        PrecioUnitMac.toFixed(2), InicVtaMortMac.toFixed(2), MensualMac.toFixed(2),
                        AcumMac.toFixed(2), CostoTransferMac.toFixed(2), CostoExcepMac.toFixed(2),
                        CostoProducMac.toFixed(2), ActivoNetoMac.toFixed(2)]
                        filas.push({
                            Periodo: '',
                            PeriodoNumero: e,
                            class: '',
                            numeros: n2
                        })
                        await db.query(`INSERT INTO costos_depreciacion_h (idLevante, Periodo, PeriodoNumero, class, numeros)
                        VALUES (?,?,?,?,?)`, [Hoja.idLevante, '', e, '', JSON.stringify(n2)]);

                        let n3 = [CostoAves.toFixed(2), '', '', CostoTransferencia.toFixed(2), '',
                        CostoVenta.toFixed(2), '', CostoMyD.toFixed(2), '', TotalActivo.toFixed(2),
                            '', DepreciacionInicial.toFixed(2), '', InicVtaMort.toFixed(2), Mensual.toFixed(2),
                        Acum.toFixed(2), CostoTransferencia.toFixed(2), CostoExcep.toFixed(2),
                        CostoProduc.toFixed(2), ActivoNeto.toFixed(2)]
                        filas.push({
                            Periodo: '',
                            PeriodoNumero: e,
                            class: 'active',
                            numeros: n3
                        })
                        await db.query(`INSERT INTO costos_depreciacion_h (idLevante, Periodo, PeriodoNumero, class, numeros)
                        VALUES (?,?,?,?,?)`, [Hoja.idLevante, '', e, 'active', JSON.stringify(n3)]);
                    }
                }
                return {
                    Periodos,
                    FechaIniProduccion,
                    ValorAnual,
                    ValorMensual,
                    rows: filas
                }
            }
        } else if (Hoja.hojaLote == 'Unid.Produc') {
            let cam = await db.query("SELECT * FROM costo_aves_mensual WHERE idLevante = ? and TipoLote = ?", [Hoja.idLevante, 'LEV/PROD'])
            if (cam.length == 0) {
                return {
                    success: false,
                    message: 'Por favor, verifique que el lote seleccionado tenga registros en producción.'
                }
            } else {
                let cons_periodo = await db.query("SELECT * FROM proyeccion_incubables WHERE idLevante = ?",
                    [Hoja.idLevante])
                if (cons_periodo.length == 0) {
                    return {
                        success: false,
                        message: 'Por favor, verifique la proyección del lote seleccionado.'
                    }
                } else {
                    let sam = await db.query(`SELECT SUM(NroAvesIniciadas) as NroAves FROM stock_aves_mensual sam 
                    INNER JOIN lotes lo ON lo.idLote = sam.idLote WHERE idLevante = ? and Periodo = ?
                    GROUP BY lo.TipoGenero`, [Hoja.idLevante, cons_periodo[0].Periodo])
                    let prod = await db.query("SELECT * FROM produccion WHERE idLevante = ?", [Hoja.idLevante]);
                    let cost_depre = await db.query(`SELECT * FROM costos_depreciacion_h WHERE idLevante = ? 
                    LIMIT 2`, [Hoja.idLevante])
                    let CostoAvesHem = cam[0].CostoAvesHem;
                    let CostoAvesMac = cam[0].CostoAvesMac;
                    let NroAvesHem = sam[0].NroAves;
                    let NroAvesMac = sam[1].NroAves;
                    if (cost_depre.length != 0) {
                        CostoAvesHem = JSON.parse(cost_depre[0].numeros)[0];
                        CostoAvesMac = JSON.parse(cost_depre[1].numeros)[0];
                        NroAvesHem = JSON.parse(cost_depre[0].numeros)[1];
                        NroAvesMac = JSON.parse(cost_depre[1].numeros)[1];
                    }
                    let idProduccion = prod[0].idProduccion;
                    let NroAves = [NroAvesHem, NroAvesMac];
                    let CostoAves = [CostoAvesHem, CostoAvesMac];
                    let rows = [];
                    let sumProyeccionLH = 0;
                    let sumProyeccionLM = 0;
                    let sumProduccionLH = 0;
                    let sumProduccionLM = 0;
                    for (let i = 0; i < cons_periodo.length; i++) {
                        let numeros = [];
                        const e = cons_periodo[i];
                        let Periodo = cons_periodo[i].Periodo;
                        let ProyeccionLH = e.ProyeccionLH
                        let ProyeccionLM = e.ProyeccionLM
                        sumProyeccionLH = sumProyeccionLH + ProyeccionLH
                        sumProyeccionLM = sumProyeccionLM + ProyeccionLM
                        numeros.push(ProyeccionLH)
                        numeros.push(ProyeccionLM)
                        let year_subs = Periodo.substr(0, 4);
                        let month_subs = Periodo.substr(4, 5);
                        let FechaLike = month_subs + "-" + year_subs;

                        let prod_huevos = await db.query(`SELECT lo.TipoGenero, SUM(TotalHI) as TotalProd_Huevo
                        FROM produccion_huevos_det phd
                        INNER JOIN lotes lo on lo.idLote = phd.idLote
                        WHERE phd.idProduccion = ${idProduccion} and fechaRegistro LIKE '%${FechaLike}'
                        GROUP BY lo.TipoGenero
                        ORDER BY lo.TipoGenero`)
                        let produccionLH = 0;
                        let produccionLM = 0;
                        if (prod_huevos.length != 0 && prod_huevos.length == 2) {
                            produccionLH = prod_huevos[0].TotalProd_Huevo;

                            produccionLM = prod_huevos[1].TotalProd_Huevo;
                        } else {
                            produccionLH = ProyeccionLH
                            produccionLM = ProyeccionLM
                        }
                        numeros.push(produccionLH)
                        numeros.push(produccionLM)
                        sumProduccionLH = sumProduccionLH + produccionLH
                        sumProduccionLM = sumProduccionLM + produccionLM
                        await db.query(`UPDATE proyeccion_incubables set 
                        ProduccionLH = ${produccionLH}, ProduccionLM = ${produccionLM} 
                        WHERE Periodo = ${Periodo} and idLevante = ${Hoja.idLevante}`)
                        rows.push({
                            class: '',
                            Periodo: e.Periodo,
                            numeros
                        });
                    }
                    rows.push({
                        class: 'active',
                        Periodo: '',
                        numeros: [sumProyeccionLH, sumProyeccionLM, sumProduccionLH, sumProduccionLM]
                    })
                    let CuotaAsignacionProyLH = (CostoAves[0] - CostoAves[0] * 0.07) / sumProyeccionLH
                    let CuotaAsignacionProyLM = (CostoAves[1] - CostoAves[1] * 0.07) / sumProyeccionLM
                    let CuotaAsignacionProdLH = (CostoAves[0] - CostoAves[0] * 0.07) / sumProduccionLH
                    let CuotaAsignacionProdLM = (CostoAves[1] - CostoAves[1] * 0.07) / sumProduccionLM
                    rows.push({
                        class: 'active',
                        Periodo: 'Cuota Asignacion',
                        numeros: [
                            (CuotaAsignacionProyLH).toFixed(2), (CuotaAsignacionProyLM).toFixed(2),
                            (CuotaAsignacionProdLH).toFixed(2), (CuotaAsignacionProdLM).toFixed(2)
                        ]
                    })
                    let sumValorLH = 0;
                    let sumValorLM = 0;
                    for (let i = 0; i < rows.length; i++) {
                        const e = rows[i];
                        let Periodo = e.Periodo;
                        let datoLH = e.numeros[2]
                        let datoLM = e.numeros[3]
                        let valorLH = datoLH * CuotaAsignacionProdLH;
                        let valorLM = datoLM * CuotaAsignacionProdLM;
                        if (i <= rows.length - 3) {
                            e.numeros.push(valorLH.toFixed(2))
                            e.numeros.push(valorLM.toFixed(2))
                            await db.query(`UPDATE proyeccion_incubables set 
                            ResultadoLH = ${valorLH}, ResultadoLM = ${valorLM} 
                            WHERE Periodo = ${Periodo} and idLevante = ${Hoja.idLevante}`)
                            sumValorLH = sumValorLH + valorLH
                            sumValorLM = sumValorLM + valorLM
                            e.Periodo = YearMonth(e.Periodo);
                        } else {
                            if (i <= rows.length - 2) {
                                e.numeros.push(sumValorLH.toFixed(2))
                                e.numeros.push(sumValorLM.toFixed(2))
                            } else {
                                let difLH = CostoAves[0] - sumValorLH;
                                let difLM = CostoAves[1] - sumValorLM;
                                e.numeros.push(difLH.toFixed(2))
                                e.numeros.push(difLM.toFixed(2))
                            }
                        }
                    }
                    return {
                        success: true,
                        message: 'Respondiendo',
                        data: rows,
                        Lote: cons_periodo[0].Lote,
                        NroAves,
                        CostoAves
                    }
                }
            }
        } else if (Hoja.hojaLote == 'Proyeccion') {
            let cam = await db.query("SELECT * FROM costo_aves_mensual WHERE idLevante = ? and TipoLote = ?", [Hoja.idLevante, 'LEV/PROD'])
            if (cam.length == 0) {
                return {
                    success: false,
                    message: 'Por favor, verifique que el lote seleccionado tenga registros en producción.'
                }
            } else {
                let cons_periodo = await db.query("SELECT * FROM proyeccion_incubables WHERE idLevante = ?",
                    [Hoja.idLevante])
                if (cons_periodo.length != 0) {
                    return {
                        success: true,
                        data: cons_periodo
                    }
                } else {
                    let prod = await db.query("SELECT * FROM produccion WHERE idLevante = ?",
                        [Hoja.idLevante])
                    let Lote = prod[0].Nombre;
                    let FechaIniProduccion = DatePeriodo(prod[0].FechaInicioDepreciacion)
                    let FechaFinProduccion = DatePeriodo(prod[0].FechaFinProduccion)
                    let periodos = [FechaIniProduccion];
                    let year = FechaIniProduccion.substr(0, 4);
                    let month = FechaIniProduccion.substr(4, 2);
                    for (let i = 0; i < 20; i++) {
                        if (month == 12) {
                            year = parseInt(year) + 1;
                            month = '01';
                        } else {
                            month = parseInt(month) + 1;
                            if (month < 10) {
                                month = '0' + month;
                            }
                        }
                        let periodo = year + '' + month;
                        if (FechaFinProduccion >= periodo) {
                            periodos.push(periodo)
                        }
                    }
                    let data = [];
                    for (let j = 0; j < periodos.length; j++) {
                        const pe = periodos[j];
                        data.push({
                            Periodo: pe,
                            ProyeccionLH: 0,
                            ProyeccionLM: 0,
                            CostoHC: 0,
                            idLevante: Hoja.idLevante,
                            Lote
                        })
                    }
                    return {
                        success: true,
                        data: data
                    }
                }
            }
        } else if (Hoja.hojaLote == 'Nacimientos') {
            let prod = await db.query("SELECT * FROM produccion WHERE idLevante = ?", [Hoja.idLevante]);
            if (prod.length != 0) {
                let cam = await db.query("SELECT * FROM costo_aves_mensual WHERE idLevante = ? and TipoLote = ?", [Hoja.idLevante, 'LEV/PROD'])
                if (cam.length != 0) {
                    let cons_periodo = await db.query("SELECT * FROM proyeccion_incubables WHERE idLevante = ?",
                        [Hoja.idLevante])
                    if (cons_periodo.length != 0) {
                        return {
                            success: true,
                            data: cons_periodo
                        }
                    } else {
                        let prod = await db.query("SELECT * FROM produccion WHERE idLevante = ?",
                            [Hoja.idLevante])
                        let Lote = prod[0].Nombre;
                        let FechaIniProduccion = DatePeriodo(prod[0].FechaIniProduccion)
                        let FechaFinProduccion = DatePeriodo(prod[0].FechaFinProduccion)
                        let periodos = [FechaIniProduccion];
                        let year = FechaIniProduccion.substr(0, 4);
                        let month = FechaIniProduccion.substr(4, 2);
                        for (let i = 0; i < 20; i++) {
                            if (month == 12) {
                                year = parseInt(year) + 1;
                                month = '01';
                            } else {
                                month = parseInt(month) + 1;
                                if (month < 10) {
                                    month = '0' + month;
                                }
                            }
                            let periodo = year + '' + month;
                            if (FechaFinProduccion >= periodo) {
                                periodos.push(periodo)
                            }
                        }
                        let data = [];
                        for (let j = 0; j < periodos.length; j++) {
                            const pe = periodos[j];
                            data.push({
                                Periodo: pe,
                                ProyeccionLH: 0,
                                ProyeccionLM: 0,
                                CostoHC: 0,
                                idLevante: Hoja.idLevante,
                                Lote
                            })
                        }
                        return {
                            success: true,
                            data: data
                        }
                    }
                }
            }
        }
    },
    guardarProyeccion: async function (Hoja) {
        let idLevante = Hoja[0].idLevante;
        let NombreLote = Hoja[0].Lote;
        let cons_periodo = await db.query("SELECT * FROM proyeccion_incubables WHERE idLevante = ?",
            [idLevante])
        if (cons_periodo.length != 0) {
            for (let i = 0; i < Hoja.length; i++) {
                const e = Hoja[i];
                await db.query(`UPDATE proyeccion_incubables
                SET ProyeccionLH = ?, ProyeccionLM = ?, CostoHC = ?
                WHERE idLevante = ? and Periodo = ?`,
                    [e.ProyeccionLH, e.ProyeccionLM, e.CostoHC, idLevante, e.Periodo]);
            }
            return {
                success: true,
                message: 'Se actualizó correctamente.'
            }
        } else {
            for (let i = 0; i < Hoja.length; i++) {
                const e = Hoja[i];
                await db.query(`INSERT INTO proyeccion_incubables
                (ProyeccionLH, ProyeccionLM, CostoHC, idLevante, Periodo, Lote) VALUES (?,?,?,?,?,?)`,
                    [e.ProyeccionLH, e.ProyeccionLM, e.CostoHC, idLevante, e.Periodo, e.Lote]);
            }
            return {
                success: true,
                message: 'Se registró correctamente.'
            }
        }
    },
    obtainInfoPeriodo: async (YearMonth) => {
        let periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [YearMonth])
        if (periodo.length != 0) {
            return periodo[0];
        }
    },
    obtainTransfer: async function (Hoja) {
        let cp = await this.obtainInfoPeriodo(Hoja.Periodo);
        let json = {
            cant_trans_LH: 0,
            costo_trans_LH: 0,
            cant_trans_LM: 0,
            costo_trans_LM: 0,
        }
        let trans = await db.query(`SELECT * FROM traslado_ingreso_ventas tiv
        INNER JOIN lotes lo ON lo.idLote = tiv.idLoteOrigen WHERE tiv.idProduccionOrigen = ? and 
        tiv.Fecha BETWEEN ? and ? and ISNULL(tiv.Venta)`, [Hoja.idProduccion, cp.FechaInicio, cp.FechaFin])
        if (trans.length != 0) {
            for (let i = 0; i < trans.length; i++) {
                const t = trans[i];
                if (t.TipoGenero == "LH") {
                    json.cant_trans_LH -= t.Traslado
                    json.costo_trans_LH -= (t.Traslado * Hoja.CostoUnitHem)
                } else {
                    json.cant_trans_LM -= t.Traslado
                    json.costo_trans_LM -= (t.Traslado * Hoja.CostoUnitMac)
                }
            }
        }
        let ingr = await db.query(`SELECT * FROM traslado_ingreso_ventas tiv
        INNER JOIN lotes lo ON lo.idLote = tiv.idLoteOrigen WHERE tiv.idProduccionDestino = ? and 
        tiv.Fecha BETWEEN ? and ? and ISNULL(tiv.Venta)`, [Hoja.idProduccion, cp.FechaInicio, cp.FechaFin])
        if (ingr.length != 0) {
            for (let i = 0; i < ingr.length; i++) {
                const t = ingr[i];
                let cons_dep = await db.query(`SELECT * FROM costos_depreciacion_h cdh INNER JOIN produccion p 
                ON p.idLevante = cdh.idLevante WHERE p.idProduccion = ? and PeriodoNumero = ? and class != 'active'`,
                    [t.idProduccionOrigen, Hoja.Periodo])
                if (cons_dep.length != 0) {
                    let CostoUnitHemOrigen = Number(JSON.parse(cons_dep[0].numeros)[2])
                    let CostoUnitMacOrigen = Number(JSON.parse(cons_dep[1].numeros)[2])
                    if (t.TipoGenero == "LH") {
                        json.cant_trans_LH += t.Traslado
                        json.costo_trans_LH += (t.Traslado * CostoUnitHemOrigen)
                    } else {
                        json.cant_trans_LM += t.Traslado
                        json.costo_trans_LM += (t.Traslado * CostoUnitMacOrigen)
                    }
                }
            }
        }
        return json;
    }
}
module.exports = Depreciacion;