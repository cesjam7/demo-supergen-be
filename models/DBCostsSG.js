const { poolPromise } = require('../dbconnectionMSSQL')
var db = require('../dbconnection');
const moment = require('moment');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();

var DBCostsSG = {
    getFamilyAndMeasurementFindProduct: (articleId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const pool = await poolPromise
                const result = await pool.request().query(`select AR_CCODIGO,AR_CDESCRI,AR_CUNIDAD,ISNULL(RTRIM(ALTABL38.TG_CDESCRI), '') FAMILIA from RSFACCAR..AL0003ARTI
            LEFT OUTER JOIN RSFACCAR..AL0003TABL ALTABL38 ON ALTABL38.TG_CCOD='38' AND ALTABL38.TG_CCLAVE=AR_CFAMILI where AR_CCODIGO='${articleId}'`)
                resolve(result.recordset[0]);

            } catch (error) {
                reject(error)
            }

        })

    },
    nombreMes: function (param) {
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
    executeSP: async function (DBCostsSG) {
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
        let rows = await db.query("SELECT * FROM periodo WHERE YearMonth = ?", [DBCostsSG.periodo])
        let FechaInicio = formatDate(rows[0].FechaInicio)
        let FechaFin = formatDate(rows[0].FechaFin)
        let Periodo = DBCostsSG.periodo
        let ytwo = Periodo.substr(2, 2);
        let UserId = DBCostsSG.UserId
        let codigo
        let procedure
        if (DBCostsSG.opcion == "periodo") {
            if (DBCostsSG.hojas == 'Granja') {
                codigo = '0003'
                procedure = 'Cost_MovAlmValorizado'
            } else if (DBCostsSG.hojas == 'Cargas') {
                codigo = '0004'
                procedure = 'Cost_Cargas'
            } else if (DBCostsSG.hojas == 'Incubadora') {
                codigo = '0004'
                procedure = 'Cost_MovAlmValorizado'
            }
        }
        if (DBCostsSG.hojas == '911' || DBCostsSG.hojas == '918') {
            let ct_cuenta
            let columna
            if (DBCostsSG.hojas == '911') {
                ct_cuenta = '912'
                columna = '(CT_MNDEBE - CT_MNHABER)'
            } else {
                ct_cuenta = '918'
                columna = 'CT_MNDEBE'
            }
            const pool = await poolPromise
            let TDESCRI = `Select C.TDESCRI, A.CT_CENCOS From RSCONCAR..CT0003COST${ytwo} A 
            Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
            Where A.CT_FECPRO2 <= '${Periodo}'
            and ct_cuenta like '${ct_cuenta}%'
            GROUP BY C.TDESCRI, A.CT_CENCOS
            ORDER BY A.CT_CENCOS asc`;
            const resultQuery = await pool.request()
                .query(TDESCRI)
            let resultTDESCRI = await resultQuery.recordset;

            let PDESCRI = `Select PDESCRI, CT_CUENTA From RSCONCAR..CT0003COST${ytwo}
            A Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
            Where A.CT_FECPRO2<='${Periodo}'
            and ct_cuenta like '${ct_cuenta}%'
            Group by PDESCRI, CT_CUENTA
            Order by PDESCRI`;
            const resultQuery1 = await pool.request()
                .query(PDESCRI)
            let resultPDESCRI = await resultQuery1.recordset;

            let CT_FECPRO2 = `Select CT_FECPRO2 From RSCONCAR..CT0003COST${ytwo} A
            Where A.CT_FECPRO2<='${Periodo}'
            and ct_cuenta like '${ct_cuenta}%'
            Group by CT_FECPRO2
            Order by CT_FECPRO2`

            const resultQuery2 = await pool.request()
                .query(CT_FECPRO2)
            let resultCT_FECPRO2 = await resultQuery2.recordset;

            let tabla = [];
            let tabla2 = [];
            let totalG = [];
            let numerosGenerales = [];
            for (let i = 0; i < resultTDESCRI.length; i++) {
                const e = resultTDESCRI[i];
                let rows = [];
                let filasResumen = [];
                for (let j = 0; j < resultPDESCRI.length; j++) {
                    const r = resultPDESCRI[j];
                    let numeros = [];
                    let numerosG = [];
                    let fechas = [];
                    let sumCant = 0;
                    let sumCantG = 0;
                    for (let w = 0; w < resultCT_FECPRO2.length; w++) {
                        const s = resultCT_FECPRO2[w];
                        let query3 = `Select ${columna} as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                        Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                        Where A.CT_FECPRO2<='${Periodo}'
                        and ct_cuenta like '${ct_cuenta}%'
                        and CT_CENCOS = '${e.CT_CENCOS}'
                        and CT_CUENTA = '${r.CT_CUENTA}'
                        and CT_FECPRO2 = '${s.CT_FECPRO2}'`
                        const resultQuery3 = await pool.request()
                            .query(query3)
                        let result3 = resultQuery3.recordset;
                        let valor
                        if (typeof result3[0] == 'undefined') {
                            valor = 0;
                        } else {
                            valor = result3[0].CT_MNDEBE;
                        }
                        numeros.push(valor);
                        sumCant = sumCant + parseFloat(valor);
                        if (j + 1 == resultPDESCRI.length) {
                            let query4 = `Select SUM(${columna}) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                            Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                            Where ct_cuenta like '${ct_cuenta}%'
                            and CT_CENCOS = '${e.CT_CENCOS}'
                            and CT_FECPRO2 = '${s.CT_FECPRO2}'`
                            const resultQuery4 = await pool.request()
                                .query(query4)
                            let result4 = resultQuery4.recordset;
                            let valor4
                            if (typeof result4[0] == 'undefined' || result4[0].CT_MNDEBE == null) {
                                valor4 = 0;
                            } else {
                                valor4 = result4[0].CT_MNDEBE;
                            }
                            numerosG.push(valor4);
                            sumCantG = sumCantG + valor4;

                            if (typeof totalG["" + s.CT_FECPRO2 + ""] == "undefined") {
                                totalG["" + s.CT_FECPRO2 + ""] = 0 + valor4;
                            } else {
                                totalG["" + s.CT_FECPRO2 + ""] = totalG["" + s.CT_FECPRO2 + ""] + valor4
                            }

                            if (typeof totalG['Total'] == "undefined") {
                                totalG['Total'] = 0 + valor4;
                            } else {
                                totalG['Total'] = totalG['Total'] + valor4;
                            }

                            if (resultTDESCRI.length == i + 1 && resultPDESCRI.length == j + 1) {
                                numerosGenerales.push(Number(totalG["" + s.CT_FECPRO2 + ""].toFixed(2)));
                                if (resultCT_FECPRO2.length == w + 1) {
                                    numerosGenerales.push(Number(totalG['Total'].toFixed(2)));
                                }
                            }
                        }
                        let m = s.CT_FECPRO2.substr(4, 5);
                        fechas.push(this.nombreMes(m))
                    }
                    numeros.push((sumCant.toFixed(2)));
                    let classes = ''
                    if (numeros[resultCT_FECPRO2.length] == 0) {
                        classes = 'inactive'
                    }
                    if (j == 0) {
                        fechas.push('Acumulado')
                        rows.push({
                            codigo: 'Cuenta',
                            tipo: 'Descripción',
                            numeros: fechas,
                            class: 'active'
                        });

                        if (i == 0) {
                            filasResumen = {
                                codigo: 'Cuenta',
                                tipo: 'Descripción',
                                numeros: fechas,
                                class: 'active'
                            }
                            tabla2.push(filasResumen);
                        }
                    }
                    rows.push({
                        codigo: r.CT_CUENTA.trim(),
                        tipo: r.PDESCRI,
                        numeros: numeros,
                        class: classes
                    });

                    if (numerosG.length != 0) {
                        numerosG.push(Number(sumCantG.toFixed(2)));
                        rows.push({
                            codigo: '',
                            tipo: 'Sub Total',
                            numeros: numerosG,
                            class: 'active'
                        });
                        filasResumen = {
                            codigo: '',
                            tipo: e.TDESCRI,
                            numeros: numerosG,
                            class: ''
                        }
                    }
                }
                tabla2.push(filasResumen);
                tabla.push({
                    colspan: (3 + resultCT_FECPRO2.length),
                    tipo: e.TDESCRI,
                    rows: rows,
                    class: ''
                });
            }

            let totalesGene = [{
                codigo: '',
                tipo: 'Gran Total',
                numeros: numerosGenerales,
                class: 'active'
            }]
            tabla.push({
                colspan: (3 + resultCT_FECPRO2.length),
                tipo: 'Gran Total',
                rows: totalesGene,
                class: ''
            })

            tabla2.push(totalesGene[0])

            tabla.push({
                colspan: (3 + resultCT_FECPRO2.length),
                tipo: 'Tabla SubTotales',
                rows: tabla2,
                class: ''
            })

            return tabla;
        } else if (DBCostsSG.hojas == '913-915') {
            const pool = await poolPromise
            let TDESCRI = `Select C.TDESCRI, A.CT_CENCOS From RSCONCAR..CT0003COST${ytwo} A 
            Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
            Where A.CT_FECPRO2 <= '${Periodo}'
            and (ct_cuenta like '913%'
            or ct_cuenta like '914%'
            or ct_cuenta like '915%')
            GROUP BY C.TDESCRI, A.CT_CENCOS
            ORDER BY A.CT_CENCOS asc`;
            const resultQuery = await pool.request()
                .query(TDESCRI)
            let resultTDESCRI = await resultQuery.recordset;

            let PDESCRI = `Select PDESCRI, CT_CUENTA From RSCONCAR..CT0003COST${ytwo}
            A Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
            Where A.CT_FECPRO2<='${Periodo}'
            and (ct_cuenta like '913%'
            or ct_cuenta like '914%'
            or ct_cuenta like '915%')
            Group by PDESCRI, CT_CUENTA
            Order by PDESCRI`;
            const resultQuery1 = await pool.request()
                .query(PDESCRI)
            let resultPDESCRI = await resultQuery1.recordset;

            let CT_FECPRO2 = `Select CT_FECPRO2 From RSCONCAR..CT0003COST${ytwo}
            A Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
            Where A.CT_FECPRO2<='${Periodo}'
            and (ct_cuenta like '913%'
            or ct_cuenta like '914%'
            or ct_cuenta like '915%')
            Group by CT_FECPRO2
            Order by CT_FECPRO2`

            const resultQuery2 = await pool.request()
                .query(CT_FECPRO2)
            let resultCT_FECPRO2 = await resultQuery2.recordset;

            let tabla = [];
            let tabla2 = [];
            let totalG = [];
            let numerosGenerales = [];
            for (let i = 0; i < resultTDESCRI.length; i++) {
                const e = resultTDESCRI[i];
                let rows = [];
                let filasResumen = [];
                for (let j = 0; j < resultPDESCRI.length; j++) {
                    const r = resultPDESCRI[j];
                    let numeros = [];
                    let numerosG = [];
                    let fechas = [];
                    let sumCant = 0;
                    let sumCantG = 0;
                    for (let w = 0; w < resultCT_FECPRO2.length; w++) {
                        const s = resultCT_FECPRO2[w];
                        let query3 = `Select (CT_MNDEBE - CT_MNHABER) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                        Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                        Where A.CT_FECPRO2<='${Periodo}'
                        and (ct_cuenta like '913%'
                        or ct_cuenta like '914%'
                        or ct_cuenta like '915%')
                        and CT_CENCOS = '${e.CT_CENCOS}'
                        and CT_CUENTA = '${r.CT_CUENTA}'
                        and CT_FECPRO2 = '${s.CT_FECPRO2}'`
                        const resultQuery3 = await pool.request()
                            .query(query3)
                        let result3 = resultQuery3.recordset;
                        let valor
                        if (typeof result3[0] == 'undefined') {
                            valor = 0;
                        } else {
                            valor = result3[0].CT_MNDEBE;
                        }
                        numeros.push(Number(valor.toFixed(2)));
                        sumCant = sumCant + Number(valor.toFixed(2));
                        if (j + 1 == resultPDESCRI.length) {
                            let query4 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                            Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                            Where (ct_cuenta like '913%'
                            or ct_cuenta like '914%'
                            or ct_cuenta like '915%')
                            and CT_CENCOS = '${e.CT_CENCOS}'
                            and CT_FECPRO2 = '${s.CT_FECPRO2}'`
                            const resultQuery4 = await pool.request()
                                .query(query4)
                            let result4 = resultQuery4.recordset;
                            let valor4
                            if (typeof result4[0] == 'undefined' || result4[0].CT_MNDEBE == null) {
                                valor4 = 0;
                            } else {
                                valor4 = result4[0].CT_MNDEBE;
                            }
                            numerosG.push(valor4);
                            sumCantG = sumCantG + valor4;

                            if (typeof totalG["" + s.CT_FECPRO2 + ""] == "undefined") {
                                totalG["" + s.CT_FECPRO2 + ""] = 0 + valor4;
                            } else {
                                totalG["" + s.CT_FECPRO2 + ""] = totalG["" + s.CT_FECPRO2 + ""] + valor4
                            }

                            if (typeof totalG['Total'] == "undefined") {
                                totalG['Total'] = 0 + valor4;
                            } else {
                                totalG['Total'] = totalG['Total'] + valor4;
                            }

                            if (resultTDESCRI.length == i + 1 && resultPDESCRI.length == j + 1) {
                                numerosGenerales.push(Number(totalG["" + s.CT_FECPRO2 + ""].toFixed(2)));
                                if (resultCT_FECPRO2.length == w + 1) {
                                    numerosGenerales.push(Number(totalG['Total'].toFixed(2)));
                                }
                            }
                        }
                        let m = s.CT_FECPRO2.substr(4, 5);
                        fechas.push(this.nombreMes(m))
                    }
                    numeros.push(sumCant.toFixed(2));
                    let classes = ''
                    if (numeros[resultCT_FECPRO2.length] == 0) {
                        classes = 'inactive'
                    }
                    if (j == 0) {
                        fechas.push('Acumulado')
                        rows.push({
                            codigo: 'Cuenta',
                            tipo: 'Descripción',
                            numeros: fechas,
                            class: 'active'
                        });

                        if (i == 0) {
                            filasResumen = {
                                codigo: 'Cuenta',
                                tipo: 'Descripción',
                                numeros: fechas,
                                class: 'active'
                            }
                            tabla2.push(filasResumen);
                        }
                    }
                    rows.push({
                        codigo: r.CT_CUENTA.trim(),
                        tipo: r.PDESCRI,
                        numeros: numeros,
                        class: classes
                    });

                    if (numerosG.length != 0) {
                        numerosG.push(sumCantG.toFixed(2));
                        rows.push({
                            codigo: '',
                            tipo: 'Sub Total',
                            numeros: numerosG,
                            class: 'active'
                        });
                        filasResumen = {
                            codigo: '',
                            tipo: e.TDESCRI,
                            numeros: numerosG,
                            class: ''
                        }
                    }
                }
                tabla2.push(filasResumen);
                tabla.push({
                    colspan: (3 + resultCT_FECPRO2.length),
                    tipo: e.TDESCRI,
                    rows: rows,
                    class: ''
                });
            }

            let totalesGene = [{
                codigo: '',
                tipo: 'Gran Total',
                numeros: numerosGenerales,
                class: 'active'
            }]
            tabla.push({
                colspan: (3 + resultCT_FECPRO2.length),
                tipo: 'Gran Total',
                rows: totalesGene,
                class: ''
            })

            tabla2.push(totalesGene[0])

            tabla.push({
                colspan: (3 + resultCT_FECPRO2.length),
                tipo: 'Tabla SubTotales',
                rows: tabla2,
                class: ''
            })

            return tabla;
        } else {
            const pool = await poolPromise
            const result = await pool.request()
                // .input('input_parameter', sql.Int, req.query.input_parameter)
                // .query('select * from mytable where id = @input_parameter')
                .query("exec " + procedure + "'" + FechaInicio + "','" + FechaFin + "','" + codigo + "','" + Periodo + "'")
            let json = {
                result: result.recordset,
                length: result.recordset.length
            }
            return json;
        }
    },
    addCostos: async function (DBCostsSG, Rows) {
        function formatDate(params) {
            let f = params.split('-')
            let yyyy = f[0];
            let mm = f[1];
            return yyyy + "" + mm;
        }

        function formatDate2(params) {
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
        let Periodo = DBCostsSG.periodo
        let UserId = DBCostsSG.UserId
        if (DBCostsSG.hojas == '911' || DBCostsSG.hojas == '918' || DBCostsSG.hojas == '913-915') {
            let cons_hoja = await db.query(`SELECT * FROM costos_911_913_915_918
            WHERE Periodo = ? and Hoja = ?`, [Periodo, DBCostsSG.hojas]);
            if (cons_hoja.length != 0) {
                await db.query(`DELETE FROM costos_911_913_915_918 WHERE Periodo = ? and Hoja = ?`, [Periodo, DBCostsSG.hojas])
            }

            for (let i = 0; i < Rows.length; i++) {
                const t = Rows[i];
                let TDESCRI = t.tipo;
                for (let j = 0; j < t.rows.length; j++) {
                    const r = t.rows[j];
                    let PDESCRI = r.tipo;
                    let arreglo = [Periodo, DBCostsSG.hojas, TDESCRI, PDESCRI,
                        JSON.stringify(r.numeros), r.class, UserId];
                    if (r.numeros[r.numeros.length - 1] != 0) {
                        await db.query(`INSERT INTO costos_911_913_915_918 (
                        Periodo, Hoja, TDESCRI, PDESCRI, numeros, clase, idUser) 
                        VALUES(?,?,?,?,?,?,?)`, arreglo)
                    }
                }
            }

            return {
                result: Rows
            };
        } else {
            for (let i = 0; i < Rows.result.length; i++) {
                const e = Rows.result[i];
                let f = e.C6_DFECDOC.toISOString().substring(0, 10);
                await db.query("INSERT INTO costos(C6_CFAMILI, TG_CDESCRI_38, C6_CALMA, C6_CNUMDOC, C6_CCODMOV, C6_DFECDOC, C6_CRFTDOC, C6_CRFNDOC, C6_CCODIGO, AR_CDESCRI, AR_CUNIDAD, C6_NCANTID, C6_NMNPRUN, C6_NMNIMPO, C6_CCTACMO, TG_CDESCRI_10, Hoja, Periodo, idUsuario) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    [e.C6_CFAMILI.trim(), e.TG_CDESCRI_38.trim(), e.C6_CALMA.trim(), e.C6_CNUMDOC.trim(), e.C6_CCODMOV.trim(),
                        f, e.C6_CRFTDOC.trim(), e.C6_CRFNDOC.trim(), e.C6_CCODIGO.trim(), e.AR_CDESCRI.trim(),
                    e.AR_CUNIDAD.trim(), e.C6_NCANTID, e.C6_NMNPRUN, e.C6_NMNIMPO, e.C6_CCTACMO.trim(),
                    e.TG_CDESCRI_10.trim(), DBCostsSG.hojas, formatDate(f), UserId
                    ])
                let d = f.split("-");
                e.C6_DFECDOC = d[2] + "/" + d[1] + "/" + d[0];
            }
            return Rows;
        }
    },
    getData: async function (Hoja) {
        try {
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

            function obtainDay(param) {
                if (typeof param == "undefined") {
                    var hoy = new Date();
                } else {
                    var hoy = new Date(param);
                }
                var dd = hoy.getDate();

                if (dd < 10) {
                    dd = '0' + dd;
                }
                return dd;
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

            function DifDays_P(param, periodo, param2) {
                var fechaini = new Date(param);
                let m = periodo.substr(4, 5);
                let y = periodo.substr(0, 4);
                let fechafin = new Date(y, m, 0);
                if (param2 != null) {
                    var fechafinProd = new Date(param2)
                    if (fechafinProd <= fechafin) {
                        fechafin = fechafinProd
                    }
                }
                var diasdif = fechafin.getTime() - fechaini.getTime();
                var contdias = Math.round(diasdif / (1000 * 60 * 60 * 24));

                let dia_ult = fechafin.getDate();

                if (contdias == 0 || (dia_ult - contdias) < 0) {
                    return dia_ult
                } else {
                    return (contdias + 1)
                }
            }
            Array.prototype.unique = function (a) {
                return function () { return this.filter(a) }
            }(function (a, b, c) {
                return c.indexOf(a, b + 1) < 0
            });
            let codigo
            let ytwo = Hoja.Periodo.substr(2, 2);
            if (Hoja.Opcion != 'costos' && Hoja.Opcion != 'depreciacion') {
                if (Hoja.hoja == 'Granja') {
                    codigo = '0003'
                    let rows = await db.query("SELECT * FROM costos WHERE C6_CALMA = ? and Periodo = ? and Hoja = ?",
                        [codigo, Hoja.Periodo, Hoja.hoja]);
                    for (let i = 0; i < rows.length; i++) {
                        const e = rows[i];
                        e.C6_DFECDOC = formatDate(e.C6_DFECDOC)
                    }
                    let json = {
                        rows
                    }
                    return json;
                } else if (Hoja.hoja == 'Alimentos') {
                    codigo = '0003'
                    let lotes = await db.query("SELECT TG_CDESCRI_10 FROM costos WHERE C6_CALMA = ? and Periodo = ? and C6_CFAMILI = ? GROUP BY TG_CDESCRI_10 ORDER BY TG_CDESCRI_10", [codigo, Hoja.Periodo, '01'])
                    let AR_CDESCRI = await db.query("SELECT AR_CDESCRI FROM costos WHERE C6_CALMA = ? and Periodo = ? and C6_CFAMILI = ? GROUP BY AR_CDESCRI ORDER BY  AR_CDESCRI", [codigo, Hoja.Periodo, '01'])
                    // rows = await db.query("SELECT SUM(C6_NCANTID) as C6_NCANTID, SUM(C6_NMNIMPO) as C6_NMNIMPO,TG_CDESCRI_10, AR_CDESCRI  FROM costos WHERE C6_CALMA = ? and Periodo = ? and C6_CFAMILI = ? GROUP BY TG_CDESCRI_10, AR_CDESCRI ORDER BY AR_CDESCRI,TG_CDESCRI_10",[codigo, Hoja.Periodo, '01']);
                    let rows = [];
                    for (let i = 0; i < AR_CDESCRI.length; i++) {
                        const el = AR_CDESCRI[i].AR_CDESCRI;
                        let numeros = [];
                        let sumCant = 0;
                        let sumCant2 = 0;
                        for (let j = 0; j < lotes.length; j++) {
                            const el2 = lotes[j].TG_CDESCRI_10;
                            let l = await db.query("SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO, IFNULL(SUM(C6_NCANTID),0) as C6_NCANTID FROM costos WHERE AR_CDESCRI = ? and TG_CDESCRI_10 = ? and Periodo = ? and C6_CFAMILI = ?", [el, el2, Hoja.Periodo, '01'])
                            let C6_NMNIMPO = l[0].C6_NMNIMPO;
                            let C6_NCANTID = l[0].C6_NCANTID;
                            numeros.push(C6_NCANTID);
                            numeros.push(C6_NMNIMPO);
                            sumCant = sumCant + C6_NMNIMPO;
                            sumCant2 = sumCant2 + C6_NCANTID
                        }
                        numeros.push(sumCant2);
                        numeros.push(sumCant);
                        rows.push({
                            tipo: el,
                            numeros: numeros,
                            class: ''
                        });
                    }

                    let totales = [];
                    let sumTotal = 0;
                    let sumTotal2 = 0;
                    for (let w = 0; w < lotes.length; w++) {
                        const el2 = lotes[w].TG_CDESCRI_10;
                        let general = await db.query("SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO, IFNULL(SUM(C6_NCANTID),0) as C6_NCANTID FROM costos WHERE TG_CDESCRI_10 = ? and Periodo = ? and C6_CFAMILI = ?", [el2, Hoja.Periodo, '01'])
                        let totalG = general[0].C6_NMNIMPO;
                        let totalG2 = general[0].C6_NCANTID;
                        sumTotal = sumTotal + totalG;
                        sumTotal2 = sumTotal2 + totalG2;
                        totales.push(totalG2)
                        totales.push(totalG);
                        if (w + 1 == lotes.length) {
                            totales.push(sumTotal2)
                            totales.push(sumTotal);
                        }
                    }

                    let totalesGenerales = [{
                        tipo: 'Total General',
                        numeros: totales,
                        class: 'active'
                    }]

                    let tablaCONCAR = {
                        rows,
                        lotes,
                        AR_CDESCRI,
                        totalesGenerales
                    }

                    let peri = await db.query("SELECT * FROM periodo WHERE YearMonth = ? ", [Hoja.Periodo]);
                    let FechaInicio = peri[0].FechaInicio
                    let FechaFin = peri[0].FechaFin

                    let lotes_str = await db.query(`SELECT * FROM (
                    SELECT CONCAT(GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str ASC SEPARATOR '-' ), '(PROD)') AS lote_str,
                    1 sortby, lo.idLevante
                    FROM alimento_prod_det apd 
                    INNER JOIN lotes lo ON lo.idLote = apd.idLote 
                    WHERE apd.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                    GROUP BY lo.idLevante 
                    UNION ALL 
                    SELECT CONCAT(GROUP_CONCAT(DISTINCT lo.lote_str ORDER BY lo.lote_str ASC SEPARATOR '-' ), '(LEV)') AS lote_str,
                    2 sortby, lo.idLevante
                    FROM alimento_levante_det ald 
                    INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                    WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                    GROUP BY lo.idLevante
                    ) w 
                    GROUP BY w.lote_str, w.sortby, w.idLevante
                    ORDER BY w.sortby, w.lote_str`)

                    let lotes_ind = await db.query(`SELECT lote_str, idLote FROM (
                    SELECT lote_str, CorrelativoLote, GROUP_CONCAT(DISTINCT lo.idLote SEPARATOR '-') AS idLote
                    FROM alimento_prod_det apd 
                    INNER JOIN lotes lo ON lo.idLote = apd.idLote 
                    WHERE apd.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                    GROUP BY lo.lote_str UNION ALL 
                    SELECT lote_str, CorrelativoLote, GROUP_CONCAT(DISTINCT lo.idLote SEPARATOR '-') AS idLote
                    FROM alimento_levante_det ald 
                    INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                    WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                    GROUP BY lo.lote_str ) w 
                    GROUP BY w.lote_str
                    ORDER BY w.CorrelativoLote`)

                    let alimentos = await db.query(`SELECT idAlimento, AR_CDESCRI FROM (
                    SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI FROM alimento_levante_det ald
                    INNER JOIN tipo_alimento ta ON ta.idAlimento = ald.idAlimento
                    WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                    UNION ALL
                    SELECT ta.idAlimento, ta.nombreAlimento as AR_CDESCRI FROM alimento_prod_det apd
                    INNER JOIN tipo_alimento ta ON ta.idAlimento = apd.idAlimento
                    WHERE apd.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}') w
                    GROUP BY idAlimento, AR_CDESCRI
                    ORDER BY AR_CDESCRI`)

                    let rows2 = [];
                    for (let i = 0; i < alimentos.length; i++) {
                        const e = alimentos[i];
                        let numeros = [];
                        let suma = 0;
                        for (let k = 0; k < lotes_ind.length; k++) {
                            const lh = lotes_ind[k].lote_str;
                            let consulta_ali = await db.query(`SELECT COALESCE(SUM(w.CantAlimento),0) as CantAlimento
                            FROM( SELECT COALESCE(SUM(CantAlimento),0) as CantAlimento
                            FROM alimento_prod_det ald INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                            WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                            and lo.lote_str = '${lh}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY lo.lote_str
                            UNION ALL
                            SELECT COALESCE(SUM(CantAlimento + CantAlimentoDescarte),0) as CantAlimento
                            FROM alimento_levante_det ald INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                            WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                            and lo.lote_str = '${lh}'
                            and ald.idAlimento = ${e.idAlimento}
                            GROUP BY lo.lote_str) w`)
                            let CA = 0;
                            if (consulta_ali.length != 0) {
                                CA = consulta_ali[0].CantAlimento
                            }
                            suma += CA
                            numeros.push(CA)
                        }
                        numeros.push(suma)
                        rows2.push({
                            tipo: e.AR_CDESCRI,
                            numeros,
                            class: ''
                        })
                    }

                    let rowsCOSTEO = [];
                    let repite = false;
                    for (let h = 0; h < lotes_str.length; h++) {
                        const r = lotes_str[h];
                        let r2 = '';
                        let r3 = '';
                        let e = r.lote_str.substr(0, 9);
                        if (h < lotes_str.length - 1) {
                            r2 = lotes_str[h + 1];
                            if (e == r2.lote_str.substr(0, 9)) {
                                repite = true;
                            } else {
                                if (h != 0) {
                                    r3 = lotes_str[h - 1];
                                    if (e == r3.lote_str.substr(0, 9)) {
                                        repite = true;
                                    } else {
                                        repite = false;
                                    }
                                } else {
                                    repite = false;
                                }
                            }
                        }
                        let lh = e.substr(0, 4);
                        let lm = e.substr(5, 4);
                        let lop = r.lote_str.substr(10, 1);
                        rowsCOSTEO.push({
                            tipo: r.lote_str,
                            colspan: 8,
                            class: 'active'
                        });
                        let sumC6_NCANTID = 0;
                        let sumC6_NMNIMPO = 0;
                        let sumcostolh = 0;
                        let sumcostolm = 0;
                        let sumvalorlh = 0;
                        let sumvalorlm = 0;
                        let rowsCOSTEO_D = [];
                        for (let i = 0; i < alimentos.length; i++) {
                            const a = alimentos[i];
                            let numerosCOSTEO = [];
                            let consultalh
                            let consultalm
                            let valorlh = 0;
                            let valorlm = 0;
                            let vvunit = 1;
                            let costolh = 0;
                            let costolm = 0;
                            let C6_NMNIMPO = 0;
                            let C6_NCANTID = 0;
                            let l
                            if (lop == 'P') {
                                consultalh = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                                FROM alimento_prod_det ald 
                                INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                                WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                                and lo.lote_str = '${lh}'
                                and ald.idAlimento = ${a.idAlimento}
                                GROUP BY lo.lote_str`)
                                consultalm = await db.query(`SELECT IFNULL(SUM(CantAlimento),0) as CantAlimento
                                FROM alimento_prod_det ald 
                                INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                                WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                                and lo.lote_str = '${lm}'
                                and ald.idAlimento = ${a.idAlimento}
                                GROUP BY lo.lote_str`)
                                l = await db.query("SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO, IFNULL(SUM(C6_NCANTID),0) as C6_NCANTID FROM costos WHERE AR_CDESCRI = ? and TG_CDESCRI_10 = ? and Periodo = ? and C6_CFAMILI = ?", [a.AR_CDESCRI, e, Hoja.Periodo, '01'])
                                C6_NMNIMPO = l[0].C6_NMNIMPO;
                                C6_NCANTID = l[0].C6_NCANTID;
                            } else {
                                consultalh = await db.query(`SELECT IFNULL(SUM(CantAlimento + CantAlimentoDescarte),0) as CantAlimento
                                FROM alimento_levante_det ald 
                                INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                                WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                                and lo.lote_str = '${lh}'
                                and ald.idAlimento = ${a.idAlimento}
                                GROUP BY lo.lote_str`)
                                consultalm = await db.query(`SELECT IFNULL(SUM(CantAlimento + CantAlimentoDescarte),0) as CantAlimento
                                FROM alimento_levante_det ald 
                                INNER JOIN lotes lo ON lo.idLote = ald.idLote 
                                WHERE ald.Fecha BETWEEN '${formatDateGuion(FechaInicio)}' and '${formatDateGuion(FechaFin)}'
                                and lo.lote_str = '${lm}'
                                and ald.idAlimento = ${a.idAlimento}
                                GROUP BY lo.lote_str`)
                                l = await db.query("SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO, IFNULL(SUM(C6_NCANTID),0) as C6_NCANTID FROM costos WHERE AR_CDESCRI = ? and TG_CDESCRI_10 = ? and Periodo = ? and C6_CFAMILI = ?", [a.AR_CDESCRI, e, Hoja.Periodo, '01'])
                                C6_NMNIMPO = l[0].C6_NMNIMPO;
                                C6_NCANTID = l[0].C6_NCANTID;
                            }
                            if (consultalh.length != 0) {
                                valorlh = consultalh[0].CantAlimento;
                            }
                            if (consultalm.length != 0) {
                                valorlm = consultalm[0].CantAlimento;
                            }
                            if (C6_NCANTID != 0) {
                                vvunit = C6_NMNIMPO / C6_NCANTID;
                            }
                            costolh = (vvunit * valorlh);
                            costolm = (vvunit * valorlm);
                            if (C6_NCANTID != 0) {
                                numerosCOSTEO.push(C6_NCANTID);
                                numerosCOSTEO.push(vvunit);
                                numerosCOSTEO.push(C6_NMNIMPO);
                                numerosCOSTEO.push(valorlh);
                                numerosCOSTEO.push(costolh);
                                numerosCOSTEO.push(valorlm);
                                numerosCOSTEO.push(costolm);
                                rowsCOSTEO_D.push({
                                    tipo: a.AR_CDESCRI,
                                    colspan: 1,
                                    class: '',
                                    numeros: numerosCOSTEO
                                });
                                sumC6_NCANTID = sumC6_NCANTID + C6_NCANTID;
                                sumC6_NMNIMPO = sumC6_NMNIMPO + C6_NMNIMPO;
                                sumvalorlh = sumvalorlh + valorlh;
                                sumvalorlm = sumvalorlm + valorlm;
                                sumcostolh = sumcostolh + costolh;
                                sumcostolm = sumcostolm + costolm;
                            }
                        }
                        let numerosFLETE = [];
                        let l = await db.query(`SELECT coalesce(SUM(C6_NMNIMPO),0) as C6_NMNIMPO, 
                    coalesce(SUM(C6_NCANTID),0) as C6_NCANTID FROM costos 
                    WHERE AR_CDESCRI = ? and TG_CDESCRI_10 = ? and Periodo = ? and C6_CFAMILI = ?`,
                            ['FLETE DE ALIMENTO', e, Hoja.Periodo, '01'])
                        let C6_NMNIMPO_FA = l[0].C6_NMNIMPO;
                        let C6_NCANTID_FA = l[0].C6_NCANTID;
                        if (repite == true) {
                            if (C6_NMNIMPO_FA == 0 && C6_NCANTID_FA == 0) {
                                C6_NMNIMPO_FA = 0;
                            } else {
                                C6_NMNIMPO_FA = (C6_NMNIMPO_FA / C6_NCANTID_FA) * sumC6_NCANTID;
                            }
                            C6_NCANTID_FA = sumC6_NCANTID;
                        }
                        let vvunit_FA = C6_NMNIMPO_FA / C6_NCANTID_FA;
                        if (C6_NCANTID_FA == '0') {
                            vvunit_FA = 0;
                        }
                        let costolh_FA = (vvunit_FA * sumvalorlh);
                        let costolm_FA = (vvunit_FA * sumvalorlm);
                        numerosFLETE.push(C6_NCANTID_FA);
                        numerosFLETE.push(vvunit_FA);
                        numerosFLETE.push(C6_NMNIMPO_FA);
                        numerosFLETE.push(sumvalorlh);
                        numerosFLETE.push(costolh_FA);
                        numerosFLETE.push(sumvalorlm);
                        numerosFLETE.push(costolm_FA);
                        rowsCOSTEO.push({
                            tipo: 'FLETE DE ALIMENTO',
                            colspan: 1,
                            class: '',
                            numeros: numerosFLETE
                        });
                        for (let k = 0; k < rowsCOSTEO_D.length; k++) {
                            const e = rowsCOSTEO_D[k];
                            rowsCOSTEO.push(e);
                        }
                        sumC6_NCANTID = sumC6_NCANTID + C6_NCANTID_FA;
                        sumC6_NMNIMPO = sumC6_NMNIMPO + C6_NMNIMPO_FA;
                        sumcostolh = sumcostolh + costolh_FA;
                        sumcostolm = sumcostolm + costolm_FA;
                        let arrayNum = [
                            sumC6_NCANTID,
                            '',
                            sumC6_NMNIMPO,
                            '',
                            sumcostolh,
                            '',
                            sumcostolm
                        ];
                        rowsCOSTEO.push({
                            tipo: '',
                            colspan: 1,
                            class: 'active',
                            numeros: arrayNum
                        });
                        await db.query("DELETE FROM costeo_alimento WHERE Periodo = ? and Lote = ?",
                            [Hoja.Periodo, r.lote_str])
                        await db.query("INSERT INTO costeo_alimento (Periodo, Lote, costoLH, costoLM) VALUES (?,?,?,?)",
                            [Hoja.Periodo, r.lote_str, sumcostolh.toFixed(2), sumcostolm.toFixed(2)])
                    }

                    let tablaCARTILLA = {
                        AR_CDESCRI: alimentos,
                        lotes: lotes_ind,
                        rows: rows2
                    }

                    let tablaCOSTEO = {
                        lotes: lotes_str,
                        rows: rowsCOSTEO
                    }

                    return {
                        tablaCONCAR,
                        tablaCARTILLA,
                        tablaCOSTEO
                    }
                } else if (Hoja.hoja == 'RGRANJA') {
                    let tables = []
                    codigo = '0003'
                    let lotes = await db.query(`SELECT TG_CDESCRI_10 
                FROM costos WHERE C6_CALMA = ? and Periodo = ? and Hoja = 'Granja'
                GROUP BY TG_CDESCRI_10 ORDER BY TG_CDESCRI_10`,
                        [codigo, Hoja.Periodo])
                    let TG_CDESCRI_38 = await db.query(`SELECT TG_CDESCRI_38 
                FROM costos WHERE C6_CALMA = ? and Periodo = ? and Hoja = 'Granja' 
                GROUP BY TG_CDESCRI_38 ORDER BY TG_CDESCRI_38`,
                        [codigo, Hoja.Periodo])

                    let rows1 = []
                    let rows = []
                    let lotes_g = []
                    for (let i = 0; i < TG_CDESCRI_38.length; i++) {
                        const el = TG_CDESCRI_38[i].TG_CDESCRI_38;
                        let numeros = [];
                        let sumCant = 0;
                        let numeros1 = [];
                        let sumAves = 0;
                        for (let j = 0; j < lotes.length; j++) {
                            const el2 = lotes[j].TG_CDESCRI_10;
                            let l = await db.query(`SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO 
                        FROM costos WHERE TG_CDESCRI_38 = ? and TG_CDESCRI_10 = ? and Periodo = ?
                        and Hoja = 'Granja'`,
                                [el, el2, Hoja.Periodo])
                            let C6_NMNIMPO = l[0].C6_NMNIMPO;
                            numeros.push(C6_NMNIMPO);
                            sumCant = sumCant + C6_NMNIMPO;
                            if (i == 0) {
                                if (j == 0) {
                                    numeros1.push(0)
                                } else {
                                    let cons_aves = await db.query(`SELECT w.Lote, w.Periodo, w.NroAvesIniciadas FROM (
                                    SELECT GROUP_CONCAT(DISTINCT lote_str ORDER BY CorrelativoLote SEPARATOR '-') as Lote,
                                    Periodo, SUM(NroAvesIniciadas) as NroAvesIniciadas FROM supergen.stock_aves_mensual sam 
                                    INNER JOIN supergen.lotes lo ON lo.idLote = sam.idLote GROUP BY Periodo, idLevante) w 
                                    WHERE w.Lote = ? and w.Periodo = ?`, [el2, Hoja.Periodo])
                                    let cantAves = 0
                                    if (cons_aves.length != 0) {
                                        cantAves = cons_aves[0].NroAvesIniciadas
                                    }
                                    sumAves += cantAves
                                    numeros1.push(cantAves)
                                    lotes_g.push(lotes[j])
                                }
                            }
                        }
                        numeros1.push(sumAves)
                        if (i == 0) {
                            rows1.push({
                                tipo: "N° Aves",
                                numeros: numeros1,
                                class: ''
                            })
                            let numerosT = []
                            for (let wk = 0; wk < numeros1.length; wk++) {
                                const n1 = numeros1[wk];
                                let porc = n1 / numeros1[numeros1.length - 1] * 100;
                                numerosT.push(Number(porc.toFixed(2)))
                            }
                            rows1.push({
                                tipo: "(%)",
                                numeros: numerosT,
                                class: 'active'
                            })
                        }
                        numeros.push(sumCant);
                        rows.push({
                            tipo: el,
                            numeros: numeros,
                            class: ''
                        });
                    }

                    let totales = [];
                    let sumTotal = 0;
                    for (let w = 0; w < lotes.length; w++) {
                        const el2 = lotes[w].TG_CDESCRI_10;
                        let general = await db.query(`SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO 
                    FROM costos WHERE TG_CDESCRI_10 = ? and Periodo = ?  and Hoja = 'Granja'`,
                            [el2, Hoja.Periodo])
                        let totalG = general[0].C6_NMNIMPO;
                        sumTotal = sumTotal + totalG;
                        totales.push(totalG);
                        if (w + 1 == lotes.length) {
                            totales.push(sumTotal);
                        }
                    }
                    rows.push({
                        tipo: 'Total General',
                        numeros: totales,
                        class: 'active'
                    })

                    tables.push({
                        rows: rows1,
                        lotes,
                        tipo: "Número de Aves",
                        colspan: (lotes.length + 2)
                    })

                    tables.push({
                        rows,
                        lotes,
                        tipo: "Datos de Granja",
                        colspan: (lotes.length + 2)
                    })

                    let rows2 = [];
                    for (let i = 0; i < rows.length; i++) {
                        const r = rows[i];
                        let num = []
                        let sumNum = 0
                        let clase = ''
                        for (let j = 1; j < r.numeros.length - 1; j++) {
                            const n = r.numeros[j];
                            const n1 = rows1[1].numeros[j]
                            let t = ((r.numeros[0] * n1) / 100) + n
                            sumNum += t;
                            num.push(Number(t.toFixed(2)))
                        }
                        num.push(Number(sumNum.toFixed(2)))
                        if (i == rows.length - 1) {
                            clase = 'active'
                        }
                        rows2.push({
                            tipo: r.tipo,
                            numeros: num,
                            class: clase
                        })
                    }
                    tables.push({
                        rows: rows2,
                        lotes: lotes_g,
                        tipo: "Distribución de Granja",
                        colspan: (lotes_g.length + 2)
                    })
                    let json = {
                        tables,
                        TG_CDESCRI_38
                    }
                    return json;
                } else if (Hoja.hoja == '911' || Hoja.hoja == '918' || Hoja.hoja == '913-915') {
                    let Periodo = Hoja.Periodo;
                    let TDESCRI = await db.query(`SELECT TDESCRI FROM costos_911_913_915_918 
                WHERE Periodo = ? and Hoja = ? GROUP BY TDESCRI`, [Periodo, Hoja.hoja])
                    let tabla = [];
                    let tabla2 = [];
                    let totalG = [];
                    let numerosGenerales = [];
                    for (let i = 0; i < TDESCRI.length; i++) {
                        const e = TDESCRI[i].TDESCRI;
                        let rows = [];
                        let filasResumen = [];
                        let f = await db.query(`SELECT * FROM costos_911_913_915_918 
                    WHERE Periodo = ? and Hoja = ? and TDESCRI = ?`,
                            [Periodo, Hoja.hoja, e])
                        if (f.length != 0) {
                            for (let j = 0; j < f.length; j++) {
                                const r = f[j];
                                rows.push({
                                    codigo: '',
                                    tipo: r.PDESCRI,
                                    numeros: JSON.parse(r.numeros),
                                    class: r.clase
                                });
                            }
                        }
                        tabla2.push(filasResumen);
                        tabla.push({
                            colspan: '',
                            tipo: e,
                            rows: rows,
                            class: ''
                        });
                    }
                    return {
                        rows: tabla
                    };
                } else if (Hoja.hoja == 'Costos-Granja') {
                    let Periodo = Hoja.Periodo;

                    let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [Hoja.Periodo]);
                    let cerrado = false;
                    if (info_periodo.length != 0) {
                        if (info_periodo[0].Estado == 0) {
                            cerrado = true;
                        }
                    }

                    const pool = await poolPromise
                    let m = Periodo.substr(4, 5);
                    let a = Periodo.substr(0, 4);
                    let Periodo_ant;
                    if (m == 1) {
                        Periodo_ant = (a - 1) + "12";
                    } else {
                        let m_ant = (m - 1);
                        if (m_ant < 10) {
                            m_ant = "0" + m_ant;
                        }
                        Periodo_ant = a + "" + m_ant;
                    }
                    let Periodo_Des;
                    if (m == 12) {
                        Periodo_Des = (a + 1) + "01";
                    } else {
                        let m_des = (parseInt(m) + 1);
                        if (m_des < 10) {
                            m_des = "0" + m_des;
                        }
                        Periodo_Des = a + "" + m_des;
                    }
                    let tabla = [];
                    let rows = [];
                    rows[0] = [];
                    rows[1] = [];
                    rows[2] = [];

                    let sum1 = 0;
                    let avesTotales = 0;

                    let sumcosto1 = 0;
                    let sumcosto2 = 0;
                    let total = 0;

                    let sumcosto1_913_915 = 0;
                    let sumcosto2_913_915 = 0;
                    let total_913_915 = 0;

                    let sumcosto1_918 = 0;
                    let sumcosto2_918 = 0;
                    let total_918 = 0;

                    let query1 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                Where ct_cuenta like '912%'
                and CT_CENCOS = '00003'
                and CT_FECPRO2 = '${Periodo}'`
                    const resultQuery1 = await pool.request()
                        .query(query1)
                    let result_Query1 = await resultQuery1.recordset[0].CT_MNDEBE;

                    let mod1 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE
                Where ct_cuenta like '912%'
                and CT_CENCOS = '00002'
                and CT_FECPRO2 = '${Periodo}'`
                    const resultmod1 = await pool.request()
                        .query(mod1)
                    let result_mod1 = await resultmod1.recordset[0].CT_MNDEBE;

                    let query2 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                Where (ct_cuenta like '913%'
                or ct_cuenta like '914%'
                or ct_cuenta like '915%')
                and CT_CENCOS = '00003'
                and CT_FECPRO2 = '${Periodo}'`
                    const resultQuery2 = await pool.request()
                        .query(query2)
                    let result_Query2 = await resultQuery2.recordset[0].CT_MNDEBE;

                    let mod2 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE
                Where (ct_cuenta like '913%'
                or ct_cuenta like '914%'
                or ct_cuenta like '915%')
                and CT_CENCOS = '00002'
                and CT_FECPRO2 = '${Periodo}'`
                    const resultmod2 = await pool.request()
                        .query(mod2)
                    let result_mod2 = await resultmod2.recordset[0].CT_MNDEBE;

                    let query3 = `Select coalesce(SUM(CT_MNDEBE),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                Where ct_cuenta like '918%'
                and CT_CENCOS = '00003'
                and CT_FECPRO2 = '${Periodo}'`
                    const resultQuery3 = await pool.request()
                        .query(query3)
                    let result_Query3 = await resultQuery3.recordset[0].CT_MNDEBE;
                    if (result_Query3 == null) {
                        result_Query3 = '-';
                    }
                    let mod3 = `Select coalesce(SUM(CT_MNDEBE),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE
                Where ct_cuenta like '918%'
                and CT_CENCOS = '00002'
                and CT_FECPRO2 = '${Periodo}'`
                    const resultmod3 = await pool.request()
                        .query(mod3)
                    let result_mod3 = await resultmod3.recordset[0].CT_MNDEBE;

                    let exist911 = await db.query(`SELECT * FROM tabla_costeo_granja
                WHERE Periodo = ?`, [Periodo])
                    if (cerrado == true && exist911.length != 0) {
                        for (let i = 0; i < exist911.length; i++) {
                            const e = exist911[i];
                            if (e.Hoja == '911') {
                                avesTotales = avesTotales + e.NroAves;
                                sum1 = sum1 + e.Fa1
                                sumcosto1 = sumcosto1 + e.Costo1;
                                sumcosto2 = sumcosto2 + e.Costo2;
                                total = total + e.Total
                                rows[0].push({
                                    cuenta: '912',
                                    name: e.Lote,
                                    nroAves: e.NroAves,
                                    fecha: e.Dias,
                                    fa1: e.Fa1,
                                    numeros: [
                                        e.FactorAsignacion,
                                        e.Costo1.toFixed(2),
                                        e.Costo2.toFixed(2),
                                        e.Total.toFixed(2)
                                    ]
                                })
                            } else if (e.Hoja == '913-915') {
                                sumcosto1_913_915 = sumcosto1_913_915 + e.Costo1;
                                sumcosto2_913_915 = sumcosto2_913_915 + e.Costo2;
                                total_913_915 = total_913_915 + e.Total
                                rows[1].push({
                                    cuenta: '913-915',
                                    name: e.Lote,
                                    nroAves: e.NroAves,
                                    fecha: e.Dias,
                                    fa1: e.Fa1,
                                    numeros: [
                                        e.FactorAsignacion,
                                        e.Costo1.toFixed(2),
                                        e.Costo2,
                                        e.Total.toFixed(2)
                                    ]
                                })
                            } else if (e.Hoja == '918') {
                                sumcosto1_918 = sumcosto1_918 + e.Costo2;
                                sumcosto2_918 = sumcosto2_918 + e.Costo1;
                                total_918 = total_918 + e.Total
                                let valor = ''
                                if (e.Costo1 == 0) {
                                    valor = '-'
                                } else {
                                    valor = e.Costo1
                                }
                                rows[2].push({
                                    cuenta: '913-915',
                                    name: e.Lote,
                                    nroAves: e.NroAves,
                                    fecha: e.Dias,
                                    fa1: e.Fa1,
                                    numeros: [
                                        '-',
                                        e.Costo2,
                                        valor,
                                        e.Total.toFixed(2)
                                    ]
                                })
                            }
                        }
                    } else {
                        await db.query("DELETE FROM tabla_costeo_granja WHERE Periodo = ?", [Periodo]);

                        let sam = await db.query(`SELECT lo.idLevante, SUM(NroAvesIniciadas) as NroAvesFinal, 
                    pr.idProduccion, pr.FechaFinProduccion, GROUP_CONCAT(DISTINCT(lote_str) order by lote_str) as lote_str,
                    lo.FecEncaseta FROM stock_aves_mensual sam INNER JOIN lotes lo on lo.idLote = sam.idLote 
                    LEFT JOIN produccion pr ON pr.idLevante = lo.idLevante
                    WHERE Periodo = ? GROUP BY lo.idLevante,lo.FecEncaseta`, [Periodo]);

                        let sam_2 = await db.query(`SELECT lo.idLevante, SUM(NroAvesIniciadas) as NroAvesFinal, 
                    pr.idProduccion, pr.FechaFinProduccion, GROUP_CONCAT(DISTINCT(lote_str) order by lote_str) as lote_str,
                    lo.FecEncaseta FROM stock_aves_mensual sam INNER JOIN lotes lo on lo.idLote = sam.idLote 
                    LEFT JOIN produccion pr ON pr.idLevante = lo.idLevante
                    WHERE Periodo = ? GROUP BY lo.idLevante,lo.FecEncaseta`, [Periodo_Des]);

                        for (let i = 0; i < sam.length; i++) {
                            const s = sam[i];
                            for (let j = 0; j < sam_2.length; j++) {
                                const s2 = sam_2[j];
                                if (s.idLevante == s2.idLevante) {
                                    sam_2.splice(j, 1);
                                }
                            }
                        }
                        for (let i = 0; i < sam_2.length; i++) {
                            const s = sam_2[i];
                            s.NroAvesFinal = 0
                            sam.push(s)
                        }
                        let agrup = [];
                        for (let s = 0; s < sam.length; s++) {
                            const e = sam[s];
                            agrup.push(e.idLevante);
                        }
                        let sam2
                        if (agrup.length != 0) {
                            sam2 = await db.query("SELECT idLevante, SUM(NroAvesFinal) as NroAvesFinal, GROUP_CONCAT(DISTINCT(lote_str) order by lote_str) as lote_str, lo.FecEncaseta FROM stock_aves_mensual sam INNER JOIN lotes lo on lo.idLote = sam.idLote WHERE Periodo = ? and idLevante NOT IN (" + agrup.join(',') + ") GROUP BY lo.idLevante,lo.FecEncaseta", [Periodo])
                        } else {
                            sam2 = await db.query("SELECT idLevante, SUM(NroAvesFinal) as NroAvesFinal, GROUP_CONCAT(DISTINCT(lote_str) order by lote_str) as lote_str, lo.FecEncaseta FROM stock_aves_mensual sam INNER JOIN lotes lo on lo.idLote = sam.idLote WHERE Periodo = ? GROUP BY lo.idLevante,lo.FecEncaseta", [Periodo])
                        }
                        if (sam2.length != 0) {
                            for (let l = 0; l < sam2.length; l++) {
                                const ele = sam2[l];
                                sam.push(ele)
                            }
                        }
                        for (let i = 0; i < sam.unique().length; i++) {
                            const element = sam[i];
                            sum1 = sum1 + element.NroAvesFinal * DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion)
                            avesTotales = avesTotales + element.NroAvesFinal;
                            rows[0].push({
                                cuenta: '912',
                                name: formatGroup(element.lote_str),
                                nroAves: element.NroAvesFinal,
                                fecha: DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion),
                                fa1: element.NroAvesFinal * DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion),
                                numeros: []
                            })
                            rows[1].push({
                                cuenta: '913-914-915',
                                name: formatGroup(element.lote_str),
                                nroAves: element.NroAvesFinal,
                                fecha: DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion),
                                fa1: element.NroAvesFinal * DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion),
                                numeros: []
                            })
                            rows[2].push({
                                cuenta: '918',
                                name: formatGroup(element.lote_str),
                                nroAves: element.NroAvesFinal,
                                fecha: DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion),
                                fa1: element.NroAvesFinal * DifDays_P(element.FecEncaseta, Periodo, element.FechaFinProduccion),
                                numeros: []
                            })
                        }
                        //911
                        for (let w = 0; w < rows[0].length; w++) {
                            const element = rows[0][w];
                            let numeros = [];
                            let FactorAsignacion = result_Query1 / sum1;
                            let costo1 = element.nroAves * element.fecha * FactorAsignacion;
                            sumcosto1 = sumcosto1 + costo1;
                            let query = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                        Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                        Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE
                        Where ct_cuenta like '912%'
                        and C.TDESCRI = '${element.name}'
                        and CT_FECPRO2 = '${Periodo}'`
                            const result = await pool.request()
                                .query(query)
                            let res = await result.recordset[0].CT_MNDEBE;
                            numeros.push((FactorAsignacion).toFixed(5))
                            numeros.push((costo1).toFixed(2))
                            numeros.push(res)
                            numeros.push((costo1 + res).toFixed(2))
                            sumcosto2 = sumcosto2 + res;
                            total = total + (costo1 + res)
                            element.numeros = numeros;
                            await db.query(`INSERT INTO tabla_costeo_granja (Lote, NroAves, Dias, Fa1, 
                        FactorAsignacion, Costo1, Costo2, Total, Periodo, Hoja) VALUES(?,?,?,?,?,?,?,?,?,?)`,
                                [element.name, element.nroAves, element.fecha, element.fa1, FactorAsignacion,
                                    costo1, res, (costo1 + res), Periodo, '911'])
                        }
                        //913-915
                        for (let w = 0; w < rows[1].length; w++) {
                            const element = rows[1][w];
                            let numeros = [];
                            let FactorAsignacion = result_Query2 / sum1;
                            let costo1 = element.nroAves * element.fecha * FactorAsignacion;
                            sumcosto1_913_915 = sumcosto1_913_915 + costo1;
                            let query = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                        Left Join RSCONCAR..CT0003PLEP B On A.CT_CUENTA=B.PCUENTA
                        Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE
                        Where (ct_cuenta like '913%'
                        or ct_cuenta like '914%'
                        or ct_cuenta like '915%')
                        and C.TDESCRI = '${element.name}'
                        and CT_FECPRO2 = '${Periodo}'`
                            const result = await pool.request()
                                .query(query)
                            let res = await result.recordset[0].CT_MNDEBE;
                            numeros.push((FactorAsignacion).toFixed(5))
                            numeros.push((costo1).toFixed(2))
                            numeros.push(res)
                            numeros.push((costo1 + res).toFixed(2))
                            sumcosto2_913_915 = sumcosto2_913_915 + res;
                            total_913_915 = total_913_915 + (costo1 + res)
                            element.numeros = numeros;
                            await db.query(`INSERT INTO tabla_costeo_granja (Lote, NroAves, Dias, Fa1, 
                        FactorAsignacion, Costo1, Costo2, Total, Periodo, Hoja) VALUES(?,?,?,?,?,?,?,?,?,?)`,
                                [element.name, element.nroAves, element.fecha, element.fa1, FactorAsignacion,
                                    costo1, res, (costo1 + res), Periodo, '913-915'])
                        }
                        //918
                        for (let w = 0; w < rows[2].length; w++) {
                            const element = rows[2][w];
                            let numeros = [];
                            let FactorAsignacion = "-";
                            let query = `Select coalesce(SUM(CT_MNDEBE),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                        Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                        Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
                        Where ct_cuenta like '918%'
                        and ct_cuenta != '918171'
                        and C.TDESCRI = '${element.name}'
                        and CT_FECPRO2 = '${Periodo}'`
                            const result = await pool.request()
                                .query(query)
                            let res = await result.recordset[0].CT_MNDEBE;
                            let query12 = `Select coalesce(SUM(CT_MNDEBE),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                        Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                        Left Join RSCONCAR..CT0003TAGP  C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
                        Where ct_cuenta like '918171'
                        and C.TDESCRI = '${element.name}'
                        and CT_FECPRO2 = '${Periodo}'`
                            const result12 = await pool.request()
                                .query(query12)
                            let costo1 = await result12.recordset[0].CT_MNDEBE;
                            if (costo1 == null) {
                                costo1 = 0;
                            }
                            sumcosto1_918 = sumcosto1_918 + res;
                            numeros.push(FactorAsignacion)
                            numeros.push(res)
                            if (costo1 == 0) {
                                numeros.push('-')
                            } else {
                                numeros.push(costo1)
                            }
                            numeros.push((costo1 + res).toFixed(2))
                            sumcosto2_918 = sumcosto2_918 + costo1;
                            total_918 = total_918 + (costo1 + res)
                            element.numeros = numeros;
                            await db.query("INSERT INTO tabla_costeo_granja (Lote, NroAves, Dias, Fa1, FactorAsignacion, Costo1, Costo2, Total, Periodo, Hoja) VALUES(?,?,?,?,?,?,?,?,?,?)", [element.name, element.nroAves, element.fecha, element.fa1, 0, costo1, res, (costo1 + res), Periodo, '918'])
                        }
                    }
                    //TABLA DE MANO DE OBRAS
                    let sumMod = result_mod1 + total;
                    tabla.push({
                        tipo: 'REGISTRO DE MANO DE OBRA LOTES | ' + nombreMes(m).toUpperCase() + " - " + a,
                        Fecha: obtainDate(Periodo),
                        FactorAsignacion: result_Query1,
                        title1: 'Costo de MO',
                        title2: 'Costo de MO',
                        avesTotales,
                        rows: rows[0],
                        sum1,
                        sumcosto: sumcosto1.toFixed(2),
                        sumcosto2: sumcosto2.toFixed(2),
                        total: total.toFixed(2),
                        mod: result_mod1,
                        sumMod: sumMod.toFixed(2)
                    })

                    //TABLA DE GASTOS INDIRECTOS
                    let sumMod1 = result_mod2 + total_913_915;
                    tabla.push({
                        tipo: 'GASTOS INDIRECTOS DE FABRICACION POR LOTES | ' + nombreMes(m).toUpperCase() + " - " + a,
                        Fecha: obtainDate(Periodo),
                        FactorAsignacion: result_Query2,
                        title1: 'Costo de GIF',
                        title2: 'Costo de GIF',
                        avesTotales,
                        rows: rows[1],
                        sum1,
                        sumcosto: sumcosto1_913_915.toFixed(2),
                        sumcosto2: sumcosto2_913_915.toFixed(2),
                        total: total_913_915.toFixed(2),
                        mod: result_mod2,
                        sumMod: sumMod1.toFixed(2)
                    })

                    //TABLA DE DEPRECIACION
                    let sumMod2 = result_mod3 + total_918;
                    tabla.push({
                        tipo: 'GASTOS DEPRECIACION POR LOTES | ' + nombreMes(m).toUpperCase() + " - " + a,
                        Fecha: obtainDate(Periodo),
                        FactorAsignacion: result_Query3,
                        title1: 'Depreciacion Activos Fijos',
                        title2: 'Depreciacion Act. Biologico',
                        avesTotales,
                        rows: rows[2],
                        sum1,
                        sumcosto: sumcosto1_918.toFixed(2),
                        sumcosto2: sumcosto2_918.toFixed(2),
                        total: total_918.toFixed(2),
                        mod: result_mod3,
                        sumMod: sumMod2.toFixed(2)
                    })
                    return tabla;
                } else if (Hoja.hoja == 'Cargas') {
                    codigo = '0004'
                    let rows = await db.query("SELECT * FROM costos WHERE C6_CALMA = ? and Periodo = ? and Hoja = ?", [codigo, Hoja.Periodo, Hoja.hoja]);
                    for (let i = 0; i < rows.length; i++) {
                        const e = rows[i];
                        e.C6_DFECDOC = formatDate(e.C6_DFECDOC)
                    }
                    let json = {
                        rows
                    }
                    return json;
                } else if (Hoja.hoja == 'Cargas-Det') {
                    const pool = await poolPromise
                    let y = Hoja.Periodo.substr(0, 4);
                    let m = Hoja.Periodo.substr(4, 2);

                    let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [Hoja.Periodo]);
                    let cerrado = false;
                    if (info_periodo.length != 0) {
                        if (info_periodo[0].Estado == 0) {
                            cerrado = true;
                        }
                    }

                    let Periodo_ant;
                    if (m == 1) {
                        Periodo_ant = (y - 1) + "12";
                    } else {
                        let m_ant = (m - 1);
                        if (m_ant < 10) {
                            m_ant = "0" + m_ant;
                        }
                        Periodo_ant = y + "" + m_ant;
                    }

                    let lotes = await db.query(`SELECT lo.idLote, lo.lote_str
                FROM cargas_resumen cr
                INNER JOIN lotes lo ON lo.idLote = cr.Lote
                WHERE cr.Fecha_Carga LIKE '${y + "-" + m}%'
                GROUP BY lo.idLote
                ORDER BY lo.CorrelativoLote`)

                    let filas = [];

                    let consul = await db.query(`SELECT * FROM costos_cargas_mermas 
                WHERE Periodo = ?`, [Hoja.Periodo])
                    if (cerrado == true && consul.length != 0) {
                        for (let i = 0; i < consul.length; i++) {
                            const c = consul[i];
                            c.numeros = JSON.parse(c.numeros)
                            filas.push(c)
                        }
                    } else {
                        let rows = await db.query(`SELECT nd.Fecha_Carga, c.Fecha_Nacimiento
                    FROM cargas_resumen nd
                    INNER JOIN cargas c ON c.idCargas = nd.idCargas
                    WHERE nd.Fecha_Carga LIKE '${y + "-" + m}%'
                    GROUP BY nd.Fecha_Carga, c.Fecha_Nacimiento
                    ORDER BY nd.Fecha_Carga`)

                        await db.query(`DELETE FROM costos_cargas_det
                    WHERE Periodo = ?`, [Hoja.Periodo])

                        await db.query(`DELETE FROM costos_cargas_mermas
                    WHERE Periodo = ?`, [Hoja.Periodo])

                        for (let i = 0; i < rows.length; i++) {
                            const e = rows[i];
                            let numeros = [];
                            let sumCargas = 0;
                            let sumMermas = 0;
                            for (let j = 0; j < lotes.length; j++) {
                                const l = lotes[j];
                                let f = await db.query(`SELECT * FROM cargas_resumen cr
                            WHERE cr.Fecha_Carga = ? and cr.Lote = ?`, [new Date(e.Fecha_Carga), l.idLote])
                                let Cargas = 0;
                                let Mermas = 0;
                                if (f.length != 0) {
                                    const { total, hc } = f.reduce((prev, curr) => {
                                        prev.total += curr.Total
                                        prev.hc += curr.HC
                                        return prev;
                                    }, { total: 0, hc: 0 });
                                    Cargas = total;
                                    Mermas = hc;
                                }
                                sumCargas = sumCargas + Cargas;
                                sumMermas = sumMermas + Mermas;
                                numeros.push(Cargas)
                                numeros.push(Mermas)
                                if (j == lotes.length - 1) {
                                    numeros.push(sumCargas)
                                    numeros.push(sumMermas)
                                }
                            }
                            filas.push({
                                fechaCarga: formatDate(e.Fecha_Carga),
                                fechaNacimiento: formatDate(e.Fecha_Nacimiento),
                                numeros
                            })
                            await db.query(`INSERT INTO costos_cargas_mermas (Periodo, 
                        fechaCarga, fechaNacimiento, numeros) VALUES (?,?,?,?)`, [Hoja.Periodo,
                            formatDate(e.Fecha_Carga), formatDate(e.Fecha_Nacimiento), JSON.stringify(numeros)])
                        }
                    }

                    let totales = [];

                    for (let i = 0; i < filas.length; i++) {
                        const e = filas[i].numeros;
                        for (let j = 0; j < e.length; j++) {
                            const n = e[j];
                            if (i == 0) {
                                totales.push(n);
                            } else {
                                totales[j] = totales[j] + n;
                            }
                        }
                    }

                    let filas2 = [{
                        titulo: 'SALDO INICIAL',
                        numeros: []
                    },
                    {
                        titulo: 'PRODUCCION',
                        numeros: []
                    },
                    {
                        titulo: 'TRANSFERENCIA',
                        numeros: []
                    },
                    {
                        titulo: 'CARGAS',
                        numeros: []
                    },
                    {
                        titulo: 'MERMAS',
                        numeros: []
                    },
                    {
                        titulo: 'VENTAS TERCEROS',
                        numeros: []
                    }];

                    let j = 0;
                    let totales2 = [];
                    let ccdr = await db.query(`SELECT * FROM costos_cargas_det_resumen 
                WHERE Periodo = ?`, [Hoja.Periodo])
                    if (cerrado == true && ccdr.length != 0) {
                        for (let i = 0; i < ccdr.length; i++) {
                            const c = ccdr[i];
                            c.numeros = JSON.parse(c.numeros)
                            filas2[i].numeros = c.numeros
                        }
                        for (let w = 0; w < filas2[0].numeros.length; w++) {
                            let totalLote = filas2[0].numeros[w] + filas2[1].numeros[w] + filas2[2].numeros[w]
                                + filas2[3].numeros[w] + filas2[4].numeros[w] + filas2[5].numeros[w];
                            totales2.push(totalLote)
                        }
                    } else {
                        for (let i = 0; i < lotes.length; i++) {
                            const l = lotes[i];
                            let cons_si = await db.query(`SELECT * FROM costos_cargas_det 
                        WHERE Periodo = ? and idLote = ?`, [Periodo_ant, l.idLote])
                            let si = 0;
                            if (cons_si.length != 0) {
                                si = cons_si[0].Valor;
                            }
                            let cons_prod = await db.query(`SELECT SUM(TotalHI) as Total 
                        FROM produccion_huevos_det WHERE Periodo = ? and IdLote = ?`, [Hoja.Periodo, l.idLote])
                            let prod = 0;
                            if (cons_prod.length != 0) {
                                prod = cons_prod[0].Total;
                            }
                            let transf1 = 0;
                            let transf2 = 0;
                            let cons_transf2 = await db.query(`SELECT SUM(CantTercero) as CantTercero 
                        FROM nacimiento_det WHERE fechaNacimiento LIKE '${y + "-" + m}%' and idLote = ?`, [l.idLote])

                            if (cons_transf2.length != 0) {
                                transf2 = (-1) * cons_transf2[0].CantTercero;
                            }

                            filas2[0].numeros.push(si)
                            filas2[1].numeros.push(prod)
                            filas2[2].numeros.push(transf1)
                            filas2[3].numeros.push((-1) * totales[j])
                            filas2[4].numeros.push((-1) * totales[j + 1])
                            filas2[5].numeros.push(transf2)
                            let totalLote = si + prod + transf1 + ((-1) * totales[j]) + ((-1) * totales[j + 1]) + transf2;
                            totales2.push(totalLote)
                            await db.query(`INSERT INTO costos_cargas_det ( 
                        Periodo, idLote, Valor, idUser ) VALUES (?,?,?,?)`,
                                [Hoja.Periodo, l.idLote, totalLote, Hoja.idUser])
                            if (i == lotes.length - 1) {
                                filas2[0].numeros.push(filas2[0].numeros.reduce((a, b) => a + b, 0))
                                filas2[1].numeros.push(filas2[1].numeros.reduce((a, b) => a + b, 0))
                                filas2[2].numeros.push(filas2[2].numeros.reduce((a, b) => a + b, 0))
                                filas2[3].numeros.push(filas2[3].numeros.reduce((a, b) => a + b, 0))
                                filas2[4].numeros.push(filas2[4].numeros.reduce((a, b) => a + b, 0))
                                filas2[5].numeros.push(filas2[5].numeros.reduce((a, b) => a + b, 0))
                                totales2.push(totales2.reduce((a, b) => a + b, 0))
                            }
                            j = j + 2;
                        }
                        await db.query(`DELETE FROM costos_cargas_det_resumen WHERE Periodo = ?`, [Hoja.Periodo]);
                        for (let j = 0; j < filas2.length; j++) {
                            const f = filas2[j];
                            await db.query(`INSERT INTO costos_cargas_det_resumen (Periodo, 
                        titulo, numeros) VALUES (?,?,?)`, [Hoja.Periodo,
                            f.titulo, JSON.stringify(f.numeros)])
                        }
                    }

                    return {
                        success: true,
                        lotes,
                        rows: filas,
                        totales,
                        rows2: filas2,
                        totales2,
                    }

                } else if (Hoja.hoja == 'GIF Incub') {
                    const pool = await poolPromise
                    let y = Hoja.Periodo.substr(0, 4);
                    let m = Hoja.Periodo.substr(4, 2);

                    let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [Hoja.Periodo]);
                    let cerrado = false;
                    if (info_periodo.length != 0) {
                        if (info_periodo[0].Estado == 0) {
                            cerrado = true;
                        }
                    }

                    let lotes = await db.query(`SELECT cr.Lote, lo.lote_str
                FROM cargas_resumen cr
                INNER JOIN lotes lo ON lo.idLote = cr.Lote
                INNER JOIN cargas ca ON ca.idCargas = cr.idCargas
                WHERE ca.Fecha_Nacimiento LIKE '${y + "-" + m}%'
                or ca.Fecha_Carga LIKE '${y + "-" + m}%'
                GROUP BY cr.Lote, lo.lote_str
                ORDER BY lo.CorrelativoLote, lo.lote_str`)

                    let ids = await db.query(`SELECT lo.idLevante
                FROM cargas_resumen cr
                INNER JOIN lotes lo ON lo.idLote = cr.Lote
                INNER JOIN cargas ca ON ca.idCargas = cr.idCargas
                WHERE ca.Fecha_Nacimiento LIKE '${y + "-" + m}%'
                or ca.Fecha_Carga LIKE '${y + "-" + m}%'
                GROUP BY lo.idLevante`)

                    let levantes = [];

                    for (let i = 0; i < ids.length; i++) {
                        const e = ids[i].idLevante;
                        let r = await db.query(`SELECT GROUP_CONCAT(DISTINCT idLote ORDER BY CorrelativoLote SEPARATOR '-' ) as Lote, 
                    GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str SEPARATOR '-') as lote_str
                    FROM lotes WHERE idLevante = ${e} and Sexo = 'H'`);
                        if (r.length != 0) {
                            levantes.push(r[0]);
                        }
                    }
                    let arrayNum = []
                    for (let i = 0; i < lotes.length; i++) {
                        arrayNum.push(0);
                    }
                    for (let i = 0; i < levantes.length; i++) {
                        arrayNum.push(0);
                    }
                    let Total = {
                        DiferenciaDias: 0,
                        numeros: arrayNum
                    }
                    let rows
                    let exist = await db.query(`SELECT * FROM costos_cargas_fact_gif 
                WHERE Periodo = ?`, [Hoja.Periodo]);
                    if (exist.length != 0 && cerrado == true) {
                        rows = exist;
                        for (let i = 0; i < rows.length; i++) {
                            const c = rows[i];
                            c.numeros = JSON.parse(c.numeros)
                            for (let j = 0; j < c.numeros.length; j++) {
                                const Valor = c.numeros[j];
                                Total.numeros[j] = Total.numeros[j] + Valor;
                            }
                            Total.DiferenciaDias = Total.DiferenciaDias + c.DiferenciaDias;
                        }
                    } else {
                        await db.query(`DELETE FROM costos_cargas_fact_gif WHERE Periodo = ?`, [Hoja.Periodo])
                        rows = await db.query(`SELECT cr.Fecha_Carga, c.Fecha_Nacimiento
                    FROM cargas_resumen cr
                    INNER JOIN cargas c ON cr.idCargas = c.idCargas
                    WHERE c.Fecha_Nacimiento LIKE '${y + "-" + m}%' and c.Fecha_Carga NOT LIKE '${y + "-" + m}%'
                    GROUP BY cr.Fecha_Carga, c.Fecha_Nacimiento
                    ORDER BY cr.Fecha_Carga`)

                        let rows1 = await db.query(`SELECT cr.Fecha_Carga, c.Fecha_Nacimiento
                    FROM cargas_resumen cr
                    INNER JOIN cargas c ON cr.idCargas = c.idCargas
                    WHERE cr.Fecha_Carga LIKE '${y + "-" + m}%'
                    GROUP BY cr.Fecha_Carga, c.Fecha_Nacimiento
                    ORDER BY cr.Fecha_Carga`)

                        for (let i = 0; i < rows.length; i++) {
                            const c = rows[i];
                            c.Fecha_Nacimiento = formatDate(c.Fecha_Nacimiento);
                            c.DiferenciaDias = parseInt(c.Fecha_Nacimiento.substr(0, 2));
                            c.numeros = [];
                            for (let j = 0; j < lotes.length; j++) {
                                const e = lotes[j];
                                let r = await db.query(`SELECT SUM(cr.Total) as Total
                            FROM cargas_resumen cr
                            INNER JOIN cargas c ON cr.idCargas = c.idCargas
                            WHERE cr.Fecha_Carga = ?
                            and Lote = ?
                            GROUP BY cr.Fecha_Carga
                            ORDER BY cr.Fecha_Carga`, [new Date(c.Fecha_Carga), e.Lote])
                                let Valor = 0
                                if (r.length != 0) {
                                    Valor = r[0].Total;
                                }
                                c.numeros.push(Valor)
                                Total.numeros[j] = Total.numeros[j] + Valor;
                            }
                            for (let w = 0; w < levantes.length; w++) {
                                const l = levantes[w];
                                let lote = l.Lote.split('-');
                                let r = await db.query(`SELECT SUM(cr.Total) as Total
                            FROM cargas_resumen cr
                            INNER JOIN cargas c ON cr.idCargas = c.idCargas
                            WHERE cr.Fecha_Carga = ?
                            and Lote IN (${lote.join()})
                            GROUP BY cr.Fecha_Carga
                            ORDER BY cr.Fecha_Carga`, [new Date(c.Fecha_Carga)])
                                let Valor = 0;
                                if (r.length != 0) {
                                    Valor = r[0].Total * c.DiferenciaDias
                                }
                                c.numeros.push(Valor)
                                Total.numeros[lotes.length + w] = Total.numeros[lotes.length + w] + Valor;
                            }
                            Total.DiferenciaDias = Total.DiferenciaDias + c.DiferenciaDias;
                            c.Fecha_Carga = formatDate(c.Fecha_Carga);
                            await db.query(`INSERT INTO costos_cargas_fact_gif (Periodo, Fecha_Carga,
                        Fecha_Nacimiento, numeros, DiferenciaDias) VALUES (?,?,?,?,?)`, [Hoja.Periodo,
                            c.Fecha_Carga, c.Fecha_Nacimiento, JSON.stringify(c.numeros), c.DiferenciaDias])
                        }

                        for (let i = 0; i < rows1.length; i++) {
                            const c = rows1[i];
                            c.Fecha_Nacimiento = formatDate(c.Fecha_Nacimiento);
                            c.numeros = [];
                            let yy = c.Fecha_Nacimiento.substr(6, 4);
                            let mm = c.Fecha_Nacimiento.substr(3, 2);
                            let peri = yy + "" + mm;
                            if (peri == Hoja.Periodo) {
                                c.DiferenciaDias = parseInt(c.Fecha_Nacimiento.substr(0, 2)) - parseInt(formatDate(c.Fecha_Carga).substr(0, 2));
                            } else {
                                c.DiferenciaDias = DifDays(c.Fecha_Carga, Hoja.Periodo);
                            }
                            for (let j = 0; j < lotes.length; j++) {
                                const e = lotes[j];
                                let r = await db.query(`SELECT SUM(cr.Total) as Total
                            FROM cargas_resumen cr
                            INNER JOIN cargas c ON cr.idCargas = c.idCargas
                            WHERE cr.Fecha_Carga = ?
                            and Lote = ?
                            GROUP BY cr.Fecha_Carga
                            ORDER BY cr.Fecha_Carga`, [new Date(c.Fecha_Carga), e.Lote])
                                let Valor = 0
                                if (r.length != 0) {
                                    Valor = r[0].Total;
                                }
                                c.numeros.push(Valor)
                                Total.numeros[j] = Total.numeros[j] + Valor;
                            }
                            for (let w = 0; w < levantes.length; w++) {
                                const l = levantes[w];
                                let lote = l.Lote.split('-');
                                let r = await db.query(`SELECT SUM(cr.Total) as Total, cr.Fecha_Carga
                            FROM cargas_resumen cr
                            INNER JOIN cargas c ON cr.idCargas = c.idCargas
                            WHERE cr.Fecha_Carga = ?
                            and Lote IN (${lote.join()})
                            GROUP BY cr.Fecha_Carga
                            ORDER BY cr.Fecha_Carga`, [new Date(c.Fecha_Carga)])
                                let Valor = 0;
                                if (r.length != 0) {
                                    Valor = r[0].Total * c.DiferenciaDias
                                }
                                c.numeros.push(Valor)
                                Total.numeros[lotes.length + w] = Total.numeros[lotes.length + w] + Valor;
                            }
                            c.Fecha_Carga = formatDate(c.Fecha_Carga);
                            Total.DiferenciaDias = Total.DiferenciaDias + c.DiferenciaDias;
                            rows.push(c);
                            await db.query(`INSERT INTO costos_cargas_fact_gif (Periodo, Fecha_Carga,
                        Fecha_Nacimiento, numeros, DiferenciaDias) VALUES (?,?,?,?,?)`, [Hoja.Periodo,
                            c.Fecha_Carga, c.Fecha_Nacimiento, JSON.stringify(c.numeros), c.DiferenciaDias])
                        }
                    }

                    let SumaFactor = 0;
                    for (let i = lotes.length; i < Total.numeros.length; i++) {
                        const e = Total.numeros[i];
                        SumaFactor = SumaFactor + e;
                    }

                    let rows2 = [];

                    let mod1 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
                Where ct_cuenta like '912%'
                and CT_CENCOS = '00002'
                and CT_FECPRO2 = '${Hoja.Periodo}'`
                    const resultmod1 = await pool.request()
                        .query(mod1)
                    let costo_mano_obra = await resultmod1.recordset[0].CT_MNDEBE;

                    let mod2 = `Select coalesce(SUM(CT_MNDEBE - CT_MNHABER),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
                Where (ct_cuenta like '913%'
                or ct_cuenta like '914%'
                or ct_cuenta like '915%')
                and CT_CENCOS = '00002'
                and CT_FECPRO2 = '${Hoja.Periodo}'`
                    const resultmod2 = await pool.request()
                        .query(mod2)
                    let costo_gasto_indirecto = await resultmod2.recordset[0].CT_MNDEBE;

                    let cscd = await db.query(`SELECT SUM(Costo_Sexado) as CS, SUM(Costo_Desunado) as CD
                FROM datos_cartilla WHERE Periodo = ?`, [Hoja.Periodo]);

                    let mod3 = `Select coalesce(SUM(CT_MNDEBE),0) as CT_MNDEBE From RSCONCAR..CT0003COST${ytwo} A 
                Left Join RSCONCAR..CT0003PLEM B On A.CT_CUENTA=B.PCUENTA
                Left Join RSCONCAR..CT0003TAGP C On A.CT_CENCOS=C.TCLAVE AND C.TCOD='05'
                Where ct_cuenta like '918%'
                and CT_CENCOS = '00002'
                and CT_FECPRO2 = '${Hoja.Periodo}'`
                    const resultmod3 = await pool.request()
                        .query(mod3)
                    let costo_gasto_depreciacion = await resultmod3.recordset[0].CT_MNDEBE;

                    let num_cmo = [];
                    let num_cgi = [];
                    let num_cs = [];
                    let num_cd = [];
                    let num_cgi2 = [];
                    let num_cgd = [];
                    let num_tot = [];
                    let num_vacíos = [];
                    let cscs = 0;
                    let cdcd = 0;
                    if (cscd.length != 0) {
                        cscs = cscd[0].CS;
                        cdcd = cscd[0].CD;
                    }
                    let cgi_s_d = costo_gasto_indirecto - cscs - cdcd;
                    num_vacíos.push('')
                    num_cmo.push(Number(costo_mano_obra).toFixed(2))
                    num_cgi.push(Number(cgi_s_d).toFixed(2))
                    num_cs.push(Number(cscs).toFixed(2))
                    num_cd.push(Number(cdcd).toFixed(2))
                    num_cgi2.push(Number(cgi_s_d + cscs + cdcd).toFixed(2))
                    num_cgd.push(Number(costo_gasto_depreciacion).toFixed(2))
                    num_tot.push(Number(costo_mano_obra + cgi_s_d + cscs + cdcd + costo_gasto_depreciacion).toFixed(2))
                    for (let i = 0; i < levantes.length; i++) {
                        const e = levantes[i].Lote;
                        let lote_div = e.split("-")[0];
                        let lev = await db.query(`SELECT idLevante FROM
                    lotes WHERE idLote = ?`, [lote_div]);
                        let idlev = 0;
                        if (lev.length != 0) {
                            idlev = lev[0].idLevante;
                        }
                        let cscd_indiv = await db.query(`SELECT dc.Costo_Sexado, dc.Costo_Desunado
                    FROM datos_cartilla dc
                    WHERE dc.Periodo = ? and idLevante = ?`,
                            [Hoja.Periodo, idlev]);
                        let CS_indiv = 0;
                        let CD_indiv = 0;
                        if (cscd_indiv.length != 0) {
                            CS_indiv = cscd_indiv[0].Costo_Sexado;
                            CD_indiv = cscd_indiv[0].Costo_Desunado;
                        }
                        let n1 = Total.numeros[lotes.length + (i)] / SumaFactor;
                        num_cmo.push(Number(n1 * costo_mano_obra).toFixed(2))
                        num_cgi.push(Number(n1 * cgi_s_d).toFixed(2))
                        num_cs.push(Number(CS_indiv).toFixed(2))
                        num_cd.push(Number(CD_indiv).toFixed(2))
                        num_cgi2.push(Number((n1 * cgi_s_d) + CS_indiv + CD_indiv).toFixed(2))
                        num_cgd.push(Number(n1 * costo_gasto_depreciacion).toFixed(2))
                        num_tot.push(Number((n1 * costo_mano_obra) + (n1 * cgi_s_d) + CS_indiv + CD_indiv + (n1 * costo_gasto_depreciacion)).toFixed(2))
                        num_vacíos.push('')

                        let gi_table = await db.query(`SELECT * FROM gif_incub
                    WHERE Periodo = ? and idLevante = ?`,
                            [Hoja.Periodo, idlev])

                        if (gi_table.length == 0) {
                            if (cerrado != true) {
                                await db.query(`INSERT INTO gif_incub ( Periodo, idLevante, CMO, CGI, CGD ) 
                            VALUES (?,?,?,?,?)`, [Hoja.Periodo, idlev, (n1 * costo_mano_obra),
                                (n1 * cgi_s_d), (n1 * costo_gasto_depreciacion)])
                            }
                        } else {
                            if (cerrado != true) {

                                await db.query(`UPDATE gif_incub SET CMO = ?, CGI = ?, CGD = ? 
                                WHERE Periodo = ? and idLevante = ?`, [(n1 * costo_mano_obra),
                                (n1 * cgi_s_d), (n1 * costo_gasto_depreciacion), Hoja.Periodo, idlev])
                            }
                        }
                    }

                    rows2.push({
                        titulo: '(+)Costo Mano de Obra',
                        numeros: num_cmo
                    })

                    rows2.push({
                        titulo: 'GIF',
                        numeros: num_vacíos
                    })

                    rows2.push({
                        titulo: '(+)Costo Gastos Indirectos',
                        numeros: num_cgi
                    })

                    rows2.push({
                        titulo: '(+)Costo Producc.Encarg',
                        numeros: num_vacíos
                    })

                    rows2.push({
                        titulo: '(+)Costo Sexado',
                        numeros: num_cs
                    })

                    rows2.push({
                        titulo: '(+)Costo Desuñado',
                        numeros: num_cd
                    })

                    rows2.push({
                        titulo: '',
                        numeros: num_cgi2
                    })

                    rows2.push({
                        titulo: '(+)Costo Depreciacion',
                        numeros: num_cgd
                    })

                    rows2.push({
                        titulo: 'Total',
                        class: 'active',
                        numeros: num_tot
                    })

                    return {
                        fechaFinPeriodo: obtainDate(Hoja.Periodo),
                        tabla1: {
                            rows: rows,
                            lotes,
                            Total,
                            SumaFactor
                        },
                        tabla2: {
                            rows: rows2
                        },
                        levantes
                    }
                } else if (Hoja.hoja == 'Cartilla') {
                    const pool = await poolPromise
                    let y = Hoja.Periodo.substr(0, 4);
                    let m = Hoja.Periodo.substr(4, 2);

                    let info_periodo = await db.query(`SELECT * FROM periodo WHERE YearMonth = ?`, [Hoja.Periodo]);
                    let cerrado = false;
                    if (info_periodo.length != 0) {
                        if (info_periodo[0].Estado == 0) {
                            cerrado = true;
                        }
                    }

                    let ids = await db.query(`SELECT lo.idLevante
                FROM nacimiento_det cr
                INNER JOIN lotes lo ON lo.idLote = cr.idLote
                WHERE cr.fechaNacimiento LIKE '${y + "-" + m}%'
                GROUP BY lo.idLevante
                ORDER BY lo.idLevante`)

                    let lotes = [];

                    for (let i = 0; i < ids.length; i++) {
                        const e = ids[i].idLevante;
                        let r = await db.query(`SELECT GROUP_CONCAT(DISTINCT idLote ORDER BY CorrelativoLote SEPARATOR '-' ) as idLote, 
                    GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str SEPARATOR '-') as lote_str,
                    idLevante
                    FROM lotes WHERE idLevante = ${e} and Sexo = 'H'`);
                        if (r.length != 0) {
                            lotes.push(r[0]);
                        }
                    }

                    let rows = await db.query(`SELECT nd.fechaCarga, nd.fechaNacimiento
                FROM nacimiento_det nd
                WHERE nd.fechaNacimiento LIKE '${y + "-" + m}%'
                GROUP BY nd.fechaNacimiento, nd.fechaCarga
                ORDER BY nd.fechaNacimiento`)

                    let filas = [];
                    if (cerrado == false) {
                        for (let i = 0; i < rows.length; i++) {
                            const e = rows[i];
                            let numeros = [];
                            let sumSP_LH = 0;
                            let sumSubProductoRealConCarnoNoVendida = 0
                            let sumSP_LM = 0;
                            let spByProduceLh = 0
                            let spByProduceLm = 0
                            let sumDSP = 0;
                            for (let j = 0; j < lotes.length; j++) {
                                const l = lotes[j];
                                let idLevante = lotes[j].idLevante;
                                let div = l.idLote.split('-');
                                let lh = div[0];
                                let lm = div[1];
                                let cart_lh_DSP = await db.query(`SELECT 
                            idNacimiento,
                            COALESCE(SUM(DesmedroSubProd),0) as DesmedroSubProd
                            FROM nacimiento_det nd
                            WHERE nd.fechaNacimiento = ? and nd.idLote = ?
                            GROUP BY idNacimiento`,
                                    [new Date(e.fechaNacimiento), lh])
                                let SP_LH = 0;
                                let DSP_LH = 0;

                                if (cart_lh_DSP.length != 0) {
                                    DSP_LH = cart_lh_DSP[0].DesmedroSubProd;
                                    let cart_lh_pV = await db.query(`SELECT
                                COALESCE(prodVendido,0) as prodVendido,COALESCE(SUM(subProducto+nrd.carneNoVendida),0) as byProduce
                                FROM nacimiento_reporte_det nrd
                                INNER JOIN nacimiento_reporte nr ON nr.idNacimientoReporte = nrd.idNacimientoReporte
                                WHERE idNacimiento = ? and idLote = ?`, [cart_lh_DSP[0].idNacimiento, lh])
                                    if (cart_lh_pV.length != 0) {
                                        SP_LH = cart_lh_pV[0].prodVendido;
                                        DSP_LH = cart_lh_pV[0].byProduce
                                    }
                                }
                                let cart_lm_DSP = await db.query(`SELECT 
                            idNacimiento,
                            COALESCE(SUM(DesmedroSubProd),0) as DesmedroSubProd
                            FROM nacimiento_det nd
                            WHERE nd.fechaNacimiento = ? and nd.idLote = ?
                            GROUP BY idNacimiento`,
                                    [new Date(e.fechaNacimiento), lm])
                                let SP_LM = 0;
                                let DSP_LM = 0;
                                if (cart_lm_DSP.length != 0) {
                                    DSP_LM = cart_lm_DSP[0].DesmedroSubProd;
                                    let cart_lm_pV = await db.query(`SELECT
                                COALESCE(prodVendido,0) as prodVendido,COALESCE(SUM(subProducto+nrd.carneNoVendida),0) as byProduce
                                FROM nacimiento_reporte_det nrd
                                INNER JOIN nacimiento_reporte nr ON nr.idNacimientoReporte = nrd.idNacimientoReporte
                                WHERE idNacimiento = ? and idLote = ?`, [cart_lm_DSP[0].idNacimiento, lm])
                                    if (cart_lm_pV.length != 0) {
                                        SP_LM = cart_lm_pV[0].prodVendido;
                                        DSP_LM = cart_lm_pV[0].byProduce;
                                    }
                                }
                                numeros.push(SP_LH);
                                numeros.push(SP_LM);
                                numeros.push(DSP_LH);
                                numeros.push(DSP_LM);
                                sumSP_LH = sumSP_LH + SP_LH;
                                sumSP_LM = sumSP_LM + SP_LM;
                                sumDSP = sumDSP + (DSP_LH + DSP_LM);
                            }
                            numeros.push(sumSP_LH)
                            numeros.push(sumSP_LM)
                            numeros.push(sumDSP)
                            numeros.push(sumSP_LH + sumSP_LM + sumDSP)
                            if (sumDSP == 0 || (sumSP_LH + sumSP_LM) == 0) {
                                numeros.push(0);
                            } else {
                                numeros.push(Number(((sumDSP / (sumSP_LH + sumSP_LM)) * 100).toFixed(0)))
                            }
                            filas.push({
                                fechaCarga: formatDate(e.fechaCarga),
                                fechaNacimiento: formatDate(e.fechaNacimiento),
                                numeros
                            })
                        }
                    } else {
                        let r = await db.query(`SELECT * FROM costos_cartilla
                           WHERE Periodo = ?`, [Hoja.Periodo]);
                        if (r.length != 0) {
                            for (let i = 0; i < r.length; i++) {
                                const f = r[i];
                                filas.push({
                                    fechaCarga: f.fechaCarga,
                                    fechaNacimiento: f.fechaNacimiento,
                                    numeros: JSON.parse(f.numeros)
                                })
                            }
                        } else {
                            for (let i = 0; i < rows.length; i++) {
                                const e = rows[i];
                                let numeros = [];
                                let sumSP_LH = 0;
                                let sumSP_LM = 0;
                                let sumDSP = 0;
                                let spByProduceLh = 0

                                let sumSubProductoRealConCarnoNoVendida = 0
                                for (let j = 0; j < lotes.length; j++) {
                                    const l = lotes[j];
                                    let idLevante = lotes[j].idLevante;

                                    let div = l.idLote.split('-');
                                    let lh = div[0];

                                    let lm = div[1];
                                    let cart_lh_DSP = await db.query(`SELECT 
                                idNacimiento,
                                COALESCE(SUM(DesmedroSubProd),0) as DesmedroSubProd
                                FROM nacimiento_det nd
                                WHERE nd.fechaNacimiento = ? and nd.idLote = ?
                                GROUP BY idNacimiento`,
                                        [new Date(e.fechaNacimiento), lh])
                                    let SP_LH = 0;
                                    let DSP_LH = 0;
                                    if (cart_lh_DSP.length != 0) {
                                        DSP_LH = cart_lh_DSP[0].DesmedroSubProd;
                                        let cart_lh_pV = await db.query(`SELECT
                                    COALESCE(prodVendido,0) as prodVendido,COALESCE(SUM(subProducto+nrd.carneNoVendida),0) as byProduce
                                    FROM nacimiento_reporte_det nrd
                                    INNER JOIN nacimiento_reporte nr ON nr.idNacimientoReporte = nrd.idNacimientoReporte
                                    WHERE idNacimiento = ? and idLote = ?`, [cart_lh_DSP[0].idNacimiento, lh])
                                        if (cart_lh_pV.length != 0) {
                                            SP_LH = cart_lh_pV[0].prodVendido;
                                            DSP_LH = cart_lh_pV[0].byProduce;
                                        }
                                    }
                                    let cart_lm_DSP = await db.query(`SELECT 
                                idNacimiento,
                                COALESCE(SUM(DesmedroSubProd),0) as DesmedroSubProd
                                FROM nacimiento_det nd
                                WHERE nd.fechaNacimiento = ? and nd.idLote = ?
                                GROUP BY idNacimiento`,
                                        [new Date(e.fechaNacimiento), lm])
                                    let SP_LM = 0;
                                    let DSP_LM = 0;
                                    if (cart_lm_DSP.length != 0) {
                                        DSP_LM = cart_lm_DSP[0].DesmedroSubProd;
                                        let cart_lm_pV = await db.query(`SELECT
                                    COALESCE(prodVendido,0) as prodVendido,COALESCE(SUM(subProducto+nrd.carneNoVendida),0) as byProduce
                                    FROM nacimiento_reporte_det nrd
                                    INNER JOIN nacimiento_reporte nr ON nr.idNacimientoReporte = nrd.idNacimientoReporte
                                    WHERE idNacimiento = ? and idLote = ?`, [cart_lm_DSP[0].idNacimiento, lm])
                                        if (cart_lm_pV.length != 0) {
                                            SP_LM = cart_lm_pV[0].prodVendido;
                                            DSP_LM = cart_lm_pV[0].byProduce
                                        }
                                    }
                                    numeros.push(SP_LH);
                                    numeros.push(SP_LM);
                                    numeros.push(DSP_LH);
                                    numeros.push(DSP_LM);
                                    sumSP_LH = sumSP_LH + SP_LH;
                                    sumSP_LM = sumSP_LM + SP_LM;
/*                                 sumSubProductoRealConCarnoNoVendida += DSP_LH + SP_LH
 */                                sumDSP = sumDSP + (DSP_LH + DSP_LM);
                                }
                                numeros.push(sumSP_LH)
                                numeros.push(sumSP_LM)
                                numeros.push(sumDSP)
                                numeros.push(sumSP_LH + sumSP_LM + sumDSP)
                                if (sumDSP == 0 || (sumSP_LH + sumSP_LM) == 0) {
                                    numeros.push(0);
                                } else {
                                    numeros.push(Number(((sumDSP / (sumSP_LH + sumSP_LM)) * 100).toFixed(0)))
                                }
                                filas.push({
                                    fechaCarga: formatDate(e.fechaCarga),
                                    fechaNacimiento: formatDate(e.fechaNacimiento),
                                    numeros
                                })
                            }
                        }
                    }

                    for (let j = 0; j < lotes.length; j++) {
                        const l = lotes[j];
                        let idLevante = lotes[j].idLevante;
                        let lote_str = lotes[j].lote_str;
                        let div = l.idLote.split('-');
                        let lh = div[0];
                        let lm = div[1];
                        let sumQuincena = 0;
                        let sumFindemes = 0;
                        for (let i = 0; i < rows.length; i++) {
                            const e = rows[i];
                            let cart_lh = await db.query(`SELECT 
                        idNacimiento,
                        COALESCE(SUM(SexadoProd),0) as SexadoProd,
                        COALESCE(SUM(SexadoSubProd),0) as SexadoSubProd
                        FROM nacimiento_det nd
                        WHERE nd.fechaNacimiento = ? and nd.idLote = ?
                        GROUP BY idNacimiento`,
                                [new Date(e.fechaNacimiento), lh])
                            let SP_LH = 0;
                            let SSP_LH = 0;
                            if (cart_lh.length != 0) {
                                SP_LH = cart_lh[0].SexadoProd;
                                SSP_LH = cart_lh[0].SexadoSubProd;
                            }
                            let cart_lm = await db.query(`SELECT 
                        idNacimiento,
                        COALESCE(SUM(SexadoProd),0) as SexadoProd,
                        COALESCE(SUM(SexadoSubProd),0) as SexadoSubProd
                        FROM nacimiento_det nd
                        WHERE nd.fechaNacimiento = ? and nd.idLote = ?
                        GROUP BY idNacimiento`,
                                [new Date(e.fechaNacimiento), lm])
                            let SP_LM = 0;
                            let SSP_LM = 0;
                            if (cart_lm.length != 0) {
                                SP_LM = cart_lm[0].SexadoProd;
                                SSP_LM = cart_lm[0].SexadoSubProd;
                            }
                            if (parseInt(obtainDay(e.fechaNacimiento)) <= 15) {
                                sumQuincena = sumQuincena + (SP_LH + SSP_LH + SP_LM + SSP_LM)
                            } else {
                                sumFindemes = sumFindemes + (SP_LH + SSP_LH + SP_LM + SSP_LM)
                            }
                        }
                        Costo_Sexado = (sumFindemes + sumQuincena) * 0.09;
                        let exist = await db.query(`SELECT * FROM datos_cartilla 
                    WHERE idLevante = ? and Periodo = ?`, [idLevante, Hoja.Periodo])
                        if (exist.length == 0) {
                            await db.query(`INSERT INTO datos_cartilla (
                        Periodo, idLevante, lote_str, quincena, findemes) VALUES (
                        ?,?,?,?,?)`, [Hoja.Periodo, idLevante, lote_str, sumQuincena, sumFindemes]);
                        }
                        await db.query(`UPDATE datos_cartilla SET Costo_Sexado = ?,
                    quincena = ?, findemes = ? WHERE idLevante = ? and Periodo = ?`,
                            [Costo_Sexado, sumQuincena, sumFindemes, idLevante, Hoja.Periodo])
                    }

                    let totales = [];

                    for (let i = 0; i < filas.length; i++) {
                        const e = filas[i];
                        for (let j = 0; j < e.numeros.length - 1; j++) {
                            const n = e.numeros[j];
                            if (i == 0) {
                                totales.push(n);
                            } else {
                                totales[j] = totales[j] + n;
                            }
                        }
                        let exist = await db.query(`SELECT * FROM costos_cartilla 
                    WHERE Periodo = ? and fechaCarga = ? and fechaNacimiento = ?`,
                            [Hoja.Periodo, e.fechaCarga, e.fechaNacimiento])
                        if (exist.length == 0) {
                            await db.query(`INSERT INTO costos_cartilla 
                        (Periodo, fechaCarga, fechaNacimiento, numeros) VALUES(?,?,?,?)`,
                                [Hoja.Periodo, e.fechaCarga, e.fechaNacimiento, JSON.stringify(e.numeros)])
                        } else {
                            await db.query(`UPDATE costos_cartilla SET numeros = ?
                        WHERE Periodo = ? and fechaCarga = ? and fechaNacimiento = ?`,
                                [JSON.stringify(e.numeros), Hoja.Periodo, e.fechaCarga, e.fechaNacimiento])
                        }
                    }
                    let totalesG = [];
                    let totalesG2 = [];
                    let totalesPS = [];
                    let sumQuincena = 0;
                    let sumFindemes = 0;
                    let Sexado = [];
                    let Desunado = [];
                    let h = 0;

                    for (let i = 0; i < totales.length; i = i + 4) {
                        const e = totales[i];
                        const e1 = totales[i + 1];
                        const e2 = totales[i + 2];
                        const e3 = totales[i + 3];
                        totalesG.push({
                            valor: '',
                            style: ""
                        })
                        totalesG.push({
                            valor: '',
                            style: ""
                        })
                        totalesG2.push({
                            valor: '',
                            style: ""
                        })
                        totalesG2.push({
                            valor: '',
                            style: ""
                        })
                        totalesPS.push({
                            valor: '',
                            style: ""
                        })
                        totalesPS.push({
                            valor: '',
                            style: ""
                        })
                        totalesPS.push({
                            valor: '',
                            style: ''
                        })
                        Sexado.push({
                            valor: '',
                            style: ''
                        })
                        Sexado.push({
                            valor: '',
                            style: ''
                        })
                        Sexado.push({
                            valor: '',
                            style: ''
                        })
                        Desunado.push({
                            valor: '',
                            style: ''
                        })
                        Desunado.push({
                            valor: '',
                            style: ''
                        })
                        Desunado.push({
                            valor: '',
                            style: ''
                        })
                        if (i + 3 == totales.length - 1) {
                            totalesG.push({
                                valor: e + e1 + e2,
                                style: ""
                            });
                            totalesG.push({
                                valor: sumQuincena,
                                style: {
                                    'background-color': '#e30512',
                                    'color': '#ffffff'
                                }
                            })
                            totalesG2.push({
                                valor: '',
                                style: ""
                            })
                            totalesG2.push({
                                valor: sumFindemes,
                                style: {
                                    'background-color': '#e30512',
                                    'color': '#ffffff'
                                }
                            })
                            totalesPS.push({
                                valor: sumFindemes + sumQuincena,
                                style: {
                                    'color': '#e30512'
                                }
                            })
                            Sexado.push({
                                valor: ((sumFindemes + sumQuincena) * 0.09).toFixed(2),
                                style: ''
                            })
                            Desunado.push({
                                valor: (totales[i + 1] * 0.14).toFixed(2),
                                style: ''
                            })
                        } else {
                            totalesG.push({
                                valor: e + e1 + e2 + e3,
                                style: ""
                            });
                            totalesG2.push({
                                valor: '',
                                style: ""
                            })
                            let rows = await db.query(`SELECT quincena, findemes, lo.idLevante
                        FROM datos_cartilla dc
                        INNER JOIN lotes lo ON lo.idLevante = dc.idLevante
                        WHERE dc.Periodo = ?
                        GROUP BY lo.idLevante, quincena, findemes
                        ORDER BY lo.idLevante
                        `, [Hoja.Periodo]);
                            let quincena = 0;
                            let findemes = 0;
                            let Costo_Sexado = 0;
                            let Costo_Desunado = 0;
                            if (rows.length != 0) {
                                let idLevante = rows[h].idLevante;
                                quincena = rows[h].quincena;
                                findemes = rows[h].findemes;
                                Costo_Sexado = (findemes + quincena) * 0.09;
                                Costo_Desunado = totales[i + 1] * 0.14;
                                await db.query(`UPDATE datos_cartilla 
                            SET Costo_Sexado = ?, Costo_Desunado = ?
                            WHERE idLevante = ? and Periodo = ?`,
                                    [Costo_Sexado, Costo_Desunado,
                                        idLevante, Hoja.Periodo])
                            }
                            // else{
                            //     return {
                            //         success: false,
                            //         message: "Registre los datos de la cartilla necesarios, quincena y fin de mes."
                            //     }
                            // }
                            sumQuincena = sumQuincena + quincena;
                            sumFindemes = sumFindemes + findemes;

                            totalesG.push({
                                valor: quincena,
                                style: {
                                    'background-color': '#e30512',
                                    'color': '#ffffff'
                                }
                            });
                            totalesG2.push({
                                valor: findemes,
                                style: {
                                    'background-color': '#e30512',
                                    'color': '#ffffff'
                                }
                            });
                            totalesPS.push({
                                valor: findemes + quincena,
                                style: {
                                    'color': '#e30512'
                                }
                            })
                            Sexado.push({
                                valor: (Costo_Sexado).toFixed(2),
                                style: ''
                            })
                            Desunado.push({
                                valor: (Costo_Desunado).toFixed(2),
                                style: ''
                            })
                        }
                        h = h + 1;
                    }

                    return {
                        success: true,
                        lotes,
                        rows: filas,
                        totales,
                        totalesG,
                        totalesG2,
                        totalesPS,
                        Sexado,
                        Desunado
                    }
                } else if (Hoja.hoja == 'Cartilla-D') {
                    const pool = await poolPromise
                    let y = Hoja.Periodo.substr(0, 4);
                    let m = Hoja.Periodo.substr(4, 2);

                    let rows = await db.query(`SELECT * 
                FROM datos_cartilla
                WHERE Periodo = ?`,
                        [Hoja.Periodo]);

                    let ids = await db.query(`SELECT lo.idLevante
                FROM nacimiento_det cr
                INNER JOIN lotes lo ON lo.idLote = cr.idLote
                WHERE cr.fechaNacimiento LIKE '${y + "-" + m}%'
                GROUP BY lo.idLevante
                ORDER BY lo.idLevante`)

                    let lotes = [];

                    for (let i = 0; i < ids.length; i++) {
                        const e = ids[i].idLevante;
                        let r = await db.query(`SELECT idLevante, 
                    GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str SEPARATOR '-') as lote_str
                    FROM lotes WHERE idLevante = ${e}`);
                        if (r.length != 0) {
                            lotes.push(r[0]);
                        }
                    }

                    if (rows.length == 0) {
                        return {
                            lotes: lotes
                        }
                    } else {
                        if (lotes.length != rows.length) {
                            for (let r = 0; r < lotes.length; r++) {
                                const e = lotes[r];
                                let dc = await db.query(`SELECT * 
                            FROM datos_cartilla
                            WHERE Periodo = ? and idLevante = ?`,
                                    [Hoja.Periodo, e.idLevante]);
                                if (dc.length == 0) {
                                    if (e.lote_str == 'HIILM' || e.lote_str == 'HIILH') {
                                        e.lote_str = 'HIILH-HIILM'
                                    }
                                    rows.push({
                                        Periodo: Hoja.Periodo,
                                        idLevante: e.idLevante,
                                        lote_str: e.lote_str,
                                        quincena: 0,
                                        findemes: 0,
                                        Costo_Sexado: 0,
                                        Costo_Desunado: 0,
                                    })
                                }
                            }
                        }
                        return {
                            rows: rows
                        }
                    }
                } else if (Hoja.hoja == 'Incubadora') {
                    codigo = '0004'
                    let rows = await db.query("SELECT * FROM costos WHERE C6_CALMA = ? and Periodo = ? and Hoja = ?", [codigo, Hoja.Periodo, Hoja.hoja]);
                    for (let i = 0; i < rows.length; i++) {
                        const e = rows[i];
                        e.C6_DFECDOC = formatDate(e.C6_DFECDOC)
                    }
                    let json = {
                        rows
                    }
                    return json;
                } else if (Hoja.hoja == 'RINCUB') {
                    codigo = '0004'
                    let lotes = await db.query(`SELECT TG_CDESCRI_10 FROM costos 
                WHERE C6_CALMA = ? and Periodo = ? and Hoja = 'Incubadora' and TG_CDESCRI_10 != 'VENTAS'
                GROUP BY TG_CDESCRI_10 ORDER BY TG_CDESCRI_10`, [codigo, Hoja.Periodo])

                    let TG_CDESCRI_38 = await db.query(`SELECT TG_CDESCRI_38 FROM costos 
                WHERE C6_CALMA = ? and Periodo = ? and Hoja = 'Incubadora' 
                GROUP BY TG_CDESCRI_38 ORDER BY  TG_CDESCRI_38`, [codigo, Hoja.Periodo])

                    let rows = [];
                    for (let i = 0; i < TG_CDESCRI_38.length; i++) {
                        const el = TG_CDESCRI_38[i].TG_CDESCRI_38;
                        let numeros = [];
                        let sumCant = 0;
                        for (let j = 0; j < lotes.length; j++) {
                            const el2 = lotes[j].TG_CDESCRI_10;
                            let v = 0;
                            if (el2 == 'PLANTA DE INCUBACION') {
                                let cons_v = await db.query(`SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO FROM costos 
                            WHERE TG_CDESCRI_38 = ? and TG_CDESCRI_10 = 'VENTAS' and Periodo = ? and Hoja = 'Incubadora'`,
                                    [el, Hoja.Periodo])
                                v = cons_v[0].C6_NMNIMPO;
                            }
                            let l = await db.query(`SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO FROM costos 
                        WHERE TG_CDESCRI_38 = ? and TG_CDESCRI_10 = ? and Periodo = ? and Hoja = 'Incubadora'`,
                                [el, el2, Hoja.Periodo])
                            let C6_NMNIMPO = (l[0].C6_NMNIMPO + v);
                            numeros.push(C6_NMNIMPO.toFixed(2));
                            sumCant = sumCant + C6_NMNIMPO;
                        }
                        numeros.push(sumCant.toFixed(2));
                        rows.push({
                            tipo: el,
                            numeros: numeros,
                            class: ''
                        });
                    }

                    let totales = [];
                    let sumTotal = 0;
                    for (let w = 0; w < lotes.length; w++) {
                        const el2 = lotes[w].TG_CDESCRI_10;
                        let v = 0;
                        if (el2 == 'PLANTA DE INCUBACION') {
                            let cons_v = await db.query(`SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO FROM costos 
                        WHERE TG_CDESCRI_10 = 'VENTAS' and Periodo = ? and Hoja = 'Incubadora'`,
                                [Hoja.Periodo])
                            v = cons_v[0].C6_NMNIMPO;
                        }
                        let general = await db.query(`SELECT IFNULL(SUM(C6_NMNIMPO),0) as C6_NMNIMPO FROM costos 
                    WHERE TG_CDESCRI_10 = ? and Periodo = ? and Hoja = 'Incubadora'`, [el2, Hoja.Periodo])
                        let totalG = (general[0].C6_NMNIMPO + v);
                        sumTotal = sumTotal + totalG;
                        totales.push(totalG);
                        if (w + 1 == lotes.length) {
                            totales.push(sumTotal.toFixed(2));
                        }
                    }
                    let totalesGenerales = [{
                        tipo: 'Total General',
                        numeros: totales,
                        class: 'active'
                    }]

                    let y = Hoja.Periodo.substr(0, 4);
                    let m = Hoja.Periodo.substr(4, 2);

                    let ids = await db.query(`SELECT lo.idLevante
                FROM nacimiento_det cr
                INNER JOIN lotes lo ON lo.idLote = cr.idLote
                WHERE cr.fechaNacimiento LIKE '${y + "-" + m}%'
                GROUP BY lo.idLevante
                ORDER BY lo.idLevante`)

                    let lotes2 = [];

                    for (let i = 0; i < ids.length; i++) {
                        const e = ids[i].idLevante;
                        let r = await db.query(`SELECT GROUP_CONCAT(DISTINCT idLote ORDER BY CorrelativoLote SEPARATOR '-' ) as idLote, 
                    GROUP_CONCAT(DISTINCT lote_str ORDER BY lote_str SEPARATOR '-') as lote_str
                    FROM lotes WHERE idLevante = ${e} and Sexo = 'H'`);
                        if (r.length != 0) {
                            lotes2.push(r[0]);
                        }
                    }

                    let rows2 = await db.query(`SELECT nd.fechaCarga, nd.fechaNacimiento
                FROM nacimiento_det nd
                WHERE nd.fechaNacimiento LIKE '${y + "-" + m}%'
                GROUP BY nd.fechaNacimiento, nd.fechaCarga
                ORDER BY nd.fechaNacimiento`)

                    let filas2 = [];
                    for (let i = 0; i < rows2.length; i++) {
                        const e = rows2[i];
                        let numeros = [];
                        let sumSP_LH = 0;
                        let sumSP_LM = 0;
                        let sumDSP = 0;
                        for (let j = 0; j < lotes2.length; j++) {
                            const l = lotes2[j];
                            let div = l.idLote.split('-');
                            let lh = div[0];
                            let lm = div[1];
                            let cart_lh = await db.query(`SELECT 
                        COALESCE(SUM(nrd.prodVendido),0) as prodVendido,
                        COALESCE(SUM(DesmedroSubProd),0) as DesmedroSubProd
                        FROM nacimiento_det nd
                        INNER JOIN nacimiento_reporte nr ON nr.idNacimiento = nd.idNacimiento
                        INNER JOIN nacimiento_reporte_det nrd ON nr.idNacimientoReporte = nrd.idNacimientoReporte
                        WHERE nd.fechaNacimiento = ? and nd.idLote = ? and nrd.idLote = ?`,
                                [new Date(e.fechaNacimiento), lh, lh])
                            let SP_LH = 0;
                            let DSP_LH = 0;
                            if (cart_lh.length != 0) {
                                SP_LH = cart_lh[0].prodVendido;
                                DSP_LH = cart_lh[0].DesmedroSubProd;
                            }
                            let cart_lm = await db.query(`SELECT 
                        COALESCE(SUM(nrd.prodVendido),0) as prodVendido,
                        COALESCE(SUM(DesmedroSubProd),0) as DesmedroSubProd
                        FROM nacimiento_det nd
                        INNER JOIN nacimiento_reporte nr ON nr.idNacimiento = nd.idNacimiento
                        INNER JOIN nacimiento_reporte_det nrd ON nr.idNacimientoReporte = nrd.idNacimientoReporte
                        WHERE nd.fechaNacimiento = ? and nd.idLote = ? and nrd.idLote = ?`,
                                [new Date(e.fechaNacimiento), lm, lm])
                            let SP_LM = 0;
                            let DSP_LM = 0;
                            if (cart_lm.length != 0) {
                                SP_LM = cart_lm[0].prodVendido;
                                DSP_LM = cart_lm[0].DesmedroSubProd;
                            }
                            numeros.push(SP_LH);
                            numeros.push(SP_LM);
                            numeros.push(DSP_LH);
                            numeros.push(DSP_LM);
                            sumSP_LH = sumSP_LH + SP_LH;
                            sumSP_LM = sumSP_LM + SP_LM;
                            sumDSP = sumDSP + (DSP_LH + DSP_LM);
                        }
                        numeros.push(sumSP_LH)
                        numeros.push(sumSP_LM)
                        numeros.push(sumDSP)
                        numeros.push(sumSP_LH + sumSP_LM + sumDSP)
                        if (sumDSP == 0 || (sumSP_LH + sumSP_LM) == 0) {
                            numeros.push(0);
                        } else {
                            numeros.push(((sumDSP / (sumSP_LH + sumSP_LM)) * 100).toFixed(0))
                        }
                        filas2.push({
                            fechaCarga: formatDate(e.fechaCarga),
                            fechaNacimiento: formatDate(e.fechaNacimiento),
                            numeros
                        })
                    }

                    let totales2 = [];

                    let totalG = {
                        valor: 0,
                        porcentaje: 100
                    };
                    for (let i = 0; i < filas2.length; i++) {
                        const e = filas2[i].numeros;
                        let w = 0;
                        for (let j = 0; j < e.length - 5; j = j + 4) {
                            const n0 = e[j];
                            const n1 = e[j + 1];
                            const n2 = e[j + 2];
                            const n3 = e[j + 3];
                            let n = n0 + n1 + n2 + n3;
                            totalG.valor = totalG.valor + n;
                            if (i == 0) {
                                totales2.push({
                                    lote: lotes[w].TG_CDESCRI_10,
                                    valor: n
                                });
                            } else {
                                totales2[w].valor = totales2[w].valor + n;
                            }
                            w = w + 1;
                        }
                    }

                    for (let i = 0; i < totales2.length; i++) {
                        const e = totales2[i];
                        e.porcentaje = Number((e.valor / totalG.valor) * 100).toFixed(2);
                    }
                    totales2.unshift(totalG);

                    let rows3 = [];

                    for (let i = 0; i < TG_CDESCRI_38.length; i++) {
                        const el = TG_CDESCRI_38[i].TG_CDESCRI_38;
                        let numeros = [];
                        let sumCant = 0;
                        for (let j = 0; j < lotes.length; j++) {
                            const el2 = lotes[j].TG_CDESCRI_10;
                            if (el2 != 'PLANTA DE INCUBACION') {
                                let valor_pi = Number(rows[i].numeros[lotes.length - 1]);
                                let valor_act = Number(rows[i].numeros[j]);
                                let porcentaje = 0;
                                if (typeof totales2[j + 1] != "undefined") {
                                    porcentaje = Number(totales2[j + 1].porcentaje);
                                }
                                let n = (((valor_pi * porcentaje)) / 100) + valor_act;
                                numeros.push(n.toFixed(2));
                                sumCant = sumCant + n;
                            } else {
                                numeros.push(0);
                            }
                        }
                        numeros.push(sumCant.toFixed(2));
                        rows3.push({
                            tipo: el,
                            numeros: numeros,
                            class: ''
                        });
                    }

                    let lotes3 = [];
                    for (let i = 0; i < lotes.length; i++) {
                        const e = lotes[i];
                        if (e.TG_CDESCRI_10 == 'PLANTA DE INCUBACION') {
                            lotes3.push('')
                        } else {
                            lotes3.push(e.TG_CDESCRI_10)
                        }
                    }

                    let totales3 = [];

                    for (let j = 0; j < rows3.length; j++) {
                        const e = rows3[j];
                        for (let i = 0; i < e.numeros.length; i++) {
                            const n = e.numeros[i];
                            if (j == 0) {
                                totales3.push(Number(n));
                            } else {
                                totales3[i] = Number((totales3[i] + Number(n)).toFixed(2));
                            }
                        }
                    }

                    for (let i = 0; i < rows3.length; i++) {
                        const r = rows3[i].tipo;
                        for (let j = 0; j < lotes3.length - 1; j++) {
                            const val = rows3[i].numeros[j];
                            const l = lotes3[j];
                            let cons = await db.query(`SELECT * FROM rincub_tabla
                        WHERE TG_CDESCRI_38 = ? and TG_CDESCRI_10 = ? and 
                        Periodo = ? and Hoja = ?`, [r, l, Hoja.Periodo, Hoja.hoja]);
                            if (cons.length == 0) {
                                await db.query(`INSERT INTO rincub_tabla (
                            Periodo, Hoja, TG_CDESCRI_38, TG_CDESCRI_10, Valor)
                            VALUES (?,?,?,?,?)`, [Hoja.Periodo, Hoja.hoja, r, l, val])
                            } else {
                                await db.query(`UPDATE rincub_tabla set Valor = ?
                            WHERE Periodo = ? and Hoja = ? and TG_CDESCRI_38 = ?
                            and TG_CDESCRI_10 = ?`, [val, Hoja.Periodo, Hoja.hoja, r, l])
                            }
                        }
                    }

                    let json = {
                        rows,
                        lotes,
                        TG_CDESCRI_38,
                        totalesGenerales,
                        tabla2: {
                            totales2
                        },
                        tabla3: {
                            rows: rows3,
                            lotes: lotes3,
                            totales: totales3
                        }
                    }
                    return json;
                }
            }
            console.log("termino")
        } catch (error) {
            console.log("error", error)
        }
    },
    deleteData: async function (Hoja) {
        let codigo
        if (Hoja.hoja == 'Granja') {
            codigo = '0003'
        } else if (Hoja.hoja == 'Cargas') {
            codigo = '0004'
        } else if (Hoja.hoja == 'Incubadora') {
            codigo = '0004'
        }
        let rows
        if (Hoja.hoja == '911' || Hoja.hoja == '918' || Hoja.hoja == '913-915') {
            rows = await db.query(`DELETE FROM costos_911_913_915_918 WHERE Periodo = ? and Hoja = ?`,
                [Hoja.Periodo, Hoja.hoja])
        } else {
            rows = await db.query("DELETE FROM costos WHERE C6_CALMA = ? and Periodo = ? and Hoja = ?",
                [codigo, Hoja.Periodo, Hoja.hoja]);
        }
        return rows;
    },
    getClientes: async function () {

        const pool = await poolPromise
        const result = await pool.request()
            .query("select * from RSFACCAR.dbo.FT0003CLIE ORDER BY CL_CNOMCLI")
        let json = {
            result: result.recordset,
            length: result.recordset.length
        }
        return json;
    },
    addClientes: async function (Periodo, Rows) {
        for (let i = 0; i < Rows.result.length; i++) {
            const e = Rows.result[i];
            if (e.CL_CNUMRUC == '20221084684' || e.CL_CNUMRUC == '20155261570' || e.CL_CNUMRUC == "20131589086" || e.CL_CNUMRUC == "20132100552") {
                await db.query("INSERT INTO clientes(CL_CCODCLI,CL_CNOMCLI,CL_CNUMRUC,CL_CDIRCLI, CL_CEMAIL, Favoritos) VALUES(?,?,?,?,?,?)", [e.CL_CCODCLI.trim(), e.CL_CNOMCLI.trim(), e.CL_CNUMRUC.trim(), e.CL_CDIRCLI.trim(), e.CL_CEMAIL.trim(), 1])
            } else {
                await db.query("INSERT INTO clientes(CL_CCODCLI,CL_CNOMCLI,CL_CNUMRUC,CL_CDIRCLI, CL_CEMAIL, Favoritos) VALUES(?,?,?,?,?,?)", [e.CL_CCODCLI.trim(), e.CL_CNOMCLI.trim(), e.CL_CNUMRUC.trim(), e.CL_CDIRCLI.trim(), e.CL_CEMAIL.trim(), 0])
            }
        }
        return Rows;
    },
    getClientesSG: async function () {
        let rows = await db.query("SELECT * FROM clientes ORDER BY Favoritos desc,CL_CNOMCLI");
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            if (e.CL_CNUMRUC == '20221084684') {
                e.Style = {
                    'color': 'white',
                    'background-color': '#e2231a'
                }
            } else if (e.CL_CNUMRUC == "20131589086") {
                e.Style = {
                    'color': 'white',
                    'background-color': '#199ff7'
                }
            } else if (e.CL_CNUMRUC == "20155261570") {
                e.Style = {
                    'color': 'white',
                    'background-color': '#e44761'
                }
            } else if (e.CL_CNUMRUC == "20132100552") {
                e.Style = {
                    'color': 'white',
                    'background-color': '#dede31'
                }
            }
        }
        return rows;
    },
    DeleteClientesSG: async function () {
        let rows = await db.query("TRUNCATE TABLE clientes");
        return rows;
    },
    getProviders: async function () {
        const pool = await poolPromise
        const result = await pool.request()
            .query("SELECT AC_CCODIGO, AC_CNOMBRE FROM RSCONCAR..CP0003MAES READONLY ORDER BY AC_CNOMBRE")
        return result.recordset;
    },
    getProvidersContab: async function () {

        const pool = await poolPromise
        const result = await pool.request()
            .query(`SELECT AC_CCODIGO, AC_CNOMBRE FROM RSCONCAR..CP0003MAES READONLY 
            WHERE AC_CVANEXO='P'
            ORDER BY AC_CNOMBRE`)
        return result.recordset;
    },
    getArticles: async function (type = null) {
        const pool = await poolPromise
        let sql = `SELECT RTRIM(AR_CCODIGO) as AR_CCODIGO, AR_CDESCRI FROM RSFACCAR..AL0003ARTI READONLY 
        ${type == 'N' ? 'WHERE AR_CCODIGO NOT IN (SELECT A.AR_CCODIGO FROM RSFACCAR..AL0003BLACKLIST A)' : ''}
                         ORDER BY AR_CDESCRI
        `;

        const result = await pool.request().query(sql);
        return result.recordset;
    },
    getArticlesActualizado: async function () {
        const pool = await poolPromise
        let sql = `SELECT W.AR_CCODIGO,W.AR_CDESCRI,W.TIPO,W.COLOR FROM ( SELECT RTRIM(AR_CCODIGO) as AR_CCODIGO, AR_CDESCRI,'NUEVO' TIPO,'#00FF00' COLOR FROM RSFACCAR..AL0003ARTI READONLY  where AR_CCODIGO not in (select AR_CCODIGO from RSFACCAR..AL0003BLACKLIST )  UNION ALL SELECT RTRIM(AR_CCODIGO) as AR_CCODIGO, AR_CDESCRI,'ANTIGUO' TIPO,'#FF0000' COLOR FROM RSFACCAR..AL0003ARTI READONLY  where AR_CCODIGO  in (select AR_CCODIGO from RSFACCAR..AL0003BLACKLIST )  ) W ORDER BY W.AR_CDESCRI
        `;
        const result = await pool.request().query(sql);
        return result.recordset;
    },
    getCompras: async function (Data) {
        const pool = await poolPromise
        let result
        if (Data.Tipo == "Articulos") {
            result = await pool.request()
                .query("exec Cost_BusquedaCompra_Articulo '" + Data.Criterio.AR_CCODIGO + "'")
        } else {
            result = await pool.request()
                .query("exec Cost_BusquedaCompra_Proveedor '" + Data.Criterio.AC_CCODIGO + "'")
        }
        return result.recordset;
    },
    generarExcelVenta: async (params, rows) => {
        const rutaTemplateHC = "/template/ReporteVentas.xlsx";
        try {
            if (fs.existsSync(`.${rutaTemplateHC}`)) {
                fs.unlinkSync(`.${rutaTemplateHC}`)
            }
            workbook.xlsx.readFile("./template/Plantilla Ventas.xlsx").then(() => {
                return new Promise((resolve, reject) => {
                    let totalFacturadoSoles = 0;
                    let totalFacturadoDolares = 0
                    workbook.eachSheet(async (worksheet, sheetId) => {
                        try {

                            worksheet.name = "Reporte de Ventas"
                            worksheet.getCell("B3").value = `${moment(params.fechaInicio).format("DD/MM/YYYY")} Al ${moment(params.fechaFinal).format("DD/MM/YYYY")}`
                            let cellN = 7;
                            let cellP = 7;
                            for (let i = 0; i < rows.length; i++) {
                                const c = rows[i];
                                let bottom = 'thin'
                                if (typeof rows[i + 1] != "undefined") {
                                    if (c.TG_CDESCRI != rows[i + 1].TG_CDESCRI) {
                                        bottom = 'medium'
                                    }
                                } else {
                                    bottom = 'medium'
                                }

                                worksheet.getCell('B' + (cellN)).value = c.CL_CNOMCLI;
                                /* worksheet.getCell('B' + (cellN)).font = {
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
    */
                                worksheet.getCell('C' + (cellN)).value = c.AR_CUNIDAD;
                                /*  worksheet.getCell('C' + (cellN)).font = {
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
    */
                                worksheet.getCell('D' + (cellN)).value = c.F6_NCANTID;
                                /*   worksheet.getCell('D' + (cellN)).font = {
                                      name: 'Calibri',
                                      size: 8,
                                      bold: true
                                  }
                                  worksheet.getCell('D' + (cellN)).border = {
                                      top: { style: "thin" },
                                      left: { style: "medium" },
                                      bottom: { style: bottom },
                                      right: { style: "medium" }
                                  } */
                                worksheet.getCell('E' + (cellN)).value = c.BASESOL;
                                /*    worksheet.getCell('E' + (cellN)).font = {
                                       name: 'Calibri',
                                       size: 8,
                                       bold: true
                                   }
                                   worksheet.getCell('E' + (cellN)).border = {
                                       top: { style: "thin" },
                                       left: { style: "medium" },
                                       bottom: { style: bottom },
                                       right: { style: "medium" }
                                   } */
                                worksheet.getCell('F' + (cellN)).value = c.BASEDOL;
                                /*      worksheet.getCell('E' + (cellN)).font = {
                                         name: 'Calibri',
                                         size: 8,
                                         bold: true
                                     }
                                     worksheet.getCell('E' + (cellN)).border = {
                                         top: { style: "thin" },
                                         left: { style: "medium" },
                                         bottom: { style: bottom },
                                         right: { style: "medium" }
                                     } */
                                totalFacturadoDolares += c.BASEDOL
                                totalFacturadoSoles += c.BASESOL
                                if (c.active == true) {
                                    worksheet.mergeCells('A' + (cellP) + ':A' + (cellP + (c.rowspan - 1)))
                                    worksheet.getCell('A' + (cellP)).value = c.TG_CDESCRI
                                    /*  worksheet.getCell('A' + (cellP + (c.rowspan - 1)) + ':e' + (cellP + (c.rowspan - 1))).border = {
                                         bottom: { style: "medium" }
                                     } */
                                    worksheet.getCell('A' + (cellP)).alignment = {
                                        vertical: 'middle',
                                        horizontal: 'center'
                                    }
                                    cellP = cellP + c.rowspan;
                                }
                                cellN++
                            }
                            worksheet.getCell(`D${cellN}`).value = "TOTAL FACTURADO";
                            worksheet.getCell('D' + (cellN)).font = {
                                name: 'Calibri',
                                size: 8
                            }
                            worksheet.getCell(`E${cellN}`).value = totalFacturadoSoles;
                            worksheet.getCell(`E${cellN}`).
                                worksheet.getCell(`E${cellN}`).numFmt = "#,###.##"
                            worksheet.getCell('E' + (cellN)).font = {
                                name: 'Calibri',
                                size: 8
                            }
                            worksheet.getCell(`F${cellN}`).value = totalFacturadoDolares;
                            worksheet.getCell('F' + (cellN)).font = {
                                name: 'Calibri',
                                size: 8
                            }

                            setTimeout(() => resolve(), 2000);
                        } catch (error) {
                            console.log("Errror", error)
                        }

                    })
                }).then(async () => {
                    workbook.xlsx.writeFile(`.${rutaTemplateHC}`).then(() => {
                        console.log("xls file is wrrites")
                    })

                })
            })
            json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: `/supergen-be${rutaTemplateHC}`
            }
        } catch (err) {
            console.log('error :>> ', err);
            json = {
                success: false,
                message: "Error en el servidor => /Cartilla/ExportExcel",
                rutaCM: rutaTemplateHC
            }
        }
        return json;
    },
    traerReporteVenta: async (params) => {
        try {
            const pool = await poolPromise
            const results = await pool.request().query(`EXEC  DBO.SP_FILTRAVENTA_TODO '${moment(params.fechaInicio).format("DD/MM/YYYY")}', '${moment(params.fechaFinal).format("DD/MM/YYYY")}', '${params.idCliente.CL_CCODCLI}' `)
            //const results = await pool.request().query("exec SP_FILTRAVENTA_TODO '01/09/2020','30/09/2020','Todos'")
            let rowspan = 1;
            const resultMap = results.recordset.map((result, index, results) => {
                const nextResult = results[index + 1]
                if (nextResult && result.TG_CDESCRI == nextResult.TG_CDESCRI) {
                    rowspan++;
                } else {
                    result.rowspan = rowspan;
                    result.active = true
                    rowspan = 1;
                }
                return result;
            }).sort((a, b) => {
                let compare = 0;
                if (a.TG_CDESCRI == b.TG_CDESCRI) {
                    compare = 1
                }
                compare = -1;
                return compare;
            })

            return resultMap;
        } catch (error) {
            console.log("errr", error)
        }

    },
    consGranja: async function (Data) {
        const pool = await poolPromise
        const result = await pool.request()
            // .input('input_parameter', sql.Int, req.query.input_parameter)
            // .query('select * from mytable where id = @input_parameter')
            .query("exec Alm_Movim_Salidas '" + Data.FechaInicio + "','" + Data.FechaFin + "','0003','" + Data.Periodo + "'")
        let json = {
            result: result.recordset,
            length: result.recordset.length
        }
        return json;
    },
    consPlanta: async function (Data) {
        const pool = await poolPromise
        const result = await pool.request()
            // .input('input_parameter', sql.Int, req.query.input_parameter)
            // .query('select * from mytable where id = @input_parameter')
            .query("exec Alm_Movim_Salidas '" + Data.FechaInicio + "','" + Data.FechaFin + "','0004','" + Data.Periodo + "'")
        let json = {
            result: result.recordset,
            length: result.recordset.length
        }
        return json;
    },
    saveCartilla: async function (Data) {
        for (let i = 0; i < Data.length; i++) {
            const e = Data[i];
            if (e != null) {
                let row = await db.query(`SELECT * FROM
                datos_cartilla WHERE Periodo = ? and idLevante = ? `,
                    [e.Periodo, e.idLevante]);
                console.log('e :>> ', e);
                if (row.length == 0) {
                    await db.query(`INSERT INTO datos_cartilla(
            Periodo, idLevante, lote_str, quincena, findemes) VALUES(
                    ?,?,?,?,?)`, [e.Periodo, e.idLevante, e.lote_str, e.quincena, e.findemes]);
                } else {
                    await db.query(`UPDATE datos_cartilla SET
quincena = ?, findemes = ?
    WHERE Periodo = ? and idLevante = ? `,
                        [e.quincena, e.findemes, e.Periodo, e.idLevante]);
                }
            }
        }
        return {
            success: true,
            message: 'Se registró correctamente'
        }
    }
}
module.exports = DBCostsSG;