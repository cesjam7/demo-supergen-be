const { poolPromise } = require('../dbconnectionMSSQL')

var db = require('../dbconnection');
const { rows } = require('mssql');

var Costeo = {
    getAllPeriodos: async function () {
        let rows = await db.query("SELECT * FROM periodo ORDER BY FechaRegistro DESC");
        for (let i = 0; i < rows.length; i++) {
            const element = rows[i];
            element.Style = {
                'opacity': '0.65'
            }
        }
        return rows;
    },

    desactivatePeriodos: async function (Periodo) {
        await db.query("UPDATE periodo SET Estado = ?, FechaModificar = ? WHERE YearMonth = ?", [0, new Date(), Periodo.YearMonth]);
    },
    activar: async function (Periodo) {
       
        await db.query("UPDATE periodo SET Estado = ?, FechaModificar = ? WHERE YearMonth = ?", [1, new Date(), Periodo.YearMonth]);
    },


    getLotesByPeriodo: async function (Periodo) {
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
            hoy = yyyy + '-' + mm + '-' + dd;
            return hoy;
        }
        let rows = await db.query("SELECT * FROM periodo WHERE YearMonth = ?", [Periodo]);
        let FechaInicio = formatDate(rows[0].FechaInicio);
        let FechaFin = formatDate(rows[0].FechaFin);
        console.log('FechaInicio :', FechaInicio);
        console.log('FechaFin :', FechaFin);
        let levantes = await db.query("SELECT * FROM levantes WHERE Date(FechaIniLevante) < ? ORDER BY idLevante DESC", [FechaFin]);
        return levantes;
    },
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

        function DifDays(param1, periodo) {
            var fechaini = new Date(param1);
            let m = periodo.substr(4, 5);
            let y = periodo.substr(0, 4);

            let fechafin = new Date(y, m, 0);
            var diasdif = fechafin.getTime() - fechaini.getTime();
            var contdias = Math.round(diasdif / (1000 * 60 * 60 * 24));

            return contdias;
        }
        Array.prototype.unique = function (a) {
            return function () { return this.filter(a) }
        }(function (a, b, c) {
            return c.indexOf(a, b + 1) < 0
        });
        let codigo
        let ytwo = Hoja.Periodo.substr(2, 2);
        if (Hoja.hojaLote == 'MyD') {
            let lotes = await db.query("SELECT * FROM lotes WHERE idLevante = ?", [Hoja.idLevante]);
            let agrpLM = [];
            let agrpLH = [];
            for (let p = 0; p < lotes.length; p++) {
                const b = lotes[p];
                if (b.TipoGenero == 'LM') {
                    agrpLM.push(b.idLote)
                } else {
                    agrpLH.push(b.idLote)
                }
            }
            let rowLM = await db.query("SELECT Periodo, SUM(NroAvesIniciadas) AS NroAvesIniciadas, SUM(Mortalidad) AS Mortalidad, SUM(Descarte) AS Descarte, SUM(FinCampania) AS FinCampania, SUM(Ingreso) AS Ingreso, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + agrpLM.join(',') + ") and Periodo <= ? GROUP BY Periodo", [Hoja.Periodo])

            let rowLH = await db.query("SELECT Periodo, SUM(NroAvesIniciadas) AS NroAvesIniciadas, SUM(Mortalidad) AS Mortalidad, SUM(Descarte) AS Descarte, SUM(FinCampania) AS FinCampania, SUM(Ingreso) AS Ingreso, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + agrpLH.join(',') + ") and Periodo <= ? GROUP BY Periodo", [Hoja.Periodo])

            let tabla = [];
            for (let j = 0; j < rowLM.length; j++) {
                const lm = rowLM[j];
                const lh = rowLH[j];
                let numeros = [];
                //LM
                numeros.push(lm.NroAvesIniciadas);
                numeros.push(lm.Mortalidad);
                numeros.push(lm.Descarte);
                numeros.push(lm.FinCampania);
                numeros.push(lm.Ingreso);
                numeros.push(lm.NroAvesFinal);
                //LH
                numeros.push(lh.NroAvesIniciadas);
                numeros.push(lh.Mortalidad);
                numeros.push(lh.Descarte);
                numeros.push(lh.FinCampania);
                numeros.push(lh.Ingreso);
                numeros.push(lh.NroAvesFinal);

                //RESUMEN
                let NroAvesIniciadas = lm.NroAvesIniciadas + lh.NroAvesIniciadas;
                let Mortalidad = lm.Mortalidad + lh.Mortalidad;
                let MortalidadPorc = (Mortalidad / NroAvesIniciadas) * 100;
                let Descarte = lm.Descarte + lh.Descarte;
                let DescartePorc = (Descarte / NroAvesIniciadas) * 100;
                let FinCampania = lm.FinCampania + lh.FinCampania;
                let FinCampaniaPorc = (FinCampania / NroAvesIniciadas) * 100;
                let Ingresos = lm.Ingreso + lh.Ingreso;
                let IngresosPorc = (Ingresos / NroAvesIniciadas) * 100;
                let NroAvesFinal = lm.NroAvesFinal + lh.NroAvesFinal;
                numeros.push(NroAvesIniciadas);
                numeros.push(Mortalidad);
                numeros.push(MortalidadPorc.toFixed(2));
                numeros.push(Descarte);
                numeros.push(DescartePorc.toFixed(2));
                numeros.push(FinCampania);
                numeros.push(FinCampaniaPorc.toFixed(2));
                numeros.push(Ingresos);
                numeros.push(IngresosPorc.toFixed(2));
                numeros.push(NroAvesFinal);
                tabla.push({
                    Periodo: YearMonth(lm.Periodo),
                    Lote: Hoja.hoja,
                    class: 'active',
                    numeros
                });
            }

            return tabla;
        } else if (Hoja.hojaLote == 'PHI') {
            let lotes = await db.query("SELECT * FROM lotes WHERE idLevante = ?", [Hoja.idLevante]);
            let rowLM = [];
            let rowLH = [];
            let agrpLM = [];
            let agrpLH = [];
            for (let p = 0; p < lotes.length; p++) {
                const b = lotes[p];
                if (b.TipoGenero == 'LM') {
                    agrpLM.push(b.idLote)
                } else {
                    agrpLH.push(b.idLote)
                }
            }
            rowLH = await db.query(`SELECT Periodo, SUM(TotalHI) as TotalHI,
            SUM(TotalHNI_Comercial) as TotalHNI_Comercial, SUM(HNI_PruebaFert) as HNI_PruebaFert,
            SUM(TotalHNI_REF) as TotalHNI_REF, SUM(TotalDiarioProd_Huevo) as TotalDiarioProd_Huevo 
            FROM produccion_huevos_det WHERE idLote IN (${agrpLH.join(',')}) and Periodo <= ? 
            GROUP BY Periodo`, [Hoja.Periodo])

            rowLM = await db.query(`SELECT Periodo, SUM(TotalHI) as TotalHI,
            SUM(TotalHNI_Comercial) as TotalHNI_Comercial, SUM(HNI_PruebaFert) as HNI_PruebaFert,
            SUM(TotalHNI_REF) as TotalHNI_REF, SUM(TotalDiarioProd_Huevo) as TotalDiarioProd_Huevo 
            FROM produccion_huevos_det WHERE idLote IN (${agrpLM.join(',')}) and Periodo <= ? 
            GROUP BY Periodo`, [Hoja.Periodo])

            if (rowLH.length != 0 && rowLM.length != 0) {
                let tabla = [];
                for (let j = 0; j < rowLH.length; j++) {
                    const lh = rowLH[j];
                    const lm = rowLM[j];
                    let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [lm.Periodo]);
                    let cerrado = false;
                    if (info_periodo.length != 0) {
                        if (info_periodo[0].Estado == 0) {
                            cerrado = true;
                        }
                    }
                    let exist = await db.query(`SELECT * FROM costos_phi 
                    WHERE Lote = ? and Periodo = ?`, [Hoja.hoja, YearMonth(lm.Periodo)])
                    if (exist.length != 0 && cerrado == true) {
                        tabla.push({
                            Periodo: exist[0].Periodo,
                            Lote: exist[0].Lote,
                            class: exist[0].class,
                            numeros: JSON.parse(exist[0].numeros)
                        });
                    } else {
                        await db.query(`DELETE FROM costos_phi WHERE Periodo = ? and Lote = ?`,
                            [YearMonth(lm.Periodo), Hoja.hoja])
                        let y = lh.Periodo.substr(0, 4);
                        let m = lh.Periodo.substr(4, 2);
                        let numeros = [];
                        //INCUBABLELH
                        numeros.push(lh.TotalHI);
                        //INCUBABLELM
                        numeros.push(lm.TotalHI);

                        //PRODUCCION
                        let TotalHNI_Comercial = lm.TotalHNI_Comercial + lh.TotalHNI_Comercial;
                        let TotalHNI_REF = lm.TotalHNI_REF + lh.TotalHNI_REF;
                        let TotalDiarioProd_Huevo = lm.TotalDiarioProd_Huevo + lh.TotalDiarioProd_Huevo;
                        numeros.push(TotalHNI_Comercial);
                        numeros.push(TotalHNI_REF);
                        numeros.push(TotalDiarioProd_Huevo);

                        //TRANSFERENCIA LH
                        numeros.push(lh.TotalHI);
                        let ComercialLH = 0;
                        numeros.push(ComercialLH);
                        let RotosLH = 0;
                        let cons_rLH = await db.query(`SELECT COALESCE(SUM(HC),0) AS Rotos 
                        FROM cargas_resumen WHERE Fecha_Carga LIKE '${y}-${m}%' and Lote IN (${agrpLH.join(',')})`)
                        if (cons_rLH.length != 0) {
                            RotosLH = cons_rLH[0].Rotos
                        }
                        numeros.push(RotosLH)

                        //TRANSFERENCIA LM
                        numeros.push(lm.TotalHI);
                        let ComercialLM = 0;
                        numeros.push(ComercialLM);
                        let RotosLM = 0;
                        let cons_rLM = await db.query(`SELECT COALESCE(SUM(HC),0) AS Rotos 
                        FROM cargas_resumen WHERE Fecha_Carga LIKE '${y}-${m}%' and Lote IN (${agrpLM.join(',')})`)
                        if (cons_rLM.length != 0) {
                            RotosLM = cons_rLM[0].Rotos
                        }
                        numeros.push(RotosLM)

                        //TOTAL INCUBABLE LH
                        numeros.push(lh.TotalHI - ComercialLH - RotosLH)

                        //TOTAL INCUBABLE LM
                        numeros.push(lm.TotalHI - ComercialLM - RotosLM)
                        let INCUBABLE = (lh.TotalHI - ComercialLH - RotosLH) + (lm.TotalHI - ComercialLM - RotosLM);
                        let Total = INCUBABLE + TotalHNI_Comercial + (TotalHNI_REF + RotosLH + RotosLM);

                        //RESUMEN INCUBABLE
                        numeros.push(INCUBABLE)
                        numeros.push(Math.round((INCUBABLE / Total) * 100) + "%")

                        //RESUMEN COMERCIAL
                        numeros.push(TotalHNI_Comercial)
                        numeros.push(Math.round((TotalHNI_Comercial / Total) * 100) + "%")

                        //RESUMEN ROTOS / FARFAROS
                        numeros.push((TotalHNI_REF + RotosLH + RotosLM))
                        numeros.push(Math.round(((TotalHNI_REF + RotosLH + RotosLM) / Total) * 100) + "%")

                        //TOTAL PRODUCCION
                        numeros.push(Total)

                        tabla.push({
                            Periodo: YearMonth(lm.Periodo),
                            Lote: Hoja.hoja,
                            class: 'active',
                            numeros
                        });
                        await db.query(`INSERT INTO costos_phi (Periodo, Lote, numeros, class)
                        VALUES (?,?,?,?)`, [YearMonth(lm.Periodo), Hoja.hoja, JSON.stringify(numeros), 'active'])
                    }
                }
                return tabla;
            } else {
                return [];
            }
        } else if (Hoja.Propertie == 'Nacimiento') {
            let FactorAsignacion = 0;
            let primero = false;
            let numeros_vacios = [0, 0, 0, 0, 0, 0]
            let idLevante = Hoja.idLevante;
            let idUser = Hoja.idUser;
            let PeriodoNac = Hoja.PeriodoNac;
            let PeriodoNac_ant

            let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [PeriodoNac]);
            let cerrado = false;
            if (info_periodo.length != 0) {
                if (info_periodo[0].Estado == 0) {
                    cerrado = true;
                }
            }

            let mes = PeriodoNac.substr(4, 2);
            let year = PeriodoNac.substr(0, 4);
            let mes_ant
            let year_ant
            if (mes == '01') {
                year_ant = year - 1;
                mes_ant = '12'
            } else {
                year_ant = year;
                if (mes <= 10) {
                    mes_ant = '0' + (mes - 1)
                } else {
                    mes_ant = mes - 1
                }
            }
            PeriodoNac_ant = year_ant + mes_ant;

            await db.query(`DELETE FROM sala_nacimiento 
            WHERE idLevante = ? and PeriodoNac = ?`,
                [idLevante, PeriodoNac])

            let lotes = await db.query(`SELECT *
            FROM lotes WHERE idLevante = ? and Sexo = ?
            ORDER BY TipoGenero`, [idLevante, 'H']);
            let filas = []
            let rows_ant = await db.query("SELECT * FROM nacimiento_costeo WHERE idLevante = ? and PeriodoNac = ?", [idLevante, PeriodoNac_ant])
            if (rows_ant.length == 0) {
                primero = true;
                filas.push({
                    Carga: '',
                    Nacimiento: '',
                    tercero: 'SALDO ANTERIOR',
                    detalle: '',
                    numeros: numeros_vacios
                })
            } else {
                let FA_cons = await db.query(`SELECT *
                FROM gif_incub
                WHERE Periodo = ? and idLevante = ?`, [PeriodoNac, idLevante])
                if (FA_cons != 0) {
                    FactorAsignacion = FA_cons[0].CMO + FA_cons[0].CGI + FA_cons[0].CGD;
                }
                filas.push({
                    Carga: '',
                    Nacimiento: '',
                    tercero: 'SALDO ANTERIOR',
                    detalle: '',
                    numeros: [rows_ant[0].UnidadesLH,
                    Number(rows_ant[0].CUnitLH.toFixed(4)),
                    Number(rows_ant[0].CTotalLH.toFixed(2)),
                    rows_ant[0].UnidadesLM,
                    Number(rows_ant[0].CUnitLM.toFixed(4)),
                    Number(rows_ant[0].CTotalLM.toFixed(2))
                    ]
                })
            }

            filas.push({
                Carga: '',
                Nacimiento: '',
                tercero: 'Saldo Granja',
                detalle: '',
                numeros: numeros_vacios
            })

            let rows = await db.query("SELECT * FROM proyeccion_incubables WHERE idLevante = ? and Periodo = ?", [idLevante, PeriodoNac]);
            if (rows.length != 0) {
                if (rows[0].TotalCostoLH != null) {
                    let CUnitLH = (rows[0].TotalCostoLH / rows[0].ProduccionLH);
                    if (rows[0].ProduccionLH == 0) {
                        CUnitLH = 0;
                    }
                    let CUnitLM = (rows[0].TotalCostoLM / rows[0].ProduccionLM);
                    if (rows[0].ProduccionLM == 0) {
                        CUnitLM = 0;
                    }
                    filas.push({
                        Carga: '',
                        Nacimiento: '',
                        tercero: 'Produccion Transferida',
                        detalle: '',
                        numeros: [rows[0].ProduccionLH,
                        Number(CUnitLH.toFixed(4)),
                        Number(rows[0].TotalCostoLH.toFixed(2)),
                        rows[0].ProduccionLM,
                        Number(CUnitLM.toFixed(4)),
                        Number(rows[0].TotalCostoLM.toFixed(2))
                        ]
                    })
                } else {
                    return {
                        success: false,
                        message: 'Generar Costeo del Periodo Seleccionado.'
                    }
                }
            }
            if (filas.length < 3) {
                return {
                    success: false,
                    message: 'Falta llenar Proyección y consultar Unidades Producidas.'
                }
            }
            let UnidadLHTI = filas[0].numeros[0] + filas[1].numeros[0] + filas[2].numeros[0];
            let CTotalLHTI = filas[0].numeros[2] + filas[1].numeros[2] + filas[2].numeros[2];
            let CUnitLHTI = CTotalLHTI / UnidadLHTI;
            if (UnidadLHTI == 0) {
                CUnitLHTI = 0;
            }
            let UnidadLMTI = filas[0].numeros[3] + filas[1].numeros[3] + filas[2].numeros[3];
            let CTotalLMTI = filas[0].numeros[5] + filas[1].numeros[5] + filas[2].numeros[5];
            let CUnitLMTI = CTotalLMTI / UnidadLMTI;
            if (UnidadLMTI == 0) {
                CUnitLMTI = 0;
            }
            let numerosTI = [UnidadLHTI,
                Number(CUnitLHTI.toFixed(4)),
                Number(CTotalLHTI.toFixed(2)),
                UnidadLMTI,
                Number(CUnitLMTI.toFixed(4)),
                Number(CTotalLMTI.toFixed(2))
            ];

            filas.push({
                Carga: '',
                Nacimiento: '',
                tercero: 'Total Ingreso',
                class: 'active',
                detalle: null,
                numeros: numerosTI
            })
            let totales = [];
            let cargas = await db.query(`SELECT cr.CodCarga, cr.Fecha_Carga, cr.Fecha_Nacimiento
            FROM cargas cr
            WHERE cr.Fecha_Carga LIKE '%${year}-${mes}%'
            GROUP BY cr.CodCarga, cr.Fecha_Carga, cr.Fecha_Nacimiento
            ORDER BY cr.Fecha_Carga`)

            if (primero == true) {
                filas.push({
                    Carga: '',
                    Nacimiento: '',
                    tercero: '',
                    detalle: 'Huevos cargados',
                    numeros: numeros_vacios
                })
                filas.push({
                    Carga: '',
                    Nacimiento: '',
                    tercero: '',
                    detalle: 'Merma',
                    numeros: numeros_vacios
                })
                filas.push({
                    Carga: '',
                    Nacimiento: '',
                    tercero: '',
                    detalle: 'Sala Conservacion',
                    numeros: numeros_vacios
                })
                totales = numerosTI
            } else {
                if (cargas.length != 0) {
                    let sumHC_LH = 0;
                    let sumHC_LM = 0;
                    let Total_LH = 0;
                    let Total_LM = 0;
                    let sumCostoTotal_LH = 0;
                    let sumCostoTotal_LM = 0;
                    let exist = await db.query(`SELECT * FROM costos_nacimiento_cargas 
                    WHERE PeriodoNac = ? and idLevante = ?`, [PeriodoNac, idLevante])
                    if (exist.length != 0 && cerrado == true) {
                        for (let i = 0; i < exist.length; i++) {
                            const e = exist[i];
                            let numeros = JSON.parse(e.numeros)
                            filas.push({
                                Carga: e.Carga,
                                Nacimiento: e.Nacimiento,
                                tercero: e.tercero,
                                detalle: e.detalle,
                                numeros
                            })
                            sumHC_LH = sumHC_LH + e.merma_lh
                            sumHC_LM = sumHC_LM + e.merma_lm
                            Total_LH = Total_LH + numeros[0]
                            Total_LM = Total_LM + numeros[3]
                            sumCostoTotal_LH = sumCostoTotal_LH + e.CostoTotalLH;
                            sumCostoTotal_LM = sumCostoTotal_LM + e.CostoTotalLM;
                        }
                    } else {
                        await db.query(`DELETE FROM costos_nacimiento_cargas 
                        WHERE PeriodoNac = ? and idLevante = ?`, [PeriodoNac, idLevante])
                        for (let i = 0; i < cargas.length; i++) {
                            const e = cargas[i];
                            let CodCarga = e.CodCarga;
                            // HEMBRA
                            let cargas_hembra = await db.query(`SELECT cr.idCargas, cr.Lote, cr.Semana, cr.Total,
                                cr.HC, cr.Fecha_Carga
                                FROM cargas_resumen cr
                                WHERE cr.Fecha_Carga = '${formatDateGuion(e.Fecha_Carga)}' and Lote = ${lotes[0].idLote}`)
                            let UnidadesLH = 0;
                            let CostoTotalLH = 0;
                            let HC_LH = 0;
                            if (cargas_hembra.length != 0) {
                                UnidadesLH = cargas_hembra[0].Total;
                                HC_LH = cargas_hembra[0].HC;
                            }
                            let costoLH = await db.query(`SELECT * FROM costos 
                                WHERE C6_CALMA = '0004' and Hoja = 'Cargas' and C6_CRFNDOC = ${CodCarga} and 
                                AR_CDESCRI LIKE "%${lotes[0].lote_str}%" and Periodo = ${PeriodoNac}`)
                            if (costoLH.length != 0) {
                                CostoTotalLH = costoLH[0].C6_NMNIMPO;
                            }
                            sumHC_LH = sumHC_LH + HC_LH;
                            Total_LH = Total_LH + UnidadesLH;
                            sumCostoTotal_LH = sumCostoTotal_LH + CostoTotalLH;
                            // MACHO
                            let cargas_macho = await db.query(`SELECT cr.idCargas, cr.Lote, cr.Semana, cr.Total,
                                cr.HC, cr.Fecha_Carga
                                FROM cargas_resumen cr
                                WHERE cr.Fecha_Carga = '${formatDateGuion(e.Fecha_Carga)}' and Lote = ${lotes[1].idLote}`)
                            let UnidadesLM = 0;
                            let CostoTotalLM = 0;
                            let HC_LM = 0;
                            if (cargas_macho.length != 0) {
                                UnidadesLM = cargas_macho[0].Total;
                                HC_LM = cargas_macho[0].HC;
                            }
                            let costoLM = await db.query(`SELECT * FROM costos 
                                WHERE C6_CALMA = '0004' and Hoja = 'Cargas' and C6_CRFNDOC = ${CodCarga} and 
                                AR_CDESCRI LIKE "%${lotes[1].lote_str}%" and Periodo = ${PeriodoNac}`)
                            if (costoLM.length != 0) {
                                CostoTotalLM = costoLM[0].C6_NMNIMPO;
                            }
                            sumHC_LM = sumHC_LM + HC_LM;
                            Total_LM = Total_LM + UnidadesLM;
                            sumCostoTotal_LM = sumCostoTotal_LM + CostoTotalLM;

                            let tercero = ''
                            if (DatePeriodo(e.Fecha_Nacimiento) == PeriodoNac) {
                                let fc = formatDate(e.Fecha_Carga)
                                let fn = formatDate(e.Fecha_Nacimiento)
                                tercero = fn.split('/')[0] - fc.split('/')[0]
                            } else {
                                tercero = DifDays(e.Fecha_Carga, PeriodoNac)
                            }
                            let numeros = [UnidadesLH, 0, CostoTotalLH,
                                UnidadesLM, 0, CostoTotalLM
                            ]
                            filas.push({
                                Carga: formatDate(e.Fecha_Carga),
                                Nacimiento: formatDate(e.Fecha_Nacimiento),
                                tercero,
                                detalle: 'Huevos Cargados',
                                numeros
                            })
                            await db.query(`INSERT INTO costos_nacimiento_cargas (PeriodoNac, idLevante, 
                            Carga, Nacimiento, tercero, detalle, numeros, merma_lh, merma_lm, CostoTotalLH,
                            CostoTotalLM) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [PeriodoNac, idLevante,
                                formatDate(e.Fecha_Carga), formatDate(e.Fecha_Nacimiento), tercero, 'Huevos Cargados',
                                JSON.stringify(numeros), HC_LH, HC_LM, CostoTotalLH, CostoTotalLM])
                        }
                    }
                    filas.push({
                        Carga: '',
                        Nacimiento: '',
                        tercero: '',
                        detalle: 'Merma',
                        numeros: [sumHC_LH, 0, 0,
                            sumHC_LM, 0, 0
                        ]
                    })
                    filas.push({
                        Carga: '',
                        Nacimiento: '',
                        tercero: '',
                        detalle: 'Sala Conservacion',
                        numeros: [Total_LH + sumHC_LH, 0, sumCostoTotal_LH.toFixed(2),
                        Total_LM + sumHC_LM, 0, sumCostoTotal_LM.toFixed(2)
                        ]
                    })
                    let Tot_UnidadesLH = numerosTI[0] - (Total_LH + sumHC_LH);
                    let Tot_CostoTotalLH = numerosTI[2] - (sumCostoTotal_LH);
                    let Tot_CostoUnitarioLH = Tot_CostoTotalLH / Tot_UnidadesLH;

                    let Tot_UnidadesLM = numerosTI[3] - (Total_LM + sumHC_LM);
                    let Tot_CostoTotalLM = numerosTI[5] - (sumCostoTotal_LM);
                    let Tot_CostoUnitarioLM = Tot_CostoTotalLM / Tot_UnidadesLM;
                    totales = [
                        Tot_UnidadesLH,
                        Number(Tot_CostoUnitarioLH.toFixed(4)),
                        Number(Tot_CostoTotalLH.toFixed(2)),
                        Tot_UnidadesLM,
                        Number(Tot_CostoUnitarioLM.toFixed(4)),
                        Number(Tot_CostoTotalLM.toFixed(2))
                    ]
                }
            }

            let rows_actual = await db.query("SELECT * FROM nacimiento_costeo WHERE idLevante = ? and PeriodoNac = ?", [idLevante, PeriodoNac])
            if (rows_actual.length != 0) {
                if (primero == true) {
                    await db.query(`UPDATE nacimiento_costeo SET
                    UnidadesLH = ?, CUnitLH = ?, CTotalLH = ?, UnidadesLM = ?, CUnitLM = ?, CTotalLM = ?
                    WHERE idLevante = ? and PeriodoNac = ?`, [UnidadLHTI, CUnitLHTI, CTotalLHTI, UnidadLMTI, CUnitLMTI, CTotalLMTI, idLevante, PeriodoNac])
                } else {
                    await db.query(`UPDATE nacimiento_costeo SET
                    UnidadesLH = ?, CUnitLH = ?, CTotalLH = ?, UnidadesLM = ?, CUnitLM = ?, CTotalLM = ?
                    WHERE idLevante = ? and PeriodoNac = ?`, [totales[0], totales[1], totales[2], totales[3],
                    totales[4], totales[5], idLevante, PeriodoNac
                    ])
                }
            } else {
                if (primero == true) {
                    await db.query(`INSERT INTO nacimiento_costeo(
                    PeriodoNac, idLevante, UnidadesLH, CUnitLH, CTotalLH, UnidadesLM, CUnitLM, CTotalLM
                    ) VALUES (?,?,?,?,?,?,?,?)`, [PeriodoNac, idLevante, UnidadLHTI, CUnitLHTI, CTotalLHTI, UnidadLMTI, CUnitLMTI, CTotalLMTI])
                } else {
                    await db.query(`INSERT INTO nacimiento_costeo(
                    PeriodoNac, idLevante, UnidadesLH, CUnitLH, CTotalLH, UnidadesLM, CUnitLM, CTotalLM
                    ) VALUES (?,?,?,?,?,?,?,?)`, [PeriodoNac, idLevante, totales[0], totales[1], totales[2], totales[3],
                        totales[4], totales[5]
                    ])
                }
            }

            let rows_sc = await db.query("SELECT * FROM sala_conservacion WHERE idLevante = ? and PeriodoNac = ?", [idLevante, PeriodoNac])

            if (rows_sc.length != 0) {
                await db.query(`UPDATE sala_conservacion SET
                UnidadesLH = ?, CTotalLH = ?, UnidadesLM = ?, CTotalLM = ?
                WHERE idLevante = ? and PeriodoNac = ?`, [filas[filas.length - 1].numeros[0], filas[filas.length - 1].numeros[2],
                filas[filas.length - 1].numeros[3], filas[filas.length - 1].numeros[5], idLevante, PeriodoNac
                ])
            } else {
                await db.query(`INSERT INTO sala_conservacion(
                PeriodoNac, idLevante, UnidadesLH, CTotalLH, UnidadesLM, CTotalLM
                ) VALUES (?,?,?,?,?,?)`, [PeriodoNac, idLevante, filas[filas.length - 1].numeros[0], filas[filas.length - 1].numeros[2],
                    filas[filas.length - 1].numeros[3], filas[filas.length - 1].numeros[5]
                ])
            }

            await db.query(`DELETE FROM sala_incubacion 
            WHERE PeriodoNac = ? and idLevante = ?`,
                [PeriodoNac, idLevante]);

            let ant_si = await db.query(`SELECT * FROM sala_incubacion
            WHERE PeriodoNac = ? and idLevante = ? and fechaNacimiento LIKE '%${year}-${mes}%'`,
                [PeriodoNac_ant, idLevante])

            let filas2 = [];

            for (let i = 0; i < ant_si.length; i++) {
                const e = ant_si[i];
                let tercero = ''
                let clase = ''
                if (DatePeriodo(e.fechaNacimiento) == PeriodoNac) {
                    let fc = formatDate(e.fechaCarga)
                    let fn = formatDate(e.fechaNacimiento)
                    tercero = fn.split('/')[0] - fc.split('/')[0]
                    clase = 'yellow'
                } else {
                    tercero = DifDays(e.fechaCarga, PeriodoNac)
                    clase = ''
                }

                if (DatePeriodo(e.fechaNacimiento) != DatePeriodo(e.fechaCarga)) {
                    let fn = formatDate(e.fechaNacimiento)
                    tercero = parseInt(fn.split('/')[0])
                }

                filas2.push({
                    Carga: formatDate(e.fechaCarga),
                    Nacimiento: formatDate(e.fechaNacimiento),
                    tercero,
                    detalle: (e.HIULM + e.HIULH) * tercero,
                    clase,
                    FactorAsignacion: 0,
                    HIULH: e.HIULH,
                    CULH: e.CULH,
                    CMALH: e.CTLH,
                    CHLH: 0,
                    CILH: 0,
                    CTLH: 0,
                    HIULM: e.HIULM,
                    CULM: e.CULM,
                    CMALM: e.CTLM,
                    CHLM: 0,
                    CILM: 0,
                    CTLM: 0,
                })
            }

            for (let i = 0; i < cargas.length; i++) {
                const e = cargas[i];
                let CodCarga = e.CodCarga;
                let sumHC_LH = 0;
                let sumHC_LM = 0;
                let Total_LH = 0;
                let Total_LM = 0;
                let sumCostoTotal_LH = 0;
                let sumCostoTotal_LM = 0;
                // HEMBRA
                let cargas_hembra = await db.query(`SELECT cr.idCargas, cr.Lote, cr.Semana, cr.Total,
                    cr.HC, cr.Fecha_Carga
                    FROM cargas_resumen cr
                    WHERE cr.Fecha_Carga = '${formatDateGuion(e.Fecha_Carga)}' and Lote = ${lotes[0].idLote}`)
                let UnidadesLH = 0;
                let CostoUnitLH = 0;
                let CostoTotalLH = 0;
                let CostoMALH = 0;
                let HC_LH = 0;
                if (cargas_hembra.length != 0) {
                    UnidadesLH = cargas_hembra[0].Total;
                    HC_LH = cargas_hembra[0].HC;
                }
                let costoLH = await db.query(`SELECT * FROM costos 
                    WHERE C6_CALMA = '0004' and Hoja = 'Cargas' and C6_CRFNDOC = ${CodCarga} and 
                    AR_CDESCRI LIKE "%${lotes[0].lote_str}%" and Periodo = ${PeriodoNac}`)
                if (costoLH.length != 0) {
                    CostoTotalLH = costoLH[0].C6_NMNIMPO;
                }
                sumHC_LH = sumHC_LH + HC_LH;
                Total_LH = Total_LH + UnidadesLH;
                sumCostoTotal_LH = sumCostoTotal_LH + CostoTotalLH;
                // MACHO
                let cargas_macho = await db.query(`SELECT cr.idCargas, cr.Lote, cr.Semana, cr.Total,
                    cr.HC, cr.Fecha_Carga
                    FROM cargas_resumen cr
                    WHERE cr.Fecha_Carga = '${formatDateGuion(e.Fecha_Carga)}' and Lote = ${lotes[1].idLote}`)
                let UnidadesLM = 0;
                let CostoUnitLM = 0;
                let CostoTotalLM = 0;
                let CostoMALM = 0;
                let HC_LM = 0;
                if (cargas_macho.length != 0) {
                    UnidadesLM = cargas_macho[0].Total;
                    HC_LM = cargas_macho[0].HC;
                }
                let costoLM = await db.query(`SELECT * FROM costos 
                    WHERE C6_CALMA = '0004' and Hoja = 'Cargas' and C6_CRFNDOC = ${CodCarga} and 
                    AR_CDESCRI LIKE "%${lotes[1].lote_str}%" and Periodo = ${PeriodoNac}`)
                if (costoLM.length != 0) {
                    CostoTotalLM = costoLM[0].C6_NMNIMPO;
                }
                sumHC_LM = sumHC_LM + HC_LM;
                Total_LM = Total_LM + UnidadesLM;
                sumCostoTotal_LM = sumCostoTotal_LM + CostoTotalLM;

                let tercero = ''
                let clase = ''
                if (DatePeriodo(e.Fecha_Nacimiento) == PeriodoNac) {
                    let fc = formatDate(e.Fecha_Carga)
                    let fn = formatDate(e.Fecha_Nacimiento)
                    tercero = fn.split('/')[0] - fc.split('/')[0]
                    clase = 'yellow'
                } else {
                    tercero = DifDays(e.Fecha_Carga, PeriodoNac)
                    clase = ''
                }

                filas2.push({
                    Carga: formatDate(e.Fecha_Carga),
                    Nacimiento: formatDate(e.Fecha_Nacimiento),
                    tercero,
                    clase,
                    detalle: (UnidadesLM + UnidadesLH) * tercero,
                    FactorAsignacion: 0,
                    HIULH: UnidadesLH,
                    CULH: CostoUnitLH,
                    CMALH: CostoMALH,
                    CHLH: CostoTotalLH,
                    CILH: 0,
                    CTLH: 0,
                    HIULM: UnidadesLM,
                    CULM: CostoUnitLM,
                    CMALM: CostoMALM,
                    CHLM: CostoTotalLM,
                    CILM: 0,
                    CTLM: 0,
                })
            }
            let Totales2 = {
                dias: 0,
                DiasxUnid: 0,
                HIULH: 0,
                CMALH: 0,
                CHLH: 0,
                CILH: 0,
                CTLH: 0,
                HIULM: 0,
                CMALM: 0,
                CHLM: 0,
                CILM: 0,
                CTLM: 0,
            };
            for (let i = 0; i < filas2.length; i++) {
                const e = filas2[i];
                Totales2.dias = Totales2.dias + e.tercero;
                Totales2.DiasxUnid = Totales2.DiasxUnid + e.detalle
            }
            let filas3 = [];
            let filasuperior = [];
            let Totales3 = {
                HIULH: 0,
                CTLH: 0,
                SexadoLH: 0,
                E_MLH: 0,
                CTLH_N: 0,
                NPRBBLH: 0,
                NPDGLH: 0,
                CPRBBLH: 0,
                HIULM: 0,
                CTLM: 0,
                SexadoLM: 0,
                E_MLM: 0,
                CTLM_N: 0,
                NPRBBLM: 0,
                NPDGLM: 0,
                CPRBBLM: 0
            };
            if (primero != true) {
                for (let i = 0; i < filas2.length; i++) {
                    const e = filas2[i];
                    if (Totales2.DiasxUnid != 0) {
                        e.FactorAsignacion = Number((FactorAsignacion / Totales2.DiasxUnid).toFixed(4));
                        e.CILH = Number((e.tercero * (FactorAsignacion / Totales2.DiasxUnid) * e.HIULH).toFixed(2));
                        e.CILM = Number((e.tercero * (FactorAsignacion / Totales2.DiasxUnid) * e.HIULM).toFixed(2));
                    } else {
                        e.FactorAsignacion = Number((0).toFixed(4));
                        e.CILH = Number((e.tercero * (0) * e.HIULH).toFixed(2));
                        e.CILM = Number((e.tercero * (0) * e.HIULM).toFixed(2));
                    }
                    e.CTLH = Number((e.CILH + e.CHLH + e.CMALH).toFixed(2));
                    e.CTLM = Number((e.CILM + e.CHLM + e.CMALM).toFixed(2));
                    if (e.HIULH != 0) {
                        e.CULH = Number((e.CTLH / e.HIULH).toFixed(3));
                    }
                    if (e.HIULM != 0) {
                        e.CULM = Number((e.CTLM / e.HIULM).toFixed(3));
                    }
                    Totales2.HIULH = Totales2.HIULH + e.HIULH;
                    Totales2.CMALH = Totales2.CMALH + e.CMALH;
                    Totales2.CHLH = Totales2.CHLH + e.CHLH;
                    Totales2.CILH = Totales2.CILH + e.CILH;
                    Totales2.CTLH = Totales2.CTLH + e.CTLH;
                    Totales2.HIULM = Totales2.HIULM + e.HIULM;
                    Totales2.CMALM = Totales2.CMALM + e.CMALM;
                    Totales2.CHLM = Totales2.CHLM + e.CHLM;
                    Totales2.CTLM = Totales2.CTLM + e.CTLM;
                    Totales2.CILM = Totales2.CILM + e.CILM;
                    let per = e.Nacimiento.split('/')
                    let periodoNacimiento = per[2] + '' + per[1];
                    if (primero == false) {
                        if (e.clase != 'yellow') {
                            let fn = e.Nacimiento.split('/').reverse().join('-');
                            let fc = e.Carga.split('/').reverse().join('-');
                            await db.query(`INSERT INTO sala_incubacion (
                            PeriodoNac, idLevante, fechaCarga, fechaNacimiento, dias, diasxunid, factorAsignacion, 
                            HIULH, CULH, CMALH, CHLH, CILH, CTLH, HIULM, CULM, CMALM, CHLM, CILM, CTLM, IdUser) VALUES (
                            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                                [PeriodoNac, idLevante, fc, fn, e.tercero, e.detalle,
                                    e.FactorAsignacion, e.HIULH, e.CULH, e.CMALH, e.CHLH, e.CILH, e.CTLH, e.HIULM, e.CULM,
                                    e.CMALM, e.CHLM, e.CILM, e.CTLM, idUser])
                        }
                        if (e.clase == 'yellow') {
                            if (i == 0) {
                                let nombreloteCompleto = lotes[0].lote_str + "-" + lotes[1].lote_str;
                                let cscd = await db.query(`SELECT Costo_Sexado, Costo_Desunado 
                                FROM datos_cartilla WHERE lote_str = ? and Periodo = ?`,
                                    [nombreloteCompleto, PeriodoNac])
                                let cs = 0;
                                let cd = 0;
                                if (cscd.length != 0) {
                                    cs = cscd[0].Costo_Sexado;
                                    cd = cscd[0].Costo_Desunado;
                                }
                                let rincub = await db.query(`SELECT SUM(Valor) as Valor 
                                FROM rincub_tabla WHERE TG_CDESCRI_10 = ? and Periodo = ?
                                and Hoja = 'RINCUB'`, [nombreloteCompleto, PeriodoNac])
                                let E_M = 0;
                                if (rincub.length != 0) {
                                    E_M = rincub[0].Valor;
                                }
                                filasuperior.push({
                                    Nacimiento: '',
                                    HIULH: '',
                                    CTLH: 0,
                                    SexadoLH: cs,
                                    E_MLH: E_M,
                                    CTLH_N: '',
                                    NPRBBLH: '',
                                    NPDGLH: '',
                                    CPRBBLH: '',
                                    HIULM: '',
                                    CTLM: 0,
                                    SexadoLM: cd,
                                    E_MLM: 0,
                                    CTLM_N: '',
                                    NPRBBLM: '',
                                    NPDGLM: '',
                                    CPRBBLM: '',
                                })
                            }
                            let fecNacGuion = e.Nacimiento.split('/').reverse().join('-');
                            let nac_lh = await db.query(`SELECT * FROM 
                            nacimiento_det WHERE fechaNacimiento = ? and
                            CodigoLote = ?`, [fecNacGuion, lotes[0].lote_str]);
                            let NPRBBLH = 0;
                            let NPDGLH = 0;
                            if (nac_lh.length != 0) {
                                NPRBBLH = nac_lh[0].Ventas;
                                NPDGLH = nac_lh[0].DesmedroSubProd;
                            }
                            e.NPRBBLH = NPRBBLH;
                            e.NPDGLH = NPDGLH;
                            let nac_lm = await db.query(`SELECT * FROM 
                            nacimiento_det WHERE fechaNacimiento = ? and
                            CodigoLote = ?`, [fecNacGuion, lotes[1].lote_str]);
                            let NPRBBLM = 0;
                            let NPDGLM = 0;
                            if (nac_lm.length != 0) {
                                NPRBBLM = nac_lm[0].Ventas;
                                NPDGLM = nac_lm[0].DesmedroSubProd;
                            }
                            e.NPRBBLM = NPRBBLM;
                            e.NPDGLM = NPDGLM;
                            Totales3.HIULH = Totales3.HIULH + e.HIULH;
                            Totales3.CTLH = Totales3.CTLH + e.CTLH;
                            Totales3.NPRBBLH = Totales3.NPRBBLH + e.NPRBBLH;
                            Totales3.NPDGLH = Totales3.NPDGLH + e.NPDGLH;
                            Totales3.HIULM = Totales3.HIULM + e.HIULM;
                            Totales3.CTLM = Totales3.CTLM + e.CTLM;
                            Totales3.NPRBBLM = Totales3.NPRBBLM + e.NPRBBLM;
                            Totales3.NPDGLM = Totales3.NPDGLM + e.NPDGLM;
                            filas3.push(e)
                        }
                    }
                }

                filasuperior[0].CTLH = filasuperior[0].SexadoLH / (Totales3.NPRBBLH + Totales3.NPDGLH + Totales3.NPRBBLM + Totales3.NPDGLM)

                for (let i = 0; i < filas3.length; i++) {
                    const f = filas3[i];
                    //LH
                    f.SexadoLH = (f.NPRBBLH + f.NPDGLH) * filasuperior[0].CTLH;
                    f.E_MLH = filasuperior[0].E_MLH * f.NPRBBLH / (Totales3.NPRBBLH + Totales3.NPRBBLM);
                    f.CTLH_N = f.SexadoLH + f.E_MLH + f.CTLH;
                    f.CPRBBLH = f.CTLH_N / f.NPRBBLH;
                    if (isNaN(f.CPRBBLH)) {
                        f.CPRBBLH = 0;
                    }
                    //LM
                    f.SexadoLM = ((f.NPRBBLM + f.NPDGLM) * filasuperior[0].CTLM) + filasuperior[0].SexadoLM * f.NPRBBLM / Totales3.NPRBBLM;
                    if (isNaN(f.SexadoLM)) {
                        f.SexadoLM = 0
                    }
                    f.E_MLM = filasuperior[0].E_MLH * f.NPRBBLM / (Totales3.NPRBBLH + Totales3.NPRBBLM);
                    f.CTLM_N = f.SexadoLM + f.E_MLM + f.CTLM;
                    f.CPRBBLM = f.CTLM_N / f.NPRBBLM;
                    console.log("infinity", f.CPRBBLM)

                    if (isNaN(f.CPRBBLM) || f.CPRBBLM == Infinity) {
                        f.CPRBBLM = 0;
                    }
                    // console.log('f :>> ', f);
                    let fechaNacimiento = new Date(f.Nacimiento.split('/').reverse().join('/'))
                    await db.query(`INSERT INTO sala_nacimiento ( PeriodoNac, idLevante, Dias, 
                    fechaNacimiento, HIULH, CILH, SEXADOLH, EMLH, CTLH, NPRBBLH, NPDGLH, CPRBBLH, 
                    CHLH, HIULM, CILM, SEXADOLM, EMLM, CTLM, NPRBBLM, NPDGLM, CPRBBLM, CHLM, diasxunid) 
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [PeriodoNac, idLevante, f.tercero, fechaNacimiento, f.HIULH, f.CILH, f.SexadoLH,
                            f.E_MLH, f.CTLH_N, f.NPRBBLH, f.NPDGLH, f.CPRBBLH, f.CHLH, f.HIULM, f.CILM,
                            f.SexadoLM, f.E_MLM, f.CTLM_N, f.NPRBBLM, f.NPDGLM, f.CPRBBLM, f.CHLM, f.detalle])
                    //TOTALES LH
                    Totales3.SexadoLH = Totales3.SexadoLH + f.SexadoLH;
                    Totales3.E_MLH = Totales3.E_MLH + f.E_MLH;
                    Totales3.CTLH_N = Totales3.CTLH_N + f.CTLH_N;
                    Totales3.CPRBBLH = Totales3.CTLH_N / Totales3.NPRBBLH;
                    //TOTALES LM
                    Totales3.SexadoLM = Totales3.SexadoLM + f.SexadoLM;
                    Totales3.E_MLM = Totales3.E_MLM + f.E_MLM;
                    Totales3.CTLM_N = Totales3.CTLM_N + f.CTLM_N;
                    Totales3.CPRBBLM = Totales3.CTLM_N / Totales3.NPRBBLM;
                }
            }

            if (Totales3.HIULH == 0 && Totales3.HIULM == 0) {
                filas3 = [];
                filasuperior = [];
            }

            return {
                success: true,
                fechaFinPeriodo: obtainDate(PeriodoNac),
                primero,
                tableConservacion: {
                    rows: filas,
                    totales
                },
                tableIncubacion: {
                    rows: filas2,
                    FactorAsignacion,
                    totales: Totales2
                },
                tablaNacimiento: {
                    filasuperior,
                    rows: filas3,
                    totales: Totales3
                }
            }
        } else if (Hoja.hojaLote == 'Hoja-2') {
            let prod = await db.query("SELECT * FROM produccion WHERE idLevante = ?", [Hoja.idLevante])
            if (prod.length == 0) {
                return {
                    success: false,
                    message: "El Lote seleccionado aun no se encuentra en producción."
                }
            }
            let lev = await db.query(`SELECT * 
            FROM lotes 
            WHERE idLevante = ? and Sexo = 'H'
            ORDER BY TipoGenero`, [Hoja.idLevante]);
            let loteH = lev[0];
            let loteM = lev[1];
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
            let hic = [];
            let porcnac = [];
            let titulos = [];
            //PART 1
            let sip = [];
            let chii = [];
            let cthi = [];
            //PART 2
            let sip2 = [];
            let cmoi = [];
            let ctmo = [];
            //PART 3
            let sip3 = [];
            let cgii = [];
            let ctgi = [];
            //PART 4
            let sip4 = [];
            let cdi = [];
            let ctsmd = [];
            //PART 5
            let ci = [];
            let cn = [];
            let emp = [];
            let sexa = [];
            let desu = [];
            let pv = [];
            //PART 6
            let ctpbbr = [];
            let ctpbbr2 = [];
            let cupbbr = [];
            let cuhi = [];
            let cixh = [];
            for (let j = 0; j < periodos.length; j++) {
                const pe = periodos[j];
                const pe_ant = periodos[j - 1];
                let y = pe.substr(0, 4);
                let m = pe.substr(4, 2);

                hic.push('')
                porcnac.push('')
                titulos.push('')
                let cons_empaque = await db.query(`SELECT Valor FROM rincub_tabla 
                WHERE Periodo = ? and TG_CDESCRI_10 = ? and TG_CDESCRI_38 = 'ENVASES'`, [pe, Lote])
                let EMPAQUE = 0;
                if (cons_empaque.length != 0) {
                    EMPAQUE = cons_empaque[0].Valor
                }

                let cscd = await db.query(`SELECT Costo_Sexado, Costo_Desunado 
                FROM datos_cartilla WHERE idLevante = ? and Periodo = ?`,
                    [Hoja.idLevante, pe])
                let cs = 0;
                let cd = 0;
                if (cscd.length != 0) {
                    cs = cscd[0].Costo_Sexado;
                    cd = cscd[0].Costo_Desunado;
                }

                let rows_sc = await db.query(`SELECT * FROM sala_conservacion 
                WHERE idLevante = ? and PeriodoNac = ?`, [Hoja.idLevante, pe])
                let CHII = 0;

                if (rows_sc.length != 0) {
                    CHII = rows_sc[0].CTotalLH + rows_sc[0].CTotalLM
                }

                let gif_incub_ant = await db.query(`SELECT * FROM gif_incub 
                WHERE idLevante = ? and Periodo = ?`, [Hoja.idLevante, pe_ant])
                let CTMO_ant = 0;
                let CTGI_ant = 0;
                let CTSMD_ant = 0;
                if (gif_incub_ant.length != 0) {
                    CTMO_ant = gif_incub_ant[0].CMO
                    CTGI_ant = gif_incub_ant[0].CGI
                    CTSMD_ant = gif_incub_ant[0].CGD
                }

                let gif_incub = await db.query(`SELECT * FROM gif_incub 
                WHERE idLevante = ? and Periodo = ?`, [Hoja.idLevante, pe])
                let CTMO = 0;
                let CTGI = 0;
                let CTSMD = 0;
                if (gif_incub.length != 0) {
                    CTMO = gif_incub[0].CMO
                    CTGI = gif_incub[0].CGI
                    CTSMD = gif_incub[0].CGD
                }

                let dxu = await db.query(`SELECT COALESCE(SUM(diasxunid),0) as diasxunid
                FROM sala_incubacion WHERE PeriodoNac = ? and idLevante = ?`, [pe, Hoja.idLevante])
                let diasxunidSI = 0;
                if (dxu.length != 0) {
                    diasxunidSI = dxu[0].diasxunid
                }

                let chii_ant = await db.query(`SELECT COALESCE(SUM(diasxunid),0) as diasxunid, 
                COALESCE(SUM(CHLH),0) as CHIILH, COALESCE(SUM(CHLM),0) as CHIILM 
                FROM sala_nacimiento WHERE PeriodoNac = ? and idLevante = ?`, [pe_ant, Hoja.idLevante])
                let CHIILH_ant = 0
                let CHIILM_ant = 0
                let diasxunidSI_ant = 0;
                if (chii_ant.length != 0) {
                    CHIILH_ant = chii_ant[0].CHIILH
                    CHIILM_ant = chii_ant[0].CHIILM
                    diasxunidSI_ant = diasxunidSI_ant + chii_ant[0].diasxunid
                }

                let sip_ant = await db.query(`SELECT COALESCE(SUM(diasxunid),0) as diasxunid, 
                COALESCE(SUM(CHLH),0) as SIPLH, COALESCE(SUM(CHLM),0) as SIPLM, 
                COALESCE(SUM(Dias*HIULH),0) as LH, COALESCE(SUM(Dias*HIULM),0) as LM 
                FROM sala_incubacion WHERE PeriodoNac = ? and idLevante = ?`, [pe_ant, Hoja.idLevante])
                let SIPLH = 0
                let SIPLM = 0
                let cmoiLH_ant = 0;
                let cmoiLM_ant = 0;
                let cgiiLH_ant = 0;
                let cgiiLM_ant = 0;
                let ctsmdLH_ant = 0;
                let ctsmdLM_ant = 0;
                if (sip_ant.length != 0) {
                    //DIASxUNID
                    diasxunidSI_ant = diasxunidSI_ant + sip_ant[0].diasxunid
                    SIPLH = sip_ant[0].SIPLH
                    SIPLM = sip_ant[0].SIPLM
                    //GIF INCUB
                    let div_ant = (CTMO_ant / diasxunidSI_ant);
                    if (CTMO_ant == 0 || diasxunidSI_ant == 0) {
                        div_ant = 0;
                    }
                    cmoiLH_ant = div_ant * sip_ant[0].LH
                    cmoiLM_ant = div_ant * sip_ant[0].LM
                    let div_ant2 = (CTGI_ant / diasxunidSI_ant);
                    if (CTGI_ant == 0 || diasxunidSI_ant == 0) {
                        div_ant2 = 0;
                    }
                    cgiiLH_ant = div_ant2 * sip_ant[0].LH
                    cgiiLM_ant = div_ant2 * sip_ant[0].LM
                    let div_ant3 = (CTSMD_ant / diasxunidSI_ant);
                    if (CTSMD_ant == 0 || diasxunidSI_ant == 0) {
                        div_ant3 = 0;
                    }
                    ctsmdLH_ant = div_ant3 * sip_ant[0].LH
                    ctsmdLM_ant = div_ant3 * sip_ant[0].LM
                }

                let cons_chii = await db.query(`SELECT COALESCE(SUM(diasxunid),0) as diasxunid, 
                COALESCE(SUM(CHLH),0) as CHIILH, COALESCE(SUM(CHLM),0) as CHIILM,
                COALESCE(SUM(Dias*HIULH),0) as LH, COALESCE(SUM(Dias*HIULM),0) as LM,
                COALESCE(SUM(NPRBBLH),0) as NPRBBLH, COALESCE(SUM(NPRBBLM),0) as NPRBBLM,
                COALESCE(SUM(SEXADOLH),0) as SEXADOLH, COALESCE(SUM(SEXADOLM),0) as SEXADOLM,
                COALESCE(SUM(EMLH),0) as EMLH, COALESCE(SUM(EMLM),0) as EMLM,
                COALESCE(SUM(HIULH),0) as HIULH, COALESCE(SUM(HIULM),0) as HIULM
                FROM sala_nacimiento WHERE PeriodoNac = ? and idLevante = ?`, [pe, Hoja.idLevante])
                let CHIILH = 0
                let CHIILM = 0
                let cmoiLH = 0;
                let cmoiLM = 0;
                let cgiiLH = 0;
                let cgiiLM = 0;
                let ctsmdLH = 0;
                let ctsmdLM = 0;
                let NPRBBLH = 0;
                let NPRBBLM = 0;
                let SEXADOLH = 0;
                let SEXADOLM = 0;
                let EMLH = 0;
                let EMLM = 0;
                let HIULH = 0;
                let HIULM = 0;
                if (cons_chii.length != 0) {
                    HIULH = cons_chii[0].HIULH;
                    HIULM = cons_chii[0].HIULM;
                    EMLH = cons_chii[0].EMLH;
                    EMLM = cons_chii[0].EMLM;
                    SEXADOLH = cons_chii[0].SEXADOLH;
                    SEXADOLM = cons_chii[0].SEXADOLM;
                    NPRBBLH = cons_chii[0].NPRBBLH;
                    NPRBBLM = cons_chii[0].NPRBBLM;
                    CHIILH = cons_chii[0].CHIILH
                    CHIILM = cons_chii[0].CHIILM
                    //DIASxUNID
                    diasxunidSI = diasxunidSI + cons_chii[0].diasxunid
                    //GIF INCUB

                    let div = (CTMO / diasxunidSI);
                    if (CTMO == 0 || diasxunidSI == 0) {
                        div = 0;
                    }
                    cmoiLH = div * cons_chii[0].LH
                    cmoiLM = div * cons_chii[0].LM
                    let div2 = (CTGI / diasxunidSI);
                    if (CTGI == 0 || diasxunidSI == 0) {
                        div2 = 0;
                    }
                    cgiiLH = div2 * cons_chii[0].LH
                    cgiiLM = div2 * cons_chii[0].LM
                    let div3 = (CTSMD / diasxunidSI);
                    if (CTSMD == 0 || diasxunidSI == 0) {
                        div3 = 0;
                    }
                    ctsmdLH = div3 * cons_chii[0].LH
                    ctsmdLM = div3 * cons_chii[0].LM
                }

                //PART 1 - IZQ
                sip.push('')
                chii.push('')
                cthi.push(CHII)

                //PART 2 - IZQ
                sip2.push('')
                cmoi.push('')
                ctmo.push(CTMO)

                //PART 3 - IZQ
                sip3.push('')
                cgii.push('')
                ctgi.push(CTGI)

                //PART 4 - IZQ
                sip4.push('')
                cdi.push('')
                ctsmd.push(CTSMD)

                //PART 5 - IZQ
                ci.push(CHII + CTMO + CTGI + CTSMD)
                cn.push('')
                emp.push(EMPAQUE)
                sexa.push(cs)
                desu.push(NPRBBLM * 0.14)
                pv.push((EMLH + EMLM) - EMPAQUE)

                //PART 6 - IZQ
                ctpbbr.push(CHII + CTMO + CTGI + CTSMD + EMLH + EMLM + cs + (NPRBBLM * 0.14))
                ctpbbr2.push(NPRBBLH + NPRBBLM)
                cupbbr.push('')
                cuhi.push('')
                cixh.push('')

                //LH
                hic.push(HIULH)
                let porcnac_value_LH = (NPRBBLH / HIULH * 100).toFixed(2)
                if (isNaN(porcnac_value_LH)) {
                    porcnac.push("0.00%")
                } else {
                    porcnac.push(porcnac_value_LH + "%")
                }
                titulos.push('L. Hembra')

                //PART 1 - LH
                sip.push(SIPLH)
                chii.push(CHIILH)
                cthi.push(SIPLH + CHIILH)

                //PART 2 - LH
                sip2.push(cmoiLH_ant)
                cmoi.push(cmoiLH)
                ctmo.push(cmoiLH + cmoiLH_ant)

                //PART 3 - LH
                sip3.push(cgiiLH_ant)
                cgii.push(cgiiLH)
                ctgi.push(cgiiLH + cgiiLH_ant)

                //PART 4 - LH
                sip4.push(ctsmdLH_ant)
                cdi.push(ctsmdLH)
                ctsmd.push(ctsmdLH_ant + ctsmdLH)

                //PART 5 - LH
                ci.push(SIPLH + CHIILH + cmoiLH + cmoiLH_ant + cgiiLH + cgiiLH_ant + ctsmdLH_ant + ctsmdLH)
                cn.push("")
                sexa.push(SEXADOLH)
                desu.push('')
                if (isNaN((((EMLH + EMLM) - EMPAQUE) * NPRBBLH) / (NPRBBLH + NPRBBLM))) {
                    emp.push(EMLH)
                    pv.push(0)
                } else {
                    emp.push(EMLH - ((((EMLH + EMLM) - EMPAQUE) * NPRBBLH) / (NPRBBLH + NPRBBLM)))
                    pv.push((((EMLH + EMLM) - EMPAQUE) * NPRBBLH) / (NPRBBLH + NPRBBLM))
                }

                //PART 6 - LH
                ctpbbr.push(ci[ci.length - 1] + emp[emp.length - 1] + SEXADOLH + pv[pv.length - 1])
                ctpbbr2.push(NPRBBLH)
                let cupbbr_value_LH = (ctpbbr[ctpbbr.length - 1] / NPRBBLH).toFixed(2)
                if (isNaN(cupbbr_value_LH) || !isFinite(cupbbr_value_LH)) {
                    cupbbr.push("S/. 0")
                } else {
                    console.log('cupbbr_value_LH :>> ', cupbbr_value_LH);
                    cupbbr.push("S/. " + cupbbr_value_LH)
                }
                let cuhi_value_LH = ((SIPLH + CHIILH) / HIULH).toFixed(2)
                if (isNaN(cuhi_value_LH) || !isFinite(cuhi_value_LH)) {
                    cuhi.push("S/. 0")
                } else {
                    cuhi.push("S/. " + cuhi_value_LH)
                }
                let cixh_value_LH = ((ci[ci.length - 1] - (SIPLH + CHIILH)) / HIULH).toFixed(2)
                if (isNaN(cixh_value_LH) || !isFinite(cixh_value_LH)) {
                    cixh.push("S/. 0")
                } else {
                    cixh.push("S/. " + cixh_value_LH)
                }

                //LM
                hic.push(HIULM)
                let porcnac_value_LM = (NPRBBLM / HIULM * 100).toFixed(2)
                if (isNaN(porcnac_value_LM)) {
                    porcnac.push("0.00%")
                } else {
                    porcnac.push(porcnac_value_LM + "%")
                }
                titulos.push('L. Macho')

                //PART 1 - LM
                sip.push(SIPLM)
                chii.push(CHIILM)
                cthi.push(SIPLM + CHIILM)

                //PART 2 - LM
                sip2.push(cmoiLM_ant)
                cmoi.push(cmoiLM)
                ctmo.push(cmoiLM + cmoiLM_ant)

                //PART 3 - LM
                sip3.push(cgiiLM_ant)
                cgii.push(cgiiLM)
                ctgi.push(cgiiLM + cgiiLM_ant)

                //PART 4 - LM
                sip4.push(ctsmdLM_ant)
                cdi.push(ctsmdLM)
                ctsmd.push(ctsmdLM_ant + ctsmdLM)

                //PART 5 - LM
                ci.push(SIPLM + CHIILM + cmoiLM + cmoiLM_ant + cgiiLM + cgiiLM_ant + ctsmdLM_ant + ctsmdLM)
                cn.push('')
                sexa.push(sexa[sexa.length - 2] - sexa[sexa.length - 1])
                desu.push(NPRBBLM * 0.14)
                if (isNaN(pv[pv.length - 1] * NPRBBLM / NPRBBLH)) {
                    emp.push(EMLH)
                    pv.push(0)
                } else {
                    emp.push(emp[emp.length - 2] - emp[emp.length - 1])
                    pv.push(pv[pv.length - 1] * NPRBBLM / NPRBBLH)
                }

                //PART 6 - LM
                ctpbbr.push(ci[ci.length - 1] + emp[emp.length - 1] + sexa[sexa.length - 1] + pv[pv.length - 1] + (NPRBBLM * 0.14))
                ctpbbr2.push(NPRBBLM)
                let cupbbr_value_LM = (ctpbbr[ctpbbr.length - 1] / NPRBBLM).toFixed(2)
                if (isNaN(cupbbr_value_LM) || !isFinite(cupbbr_value_LM)) {
                    cupbbr.push("S/. 0")
                } else {
                    cupbbr.push("S/. " + cupbbr_value_LM)
                }
                let cuhi_value_LM = ((SIPLM + CHIILM) / HIULM).toFixed(2)
                if (isNaN(cuhi_value_LM) || !isFinite(cuhi_value_LM)) {
                    cuhi.push("S/. 0")
                } else {
                    cuhi.push("S/. " + cuhi_value_LM)
                }
                let cixh_value_LM = ((ci[ci.length - 1] - (SIPLM + CHIILM)) / HIULM).toFixed(2)
                if (isNaN(cixh_value_LM) || !isFinite(cixh_value_LM)) {
                    cixh.push("S/. 0")
                } else {
                    cixh.push("S/. " + cixh_value_LM)
                }

                data.push({
                    Periodo: pe,
                    idLevante: Hoja.idLevante,
                    Lote
                })
            }

            return {
                success: true,
                data: data,
                hic,
                titulos,
                porcnac,
                part1: {
                    sip,
                    chii,
                    cthi
                },
                part2: {
                    sip2,
                    cmoi,
                    ctmo
                },
                part3: {
                    sip3,
                    cgii,
                    ctgi
                },
                part4: {
                    sip4,
                    cdi,
                    ctsmd
                },
                part5: {
                    ci,
                    cn,
                    emp,
                    sexa,
                    desu,
                    pv
                },
                part6: {
                    ctpbbr,
                    ctpbbr2,
                    cupbbr,
                    cuhi,
                    cixh
                }
            }
        } else {
            let Periodo = Hoja.Periodo;
            let HojaC = await db.query("SELECT Hoja FROM tabla_costeo_granja WHERE Periodo = ?", [Periodo]);
            if (HojaC.length == 0) {
                return {
                    success: false,
                    message: 'Por favor consulte en Periodo Costos-Granja'
                }
            }
            const pool = await poolPromise
            let nroAves = [];
            let nroAvesPROD = [];
            let nombrePeriodos = []
            let nombrePeriodosPROD = [];
            let lotes = await db.query("SELECT * FROM lotes WHERE idLevante = ?", [Hoja.idLevante]);
            let idProduccion = lotes[0].idProduccion;
            let idLotesH = [];
            let idLotesM = [];
            let NumAvesH = 0;
            let NumAvesM = 0;
            for (let i = 0; i < lotes.length; i++) {
                const e = lotes[i];
                if (e.TipoGenero == 'LM') {
                    NumAvesM = NumAvesM + e.NumHembras
                    idLotesM.push(e.idLote)
                } else {
                    NumAvesH = NumAvesH + e.NumHembras
                    idLotesH.push(e.idLote)
                }
            }
            let levante = await db.query("SELECT * FROM levantes WHERE idLevante = ?", [Hoja.idLevante]);
            let produ = await db.query("SELECT * FROM produccion WHERE idLevante = ?", [Hoja.idLevante]);
            let PeriodoFinLevante = DatePeriodo(levante[0].FechaFinLevante);
            let PeriodoIniProduccion = DatePeriodo(levante[0].FechaFinLevante);
            let PeriodoFinProduccion = false;
            if (produ.length != 0) {
                PeriodoIniProduccion = DatePeriodo(produ[0].FechaIniProduccion);
                PeriodoFinProduccion = DatePeriodo(produ[0].FechaFinProduccion);
            }
            let Periodo2 = DatePeriodo(levante[0].FechaIniLevante);
            let Periodo_ant = DatePeriodo_1(levante[0].FechaIniLevante)
            let cant_diasSobrantes = calculateFecha(levante[0].FechaFinLevante);
            let cant_diasNoSobrantes = calculateFechaNoSobrante(levante[0].FechaFinLevante) - cant_diasSobrantes;
            let cant_diasTotales = calculateFechaNoSobrante(levante[0].FechaFinLevante);
            let ytwo_inicial = Periodo2.substr(2, 2);
            let agrpLM = [];
            for (let p = 0; p < lotes.length; p++) {
                const b = lotes[p];
                agrpLM.push(b.idLote)
            }
            let Periodos = [];
            Periodos.push(Periodo_ant)
            let TG_CDESCRI_38 = [];
            let rest = await db.query("SELECT TG_CDESCRI_38, Periodo FROM costos WHERE Periodo <= ? and Periodo >= ? and C6_CFAMILI != 01 GROUP BY TG_CDESCRI_38, Periodo ORDER BY Periodo, TG_CDESCRI_38", [Periodo, Periodo2])

            for (let r = 0; r < rest.length; r++) {
                const element = rest[r];
                Periodos.push(element.Periodo);
                TG_CDESCRI_38.push(element.TG_CDESCRI_38)
            }

            let lote_res = await db.query("SELECT GROUP_CONCAT(DISTINCT(lote_str) SEPARATOR '-') as lote_str FROM lotes WHERE idLevante = ?", [Hoja.idLevante]);
            let lote = lote_res[0].lote_str

            let TDESCRI = `SELECT ACODANE FROM RSCONCAR..CT0003ANEX WHERE AVANEXO = 'D' and ADESANE = '${lote}'`;
            const resultQuery = await pool.request()
                .query(TDESCRI)
            let resultTDESCRI = await resultQuery.recordset;
            let codigo = 0;
            if (resultTDESCRI.length != 0) {
                codigo = resultTDESCRI[0].ACODANE;
            }

            let query1 = `Select SUM(coalesce(DMNIMPOR,0)) AS DMNIMPOR, PDESCRI
                From RSCONCAR..CT0003COMD${ytwo_inicial} 
                Left Join RSCONCAR..CT0003PLEM on ltrim(rtrim(coalesce(DCUENTA,'')))=ltrim(rtrim(coalesce(PCUENTA,'')))  
                Left Join RSCONCAR..CT0003COMC${ytwo_inicial} On DSUBDIA = CSUBDIA
                And DCOMPRO=CCOMPRO  Where DCUENTA IN ('3521201','352111')
                And DCODANE = '${codigo}'
                And CSITUA='F'  And (CONVERT(DATETIME,DFECCOM2,103)<=Convert(datetime,'31/12/20${ytwo_inicial}',103)) 
                and DSUBDIA != '32'
                GROUP BY PDESCRI`
            const resultQuery1 = await pool.request()
                .query(query1)
            let DMNIMPOR = 0
            if (resultQuery1.recordset.length != 0) {
                DMNIMPOR = await resultQuery1.recordset[0].DMNIMPOR;
            }

            let porcPollosBBM = NumAvesM / (NumAvesH + NumAvesM)
            let porcPollosBBH = NumAvesH / (NumAvesH + NumAvesM)
            let PollosBBM = (porcPollosBBM * DMNIMPOR).toFixed(2)
            let PollosBBH = (porcPollosBBH * DMNIMPOR).toFixed(2)

            let fila = [];
            let filaPROD = [];
            let colspanLevante = 0;
            let colspanProduccion = 0;
            let estado = false;
            let n1 = [];
            let sumn1L = 0;
            n1.push('POLLO BB HEMBRA')
            for (let w = 0; w < Periodos.unique().length; w++) {
                const pe = Periodos.unique()[w];
                if (pe <= PeriodoIniProduccion) {
                    if (Periodo2 == pe) {
                        n1.push(PollosBBH)
                        sumn1L = sumn1L + parseFloat(PollosBBH);
                    } else {
                        if (PeriodoIniProduccion == PeriodoFinLevante || pe != PeriodoIniProduccion) {
                            n1.push(0)
                        }
                    }
                }
            }
            n1.push(sumn1L.toFixed(2));
            fila.push({
                class: '',
                numeros: n1
            })

            let n2 = [];
            let sumn2L = 0;
            n2.push('POLLO BB MACHO')
            for (let w = 0; w < Periodos.unique().length; w++) {
                const pe = Periodos.unique()[w];
                if (pe <= PeriodoIniProduccion) {
                    if (Periodo2 == pe) {
                        n2.push(PollosBBM)
                        sumn2L = sumn2L + parseFloat(PollosBBM);
                    } else {
                        if (PeriodoIniProduccion == PeriodoFinLevante || pe != PeriodoIniProduccion) {
                            n2.push(0)
                        }
                    }
                }
            }
            n2.push(sumn2L.toFixed(2));
            fila.push({
                class: '',
                numeros: n2
            })

            let sumNumL1 = 0;
            let sumNumL2 = 0;
            let nums1 = [];
            let nums2 = [];
            nums1.push('ALIMENTO BALANCEADO MACHO')
            nums2.push('ALIMENTO BALANCEADO HEMBRA')
            let savesm = [];
            let savesh = [];
            for (let f = 0; f < Periodos.unique().length; f++) {
                const fe = Periodos.unique()[f];
                if (fe <= PeriodoIniProduccion) {
                    let pe = await db.query("SELECT * FROM periodo WHERE YearMonth = ?", [fe]);

                    let qsavesm = await db.query("SELECT Periodo, IFNULL(SUM(NroAvesIniciadas),0) as NroAvesIniciadas, IFNULL(SUM(NroAvesFinal),0) as NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + idLotesM.join(',') + ") and Periodo = ?", [fe]);
                    let qsavesh = await db.query("SELECT Periodo, IFNULL(SUM(NroAvesIniciadas),0) as NroAvesIniciadas, IFNULL(SUM(NroAvesFinal),0) as NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + idLotesH.join(',') + ") and Periodo = ?", [fe]);
                    if (f == 0) {
                        qsavesm[0].Periodo = Periodos.unique()[0];
                        qsavesh[0].Periodo = Periodos.unique()[0];
                    }
                    if (PeriodoIniProduccion == PeriodoFinLevante || fe != PeriodoIniProduccion) {
                        savesm.push(qsavesm[0]);
                        savesh.push(qsavesh[0]);
                    }
                    if (pe.length != 0) {
                        let FechaInicio = pe[0].FechaInicio;
                        let FechaFin = pe[0].FechaFin;
                        let al = await db.query("SELECT costoLH, costoLM FROM costeo_alimento WHERE Periodo = ? and Lote = ?", [fe, lote + "(LEV)"]);
                        let valorm = 0;
                        let valorh = 0;
                        if (al.length != 0) {
                            valorh = al[0].costoLH;
                            valorm = al[0].costoLM;
                        }
                        if (PeriodoIniProduccion == PeriodoFinLevante || fe != PeriodoIniProduccion) {
                            nums1.push((valorm).toFixed(2));
                            nums2.push((valorh).toFixed(2));
                            sumNumL1 = sumNumL1 + (valorm);
                            sumNumL2 = sumNumL2 + (valorh);
                        }
                        // estado = false;
                    } else {
                        if (PeriodoIniProduccion == PeriodoFinLevante || fe != PeriodoIniProduccion) {
                            nums1.push(0);
                            nums2.push(0);
                        }
                        sumNumL1 = sumNumL1 + 0;
                        sumNumL2 = sumNumL2 + 0;
                    }

                }
                if (f + 1 == Periodos.unique().length) {
                    nums1.push((sumNumL1).toFixed(2));
                    nums2.push((sumNumL2).toFixed(2));
                    savesm.push('');
                    savesh.push('');
                    savesm.push('');
                    savesh.push('');
                }
            }
            fila.push({
                class: '',
                numeros: nums2
            })
            fila.push({
                class: '',
                numeros: nums1
            })

            for (let i = 0; i < TG_CDESCRI_38.unique().length; i++) {
                const t = TG_CDESCRI_38.unique()[i];
                let numeros = [];
                numeros.push(t)
                let sumNumerosL = 0;
                for (let j = 0; j < Periodos.unique().length; j++) {
                    const p = Periodos.unique()[j];
                    let r = await db.query("SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO FROM costos WHERE TG_CDESCRI_38 = ? and Periodo = ? and TG_CDESCRI_10 = ?", [t, p, lote])
                    let valor = r[0].C6_NMNIMPO;
                    if (p <= PeriodoIniProduccion) {
                        if (p == PeriodoIniProduccion) {
                            if (PeriodoIniProduccion == PeriodoFinLevante || p != PeriodoIniProduccion) {
                                let p1 = (cant_diasNoSobrantes / cant_diasTotales) * 100;
                                // let p2 = (cant_diasSobrantes / cant_diasTotales)*100;
                                let n1 = Math.round(((p1 * valor) / 100) * 100) / 100;
                                // let n2 = Math.round(((p2*valor)/100)*100)/100;
                                numeros.push(n1);
                                sumNumerosL = sumNumerosL + n1;
                                // numeros.push(n2);
                            }
                            estado = true;
                        } else {
                            if (PeriodoIniProduccion == PeriodoFinLevante || p != PeriodoIniProduccion) {
                                numeros.push(valor);
                                sumNumerosL = sumNumerosL + valor;
                                estado = false;
                            }
                        }
                    }
                    if (i + 1 == TG_CDESCRI_38.unique().length) {
                        if (p <= PeriodoIniProduccion) {
                            if (p == PeriodoIniProduccion) {
                                let fl = await db.query("SELECT SUM(Num_Aves_Fin_Levante) as Num_Aves_Fin_Levante FROM lotes WHERE idLote IN (" + agrpLM.join(',') + ") GROUP BY idLevante");
                                let res = await db.query("SELECT Periodo, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + agrpLM.join(',') + ") and Periodo = ? GROUP BY Periodo", [p]);
                                if (PeriodoIniProduccion == PeriodoFinLevante || p != PeriodoIniProduccion) {
                                    if (fl.length != 0) {
                                        nroAves.push(fl[0].Num_Aves_Fin_Levante)
                                    } else {
                                        nroAves.push(0)
                                    }
                                    nombrePeriodos.push(YearMonth(p));
                                    colspanLevante = colspanLevante + 1;
                                }
                                if (res.length != 0) {
                                    nroAvesPROD.push(res[0].NroAvesFinal)
                                } else {
                                    nroAvesPROD.push(0)
                                }
                                nombrePeriodosPROD.push(YearMonth(p));
                                colspanProduccion = colspanProduccion + 1;
                            } else {
                                let res = await db.query("SELECT Periodo, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + agrpLM.join(',') + ") and Periodo = ? GROUP BY Periodo", [p]);
                                if (PeriodoIniProduccion == PeriodoFinLevante || p != PeriodoIniProduccion) {
                                    if (res.length != 0) {
                                        nroAves.push(res[0].NroAvesFinal)
                                    } else {
                                        nroAves.push(0)
                                    }
                                    nombrePeriodos.push(YearMonth(p));
                                }
                            }
                        }

                        if (estado == false) {
                            colspanLevante = colspanLevante + 1;
                        }
                    }

                    if (j + 1 == Periodos.unique().length) {
                        numeros.push(sumNumerosL.toFixed(2));
                    }
                }
                fila.push({
                    class: '',
                    numeros
                })
            }

            let cg = [];
            for (let y = 0; y < HojaC.length; y++) {
                const re = HojaC[y];
                cg.push(re.Hoja);
            }

            for (let l = 0; l < cg.unique().length; l++) {
                const le = cg.unique()[l];
                let descrip = ''
                let campo = "Total"
                if (le == '911') {
                    descrip = 'MANO OBRA DIRECTA'
                } else if (le == '913-915') {
                    descrip = 'GASTOS INDIRECTOS'
                } else if (le == '918') {
                    descrip = 'DEPRECIACION ACTIVOS FIJOS'
                    campo = 'Costo2'
                }
                let n3 = [];
                n3.push(descrip);
                let sumn3L = 0;
                for (let j = 0; j < Periodos.unique().length; j++) {
                    const p = Periodos.unique()[j];
                    let hc = await db.query(`SELECT IFNULL(${campo},0) as Total FROM tabla_costeo_granja WHERE Periodo = ? and Hoja = ? and Lote = ?`, [p, le, lote]);
                    let valor
                    if (hc.length != 0) {
                        valor = hc[0].Total;
                    } else {
                        valor = 0;
                    }
                    console.log('valor :>> ', valor);
                    if (p <= PeriodoIniProduccion) {
                        if (p == PeriodoIniProduccion) {
                            if (PeriodoIniProduccion == PeriodoFinLevante || p != PeriodoIniProduccion) {
                                let p1 = (cant_diasNoSobrantes / cant_diasTotales) * 100;
                                // let p2 = (cant_diasSobrantes / cant_diasTotales)*100;
                                let n1 = Math.round(((p1 * valor) / 100) * 100) / 100;
                                // let n2 = Math.round(((p2*valor)/100)*100)/100;
                                if (hc.length != 0) {
                                    n3.push(n1.toFixed(2));
                                    sumn3L = sumn3L + n1;
                                    // n3.push(n2.toFixed(2));
                                } else {
                                    n3.push(0);
                                    // n3.push(0);
                                }
                            }
                        } else {
                            if (PeriodoIniProduccion == PeriodoFinLevante || p != PeriodoIniProduccion) {
                                if (hc.length != 0) {
                                    n3.push((valor).toFixed(2));
                                    sumn3L = sumn3L + valor;
                                } else {
                                    n3.push(valor);
                                }
                            }
                        }
                    }

                    if (j + 1 == Periodos.unique().length) {
                        n3.push(sumn3L.toFixed(2))
                    }
                }
                fila.push({
                    class: '',
                    numeros: n3
                })
            }

            let arrayTotal = [];
            arrayTotal[0] = 'Costo Levante / Mes';
            for (let f = 0; f < fila.length; f++) {
                const fi = fila[f].numeros;
                for (let h = 0; h < fi.length; h++) {
                    const hi = fi[h];
                    if (h != 0) {
                        if (typeof arrayTotal[h] != "undefined") {
                            arrayTotal[h] = arrayTotal[h] + parseFloat(hi);
                        } else {
                            arrayTotal[h] = 0 + parseFloat(hi);
                        }
                        if (f + 1 == fila.length) {
                            arrayTotal[h] = arrayTotal[h].toFixed(2)
                        }
                    }
                }
            }
            fila.push({
                class: 'active',
                numeros: arrayTotal
            })

            let TotalGeneral = arrayTotal[arrayTotal.length - 1];

            for (let f = 0; f < fila.length; f++) {
                const fi = fila[f].numeros;
                let dec = 0;
                for (let h = 0; h < fi.length; h++) {
                    const hi = fi[h];
                    if (h + 1 == fi.length) {
                        dec = ((hi / TotalGeneral) * 100).toFixed(2);
                    }
                }
                fi.push(dec)
            }

            let arrayTotalAcum = [];
            arrayTotalAcum[0] = 'Costo Acumulado de Levante';
            for (let h = 0; h < arrayTotal.length; h++) {
                const hi = arrayTotal[h];
                if (h != 0) {
                    if (typeof arrayTotalAcum[h] != "undefined") {
                        arrayTotalAcum[h] = (arrayTotalAcum[h] + parseFloat(hi)) + arrayTotalAcum[h - 1];
                    } else {
                        if (h - 1 != 0) {
                            arrayTotalAcum[h] = (0 + parseFloat(hi)) + arrayTotalAcum[h - 1];
                        } else {
                            arrayTotalAcum[h] = 0 + parseFloat(hi);
                        }
                    }
                }
            }

            for (let j = 0; j < arrayTotalAcum.length; j++) {
                const er = arrayTotalAcum[j];
                if (j != 0) {
                    arrayTotalAcum[j] = arrayTotalAcum[j].toFixed(2);
                }
            }
            arrayTotalAcum[arrayTotalAcum.length - 1] = ''
            arrayTotalAcum[arrayTotalAcum.length - 2] = ''

            fila.push({
                class: 'active',
                numeros: arrayTotalAcum
            })

            nombrePeriodos.push("Total")
            nombrePeriodos.push("%")

            nroAves.push('')
            nroAves.push('')

            let r1 = [];
            r1[0] = 'AVES'
            for (let h = 0; h < (arrayTotal.length); h++) {
                if (h != 0) {
                    r1.push('')
                }
            }

            fila.push({
                class: '',
                numeros: r1
            })

            let exIni = [];
            let exFin = [];
            exIni[0] = 'Existencia Inicial';
            exFin[0] = 'Existencia Final';
            let exFinH = [];
            let exFinM = [];
            exFinH[0] = 'Linea Hembra (Unid)';
            exFinM[0] = 'Linea Macho (Unid)';
            for (let j = 0; j < savesm.length; j++) {
                const e = savesm[j];
                const e2 = savesh[j];
                exFinH.push(e2.NroAvesFinal);
                exFinM.push(e.NroAvesFinal);
                exIni.push(e.NroAvesIniciadas + e2.NroAvesIniciadas);
                exFin.push(e.NroAvesFinal + e2.NroAvesFinal);
            }

            fila.push({
                class: '',
                numeros: exIni
            })

            fila.push({
                class: '',
                numeros: exFin
            })

            fila.push({
                class: 'active',
                numeros: exFinH
            })

            fila.push({
                class: 'active',
                numeros: exFinM
            })

            let r2 = [];
            r2[0] = 'INICIO - LEVANTE'
            for (let h = 0; h < (arrayTotal.length); h++) {
                const hi = arrayTotal[h];
                if (h != 0) {
                    if (h < arrayTotal.length - 2) {
                        r2.push('')
                    } else if (h < arrayTotal.length - 1) {
                        r2.push('Cant. Aves')
                    } else {
                        r2.push('')
                    }
                }
            }

            fila.push({
                class: 'active',
                numeros: r2
            })

            let LHem = [];
            let LMac = [];
            LHem[0] = 'Línea Hembra'
            LMac[0] = 'Línea Macho';

            for (let i = 1; i < (nums2.length); i++) {
                if (i < nums2.length - 2) {
                    const e2 = parseFloat(nums2[i]);
                    const e1 = parseFloat(nums1[i]);
                    let valorh = 0;
                    let valorm = 0;
                    if (i == 1) {
                        valorh = 0;
                        valorm = 0;
                    } else if (i == 2) {
                        valorh = e2 + parseFloat(n1[2]);
                        valorm = e1 + parseFloat(n2[2]);
                    } else {
                        valorh = e2 + parseFloat(LHem[i - 1]);
                        valorm = e1 + parseFloat(LMac[i - 1]);
                    }
                    LHem.push(valorh.toFixed(2));
                    LMac.push(valorm.toFixed(2));
                } else {
                    LHem.push('');
                    LMac.push('');
                }
            }

            let GGeneral = [];
            GGeneral[0] = 'G. Generales';
            let Totales = [];
            Totales[0] = '';
            let LHCosto = [];
            LHCosto[0] = 'Línea Hembra / Ave (S.)';
            let LMCosto = [];
            LMCosto[0] = 'Línea Macho / Ave (S.)';
            let CostoTotalLH = ''
            let CostoTotalLM = ''
            let TipoLote = '';
            let num_vacios = [];
            let num_vacios2 = [];
            for (let k = 1; k < LHem.length; k++) {
                if (k < LHem.length - 2) {
                    const t = parseFloat(exFin[k]);
                    const h = parseFloat(exFinH[k]);
                    const m = parseFloat(exFinM[k]);
                    const LH = parseFloat(LHem[k]);
                    const LM = parseFloat(LMac[k]);
                    const acum = parseFloat(arrayTotalAcum[k]);
                    let valor = acum - LH - LM;
                    let valorsum = valor + LH + LM;
                    GGeneral.push(valor.toFixed(2));
                    Totales.push(valorsum.toFixed(2));
                    let lhS
                    let lmS
                    if (t != 0) {
                        lhS = (((h / t) * valor) + LH) / h;
                        lmS = (((m / t) * valor) + LM) / m;
                    } else {
                        lhS = 0;
                        lmS = 0;
                    }

                    LHCosto.push(lhS.toFixed(2))
                    LMCosto.push(lmS.toFixed(2))
                } else if (k < LHem.length - 1) {
                    let vari1 = LHCosto[LHCosto.length - 1];
                    let vari2 = LMCosto[LMCosto.length - 1];
                    let aves1 = 1;
                    let aves2 = 1;
                    if (Hoja.Periodo >= PeriodoIniProduccion) {
                        let res = await db.query(`SELECT lote_str, SUM(Num_Aves_Fin_Levante) as Num_Aves_Fin_Levante 
                        FROM lotes 
                        WHERE idLote IN (${agrpLM.join(',')}) 
                        GROUP BY lote_str
                        ORDER BY lote_str`);

                        aves1 = res[0].Num_Aves_Fin_Levante;
                        aves2 = res[1].Num_Aves_Fin_Levante;
                        if (Hoja.Periodo == PeriodoIniProduccion) {
                            TipoLote = 'LEV/PROD'
                        } else {
                            TipoLote = 'PROD'
                        }
                    } else {
                        let res = await db.query(`SELECT lo.lote_str, Periodo, SUM(NroAvesFinal) AS NroAvesFinal 
                        FROM stock_aves_mensual sam
                        INNER JOIN lotes lo ON lo.idLote = sam.idLote
                        WHERE lo.idLote IN (${agrpLM.join(',')}) and Periodo = ${Hoja.Periodo} 
                        GROUP BY lo.lote_str, Periodo
                        ORDER BY lo.lote_str`);

                        aves1 = res[0].NroAvesFinal;
                        aves2 = res[1].NroAvesFinal;
                        TipoLote = 'LEV'
                    }
                    CostoTotalLH = vari1 * aves1
                    CostoTotalLM = vari2 * aves2
                    LHCosto.push(aves1)
                    LMCosto.push(aves2)
                    GGeneral.push('')
                    Totales.push('')
                    let deleteDat = await db.query("DELETE FROM costo_aves_mensual WHERE idLevante = ? and TipoLote = ? and Periodo = ?", [Hoja.idLevante, TipoLote, Hoja.Periodo])
                    let insertDat = await db.query("INSERT INTO costo_aves_mensual (idLevante, Periodo, TipoLote, NombreLote, NroAvesHem, NroAvesMac, CostoAvesHem, CostoAvesMac, CostoUnitHem, CostoUnitMac) VALUES (?,?,?,?,?,?,?,?,?,?)", [Hoja.idLevante, Hoja.Periodo, TipoLote, lote, aves1, aves2, CostoTotalLH, CostoTotalLM, vari1, vari2])
                } else {
                    LHCosto.push((CostoTotalLH).toFixed(2))
                    LMCosto.push((CostoTotalLM).toFixed(2))
                    GGeneral.push('')
                    Totales.push('')
                }
                num_vacios.push('')
                num_vacios2.push('')
            }

            fila.push({
                class: 'active',
                numeros: LHCosto
            })

            fila.push({
                class: 'active',
                numeros: LMCosto
            })

            fila.push({
                class: 'active',
                numeros: LHem
            })

            fila.push({
                class: 'active',
                numeros: LMac
            })

            fila.push({
                class: 'active',
                numeros: GGeneral
            })

            fila.push({
                class: 'active',
                numeros: Totales
            })
            num_vacios.push('')
            num_vacios2.push('')
            fila.push({
                class: 'active',
                numeros: num_vacios
            })
            fila.push({
                class: 'active',
                numeros: num_vacios2
            })
            if (colspanProduccion != 0) {
                fila[0].numeros.push('ALIMENTO BALANCEADO MACHO')
                fila[1].numeros.push('ALIMENTO BALANCEADO HEMBRA')
                let sum0 = 0;
                let sum1 = 0;
                for (let i = 0; i < Periodos.unique().length; i++) {
                    const fe = Periodos.unique()[i];
                    if (fe <= PeriodoFinProduccion) {
                        if (fe >= PeriodoIniProduccion) {
                            let al = await db.query("SELECT costoLH, costoLM FROM costeo_alimento WHERE Periodo = ? and Lote = ?", [fe, lote + "(PROD)"]);
                            let valorm = 0;
                            let valorh = 0;
                            if (al.length != 0) {
                                valorh = al[0].costoLH;
                                valorm = al[0].costoLM;
                            }
                            fila[0].numeros.push((valorm).toFixed(2));
                            fila[1].numeros.push((valorh).toFixed(2));
                            sum0 = sum0 + valorm;
                            sum1 = sum1 + valorh;
                        }

                        if (fe == PeriodoFinProduccion || i == Periodos.unique().length - 1) {
                            fila[0].numeros.push((sum0).toFixed(2));
                            fila[1].numeros.push((sum1).toFixed(2));
                        }
                    }
                }

                for (let i = 0; i < TG_CDESCRI_38.unique().length; i++) {
                    const t = TG_CDESCRI_38.unique()[i];
                    fila[i + 2].numeros.push(t)
                    let sumNumerosL = 0;
                    for (let j = 0; j < Periodos.unique().length; j++) {
                        const p = Periodos.unique()[j];
                        let r = await db.query("SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO FROM costos WHERE TG_CDESCRI_38 = ? and Periodo = ? and TG_CDESCRI_10 = ?", [t, p, lote])
                        let valor = r[0].C6_NMNIMPO;
                        if (p <= PeriodoFinProduccion) {
                            if (p >= PeriodoIniProduccion) {
                                if (p == PeriodoIniProduccion) {
                                    let p1 = (cant_diasNoSobrantes / cant_diasTotales) * 100;
                                    // let p2 = (cant_diasSobrantes / cant_diasTotales)*100;
                                    let n1 = Math.round(((p1 * valor) / 100) * 100) / 100;
                                    // let n2 = Math.round(((p2*valor)/100)*100)/100;
                                    // numeros.push(n1);
                                    fila[i + 2].numeros.push(n1);
                                    sumNumerosL = sumNumerosL + n1;
                                } else {
                                    fila[i + 2].numeros.push(valor);
                                    sumNumerosL = sumNumerosL + valor;
                                }
                            }
                            if (i + 1 == TG_CDESCRI_38.unique().length) {
                                if (p > PeriodoIniProduccion) {
                                    let res = await db.query("SELECT Periodo, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual WHERE idLote IN (" + agrpLM.join(',') + ") and Periodo = ? GROUP BY Periodo", [p]);
                                    if (res.length != 0) {
                                        nroAvesPROD.push(res[0].NroAvesFinal)
                                    } else {
                                        nroAvesPROD.push(0)
                                    }
                                    nombrePeriodosPROD.push(YearMonth(p));
                                    colspanProduccion = colspanProduccion + 1;
                                }
                            }

                            if (j == Periodos.unique().length - 1 || p == PeriodoFinProduccion) {
                                fila[i + 2].numeros.push(sumNumerosL.toFixed(2));
                            }
                        }
                    }
                }
                let indicadorDepre = 0;
                for (let l = 0; l < cg.unique().length; l++) {
                    const le = cg.unique()[l];
                    let descrip = ''
                    let campo = 'Total'
                    if (le == '911') {
                        descrip = 'MANO OBRA DIRECTA'
                    } else if (le == '913-915') {
                        descrip = 'GASTOS INDIRECTOS'
                    } else if (le == '918') {
                        descrip = 'DEPRECIACION ACTIVOS FIJOS'
                        campo = "Costo2"
                    }
                    let rf = (TG_CDESCRI_38.unique().length + 2) + l;
                    fila[rf].numeros.push(descrip);
                    let sumn3L = 0;
                    for (let j = 0; j < Periodos.unique().length; j++) {
                        const p = Periodos.unique()[j];
                        if (p <= PeriodoFinProduccion) {
                            let hc = await db.query(`SELECT IFNULL(${campo},0) as Total FROM tabla_costeo_granja WHERE Periodo = ? and Hoja = ? and Lote = ?`, [p, le, lote]);
                            let valor
                            if (hc.length != 0) {
                                valor = hc[0].Total;
                            } else {
                                valor = 0;
                            }
                            if (p >= PeriodoIniProduccion) {
                                if (p == PeriodoIniProduccion) {
                                    // let p1 = (cant_diasNoSobrantes / cant_diasTotales)*100;
                                    let p2 = (cant_diasSobrantes / cant_diasTotales) * 100;
                                    // let n1 = Math.round(((p1*valor)/100)*100)/100;
                                    let n2 = Math.round(((p2 * valor) / 100) * 100) / 100;
                                    if (hc.length != 0) {
                                        fila[rf].numeros.push(n2.toFixed(2));
                                        sumn3L = sumn3L + n2;
                                        // n3.push(n2.toFixed(2));
                                    } else {
                                        fila[rf].numeros.push(0);
                                        // n3.push(0);
                                    }
                                } else {
                                    if (hc.length != 0) {
                                        fila[rf].numeros.push((valor).toFixed(2));
                                        sumn3L = sumn3L + valor;
                                    } else {
                                        fila[rf].numeros.push(valor);
                                    }
                                }
                            }

                            if (j == Periodos.unique().length - 1 || p == PeriodoFinProduccion) {
                                fila[rf].numeros.push(sumn3L.toFixed(2))
                            }
                        }
                    }
                    indicadorDepre = rf;
                }

                fila[indicadorDepre + 1].numeros.push('DEPRECIACION BIOLOGICA LHEMBRA')
                fila[indicadorDepre + 2].numeros.push('DEPRECIACION BIOLOGICA LMACHO')
                let sumLH = 0;
                let sumLM = 0;
                let indicadorSumatoriaProd = 0
                for (let i = 0; i < Periodos.unique().length; i++) {
                    const p = Periodos.unique()[i];
                    if (p <= PeriodoFinProduccion) {
                        if (p >= PeriodoIniProduccion) {
                            let res = await db.query("SELECT * FROM proyeccion_incubables WHERE Periodo = ? and idLevante = ?",
                                [p, Hoja.idLevante])

                            let ResultadoLH = 0
                            let ResultadoLM = 0
                            if (res.length != 0) {
                                ResultadoLH = Number((res[0].ResultadoLH).toFixed(2))
                                ResultadoLM = Number((res[0].ResultadoLM).toFixed(2))
                            }
                            sumLH = sumLH + ResultadoLH;
                            sumLM = sumLM + ResultadoLM;
                            fila[indicadorDepre + 1].numeros.push(ResultadoLH)
                            fila[indicadorDepre + 2].numeros.push(ResultadoLM)
                            if (p == PeriodoIniProduccion && PeriodoIniProduccion != PeriodoFinLevante) {
                                indicadorSumatoriaProd = indicadorSumatoriaProd - 1;
                            }
                        } else {
                            indicadorSumatoriaProd = indicadorSumatoriaProd + 1;
                        }
                    }
                }

                fila[indicadorDepre + 1].numeros.push(sumLH.toFixed(2))
                fila[indicadorDepre + 2].numeros.push(sumLM.toFixed(2))

                let arrayTotal_PROD = [];
                arrayTotal_PROD[0] = 'Costo Producción';
                for (let f = 0; f < fila.length; f++) {
                    const fi = fila[f].numeros;
                    let hr = 0;
                    for (let h = indicadorSumatoriaProd + 5; h < fi.length; h++) {
                        const hi = fi[h];
                        hr = hr + 1;
                        if (typeof arrayTotal_PROD[hr] != "undefined") {
                            arrayTotal_PROD[hr] = arrayTotal_PROD[hr] + parseFloat(hi);
                        } else {
                            arrayTotal_PROD[hr] = 0 + parseFloat(hi);
                        }
                    }
                }

                for (let i = 0; i < arrayTotal_PROD.length; i++) {
                    const e = arrayTotal_PROD[i];
                    if (i != 0) {
                        fila[indicadorDepre + 3].numeros.push(e.toFixed(2));
                    } else {
                        fila[indicadorDepre + 3].numeros.push(e);
                    }
                }

                let TotalGeneral_PROD = arrayTotal_PROD[arrayTotal_PROD.length - 1];

                let TotalHI_PROD = 0;
                for (let f = 0; f < (fila.length - 15); f++) {
                    const fi = fila[f].numeros;
                    let dec = 0;
                    for (let h = indicadorSumatoriaProd + 5; h < fi.length; h++) {
                        const hi = fi[h];
                        if (h + 1 == fi.length) {
                            dec = ((hi / TotalGeneral_PROD)).toFixed(3);
                        }
                    }
                    fi.push(dec)
                    if (f == fila.length - 16) {
                        TotalHI_PROD = dec;
                    }
                }

                for (let f = 0; f < (fila.length - 15); f++) {
                    const fi = fila[f].numeros;
                    let dec = 0;
                    for (let h = indicadorSumatoriaProd + 5; h < fi.length; h++) {
                        const hi = fi[h];
                        if (h + 1 == fi.length) {
                            dec = ((hi / TotalHI_PROD) * 100).toFixed(2);
                        }
                    }
                    fi.push(dec)
                }

                fila[indicadorDepre + 4].numeros.push('Huevo Incub.Producido')
                fila[indicadorDepre + 5].numeros.push('Linea Hembra')
                fila[indicadorDepre + 6].numeros.push('Linea Macho')
                fila[indicadorDepre + 7].numeros.push('Huevo Comercial')
                fila[indicadorDepre + 8].numeros.push('Costo Huevo Incubable S/.')
                fila[indicadorDepre + 9].numeros.push('Costo / H.Incub. Hembra (S/.)')
                fila[indicadorDepre + 10].numeros.push('Costo / H.Incub.Macho (S/.)')
                fila[indicadorDepre + 11].numeros.push('Costo / H.Comercial  (S/.)')
                fila[indicadorDepre + 12].numeros.push('TOTAL COSTO HEMBRA')
                fila[indicadorDepre + 13].numeros.push('TOTAL COSTO MACHO')
                fila[indicadorDepre + 14].numeros.push('TOTAL COSTO COMERCIAL')
                fila[indicadorDepre + 15].numeros.push('G. Hembra')
                fila[indicadorDepre + 16].numeros.push('G.Macho')
                fila[indicadorDepre + 17].numeros.push('G.Generales')
                fila[indicadorDepre + 18].numeros.push('C.Huevo Incubable')

                for (let i = 0; i < Periodos.unique().length; i++) {
                    const pe = Periodos.unique()[i];
                    if (pe <= PeriodoFinProduccion) {
                        if (pe >= PeriodoIniProduccion) {
                            let res = await db.query("SELECT ProduccionLH, ProduccionLM, CostoHC FROM proyeccion_incubables WHERE idLevante = ? and Periodo = ?",
                                [Hoja.idLevante, pe])
                            let Total = 0
                            let LH = 0
                            let LM = 0
                            let CostoHC = 0
                            if (res.length != 0) {
                                LH = res[0].ProduccionLH
                                LM = res[0].ProduccionLM
                                Total = LH + LM;
                                CostoHC = res[0].CostoHC
                            }
                            fila[indicadorDepre + 4].numeros.push(Total)
                            fila[indicadorDepre + 5].numeros.push(LH)
                            fila[indicadorDepre + 6].numeros.push(LM)
                            let res2 = await db.query("SELECT (SUM(saldoFinTipoNormal) + SUM(saldoFinTipoDY)) as ProduccionComercial FROM stock_mensual_hc WHERE idProduccion = ? and year = ? and month = ?", [idProduccion, pe.substr(0, 4), pe.substr(4, 2)])
                            let HC = 0
                            if (res2.length != 0) {
                                HC = res2[0].ProduccionComercial;
                            }
                            fila[indicadorDepre + 7].numeros.push(HC)
                            fila[indicadorDepre + 8].numeros.push('')
                            fila[indicadorDepre + 11].numeros.push(CostoHC)
                            fila[indicadorDepre + 14].numeros.push((HC * CostoHC).toFixed(2))
                            fila[indicadorDepre + 18].numeros.push((HC * CostoHC).toFixed(2))
                        }
                    }
                }

                for (let i = indicadorSumatoriaProd + 5; i < fila[0].numeros.length - 3; i++) {
                    let Periodo_DB = Periodos.unique()[i - 4];
                    let AlimentoMacho = fila[0].numeros[i];
                    let AlimentoHembra = fila[1].numeros[i];
                    let indicadorDepreHembra
                    let indicadorDepreMacho
                    for (let j = 0; j < fila.length; j++) {
                        const e = fila[j].numeros[indicadorSumatoriaProd + 4];
                        if (e == 'DEPRECIACION BIOLOGICA LHEMBRA') {
                            indicadorDepreHembra = j
                        }
                        if (e == 'DEPRECIACION BIOLOGICA LMACHO') {
                            indicadorDepreMacho = j
                        }
                    }
                    let DepreHembra = fila[indicadorDepreHembra].numeros[i];
                    let DepreMacho = fila[indicadorDepreMacho].numeros[i];
                    let GastoHembra = Number(AlimentoHembra) + Number(DepreHembra)
                    let GastoMacho = Number(AlimentoMacho) + Number(DepreMacho)
                    fila[indicadorDepre + 15].numeros.push(GastoHembra.toFixed(2))
                    fila[indicadorDepre + 16].numeros.push(GastoMacho.toFixed(2))
                    let GastoGeneralProd = fila[indicadorDepre + 3].numeros[i] - GastoHembra - GastoMacho - fila[indicadorDepre + 18].numeros[i];
                    fila[indicadorDepre + 17].numeros.push(GastoGeneralProd.toFixed(2))
                    let CostoHILH = (((fila[indicadorDepre + 5].numeros[i] / fila[indicadorDepre + 4].numeros[i]) * GastoGeneralProd) + GastoHembra) / fila[indicadorDepre + 5].numeros[i]
                    let CostoHILM = (((fila[indicadorDepre + 6].numeros[i] / fila[indicadorDepre + 4].numeros[i]) * GastoGeneralProd) + GastoMacho) / fila[indicadorDepre + 6].numeros[i]
                    if (CostoHILH === Number.POSITIVE_INFINITY || fila[indicadorDepre + 4].numeros[i] == 0 || fila[indicadorDepre + 5].numeros[i] == 0) {
                        CostoHILH = 0;
                    }

                    if (CostoHILM === Number.POSITIVE_INFINITY || fila[indicadorDepre + 4].numeros[i] == 0 || fila[indicadorDepre + 6].numeros[i] == 0) {
                        CostoHILM = 0;
                    }
                    fila[indicadorDepre + 9].numeros.push(CostoHILH.toFixed(2))
                    fila[indicadorDepre + 10].numeros.push(CostoHILM.toFixed(2))
                    let TotalCostoHembra = CostoHILH * fila[indicadorDepre + 5].numeros[i]
                    let TotalCostoMacho = CostoHILM * fila[indicadorDepre + 6].numeros[i]
                    fila[indicadorDepre + 12].numeros.push(TotalCostoHembra.toFixed(2))
                    fila[indicadorDepre + 13].numeros.push(TotalCostoMacho.toFixed(2))
                    await db.query(`UPDATE proyeccion_incubables SET
                    TotalCostoLH = ?, TotalCostoLM = ?
                    WHERE Periodo = ? and idLevante = ?`, [TotalCostoHembra, TotalCostoMacho, Periodo_DB, Hoja.idLevante])
                }

                nombrePeriodosPROD.push("Total")
                nombrePeriodosPROD.push("Costo HI (S/.)")
                nombrePeriodosPROD.push("%")

                nroAvesPROD.push('')
                nroAvesPROD.push('')
                nroAvesPROD.push('')
            }

            return {
                success: true,
                tablaLevante: {
                    periodos: nombrePeriodos,
                    poblacion: nroAves,
                    colspanLevante,
                    colspanProduccion,
                    fila
                },
                tablaProduccion: {
                    periodos: nombrePeriodosPROD,
                    poblacion: nroAvesPROD,
                    colspanLevante,
                    colspanProduccion,
                    fila: filaPROD
                }
            }
        }
    },
    getMyD: async function (Hoja) {
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
            // if (typeof params == "undefined") {
            //     var hoy = new Date();
            // } else {}
            var hoy = params.substring(0, 10);

            // var dd = hoy.getDate();
            // var mm = hoy.getMonth();
            // var yyyy = hoy.getFullYear();

            // if (dd < 10) {
            //     dd = '0' + dd;
            // }

            // if (mm < 10) {
            //     mm = '0' + mm;
            // }
            // hoy = yyyy + '-' + mm + '-' + dd;
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

        function DifDays(param1, periodo) {
            var fechaini = new Date(param1);
            let m = periodo.substr(4, 5);
            let y = periodo.substr(0, 4);

            let fechafin = new Date(y, m, 0);
            var diasdif = fechafin.getTime() - fechaini.getTime();
            var contdias = Math.round(diasdif / (1000 * 60 * 60 * 24));

            return contdias;
        }

        let idsLevHEM = await db.query(`SELECT GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str SEPARATOR '-') as lote_str,
        GROUP_CONCAT(DISTINCT lo.idLote ORDER BY lo.lote_str SEPARATOR ',') as idLote
        FROM stock_aves_mensual sam
        INNER JOIN lotes lo ON lo.idLote = sam.idLote
        WHERE Periodo BETWEEN '${Hoja.Periodo}' AND '${Hoja.PeriodoFin}' and TipoGenero = 'LH'
        GROUP BY lo.idLevante
        ORDER BY lo.idLevante`)

        let idsLevMAC = await db.query(`SELECT GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str SEPARATOR '-') as lote_str,
        GROUP_CONCAT(DISTINCT lo.idLote ORDER BY lo.lote_str SEPARATOR ',') as idLote
        FROM stock_aves_mensual sam
        INNER JOIN lotes lo ON lo.idLote = sam.idLote
        WHERE Periodo BETWEEN '${Hoja.Periodo}' AND '${Hoja.PeriodoFin}' and TipoGenero = 'LM'
        GROUP BY lo.idLevante
        ORDER BY lo.idLevante`)

        let periodos = await db.query(`SELECT Periodo FROM stock_aves_mensual sam
        WHERE Periodo BETWEEN '${Hoja.Periodo}' AND '${Hoja.PeriodoFin}'
        GROUP BY Periodo`)

        let filas = [];

        for (let i = 0; i < periodos.length; i++) {
            const e = periodos[i];
            let rowspan = 0;
            let length_filas = filas.length;
            for (let j = 0; j < idsLevHEM.length; j++) {
                const LH = idsLevHEM[j];
                const LM = idsLevMAC[j];
                let cons_lh = await db.query(`SELECT Periodo, SUM(NroAvesIniciadas) AS NroAvesIniciadas, 
                SUM(Mortalidad) AS Mortalidad, SUM(Descarte) AS Descarte, SUM(FinCampania) AS FinCampania, 
                SUM(Ingreso) AS Ingreso, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual 
                WHERE idLote IN (${LH.idLote}) and Periodo = ? GROUP BY Periodo`, [e.Periodo]);
                let NAI_lh = 0;
                if (cons_lh.length != 0) {
                    NAI_lh = cons_lh[0].NroAvesIniciadas
                }
                let cons_lm = await db.query(`SELECT Periodo, SUM(NroAvesIniciadas) AS NroAvesIniciadas, 
                SUM(Mortalidad) AS Mortalidad, SUM(Descarte) AS Descarte, SUM(FinCampania) AS FinCampania, 
                SUM(Ingreso) AS Ingreso, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual 
                WHERE idLote IN (${LM.idLote}) and Periodo = ? GROUP BY Periodo`, [e.Periodo]);
                let NAI_lm = 0;
                if (cons_lm.length != 0) {
                    NAI_lm = cons_lm[0].NroAvesIniciadas
                }
                if (NAI_lh + NAI_lm != 0) {
                    rowspan = rowspan + 1;
                }
            }
            let cl = 'active'
            for (let j = 0; j < idsLevHEM.length; j++) {
                const LH = idsLevHEM[j];
                const LM = idsLevMAC[j];
                let lote_str = LH.lote_str + "-" + LM.lote_str;
                let numeros = [];
                let cons_lh = await db.query(`SELECT Periodo, SUM(NroAvesIniciadas) AS NroAvesIniciadas, 
                SUM(Mortalidad) AS Mortalidad, SUM(Descarte) AS Descarte, SUM(FinCampania) AS FinCampania, 
                SUM(Ingreso) AS Ingreso, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual 
                WHERE idLote IN (${LH.idLote}) and Periodo = ? GROUP BY Periodo`, [e.Periodo]);
                let NAI_lh = 0;
                let Mort_lh = 0;
                let Des_lh = 0;
                let FC_lh = 0;
                let Ing_lh = 0;
                let NAF_lh = 0;
                if (cons_lh.length != 0) {
                    NAI_lh = cons_lh[0].NroAvesIniciadas
                    Mort_lh = cons_lh[0].Mortalidad
                    Des_lh = cons_lh[0].Descarte
                    FC_lh = cons_lh[0].FinCampania
                    Ing_lh = cons_lh[0].Ingreso
                    NAF_lh = cons_lh[0].NroAvesFinal
                }
                numeros.push(NAI_lh)
                numeros.push(Mort_lh)
                numeros.push(Des_lh)
                numeros.push(FC_lh)
                numeros.push(Ing_lh)
                numeros.push(NAF_lh)
                let cons_lm = await db.query(`SELECT Periodo, SUM(NroAvesIniciadas) AS NroAvesIniciadas, 
                SUM(Mortalidad) AS Mortalidad, SUM(Descarte) AS Descarte, SUM(FinCampania) AS FinCampania, 
                SUM(Ingreso) AS Ingreso, SUM(NroAvesFinal) AS NroAvesFinal FROM stock_aves_mensual 
                WHERE idLote IN (${LM.idLote}) and Periodo = ? GROUP BY Periodo`, [e.Periodo]);
                let NAI_lm = 0;
                let Mort_lm = 0;
                let Des_lm = 0;
                let FC_lm = 0;
                let Ing_lm = 0;
                let NAF_lm = 0;
                if (cons_lm.length != 0) {
                    NAI_lm = cons_lm[0].NroAvesIniciadas
                    Mort_lm = cons_lm[0].Mortalidad
                    Des_lm = cons_lm[0].Descarte
                    FC_lm = cons_lm[0].FinCampania
                    Ing_lm = cons_lm[0].Ingreso
                    NAF_lm = cons_lm[0].NroAvesFinal
                }
                numeros.push(NAI_lm)
                numeros.push(Mort_lm)
                numeros.push(Des_lm)
                numeros.push(FC_lm)
                numeros.push(Ing_lm)
                numeros.push(NAF_lm)
                //TOTALES
                numeros.push(NAI_lh + NAI_lm)
                numeros.push(Mort_lh)
                numeros.push(Mort_lm)
                numeros.push(Des_lh)
                numeros.push(Des_lm)
                numeros.push(FC_lh)
                numeros.push(FC_lm)
                numeros.push(Ing_lh)
                numeros.push(Ing_lm)
                numeros.push(NAF_lh + NAF_lm)
                if (NAI_lh + NAI_lm != 0) {
                    filas.push({
                        Periodo: e.Periodo,
                        rowspan: rowspan,
                        class: cl,
                        lote_str,
                        numeros
                    })
                    if (cl == 'active') {
                        cl = 'inactive'
                    }
                }
            }
        }
        if (filas.length == 0) {
            return {
                success: false,
                message: 'No existen registros con el rango de fechas especificado.'
            }
        }

        return {
            success: true,
            tabla: filas
        }
    }
}
module.exports = Costeo;