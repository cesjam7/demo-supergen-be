var db = require('../dbconnection');
var Excel = require('exceljs');
var XLSXChart = require("xlsx-chart");

var workbook = new Excel.Workbook();
const fs = require("fs");
const moment = require('moment');

var ReporteProduccion = {
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
    YearMonth: function (params) {
        if (typeof params == "undefined") {
            var hoy = new Date();
        } else {
            var hoy = new Date(params);
        }
        var mm = hoy.getMonth() + 1;
        var yyyy = hoy.getFullYear();

        if (mm < 10) {
            mm = '0' + mm;
        }

        return this.nombreMes(mm) + " " + yyyy;
    },
    formatDate: function (params, div) {
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
        hoy = dd + div + mm + div + yyyy;
        return hoy;
    },
    verifyExistReportProduction: async function () {
        let rows = await db.query(`SELECT * FROM reporte_produccion_logs WHERE date = ?`,
            [this.formatDate(new Date(), '-').split('-').reverse().join('-')]);
        if (rows.length == 0) {
            return true;
        } else {
            return false;
        }
    },
    saveLogReportProduction: async function () {
        let rows = await db.query(`INSERT INTO reporte_produccion_logs (date) VALUES (?)`, [new Date()]);
        return true;
    },
    obtainData: async function () {
        let cons_lotes_rp = await db.query(`SELECT * FROM variables_generales WHERE idVG = 2`);
        const produccionSeleccionados = await db.query(`SELECT * FROM produccion WHERE seleccionadoReporte=1`);
        const numeroSeleccionado = produccionSeleccionados.length
        let lotes_rp = 6
        if (cons_lotes_rp.length != 0) {
            lotes_rp = parseInt(cons_lotes_rp[0].valor)
        }
        let pos_title = ["B2", "L2", "V2", "B21", "L21", "V21"]
        let inicio = [["B", "C", "D", "E", "F", "G", "H", "I", "J"],
        ["L", "M", "N", "O", "P", "Q", "R", "S", "T"],
        ["V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD"],
        ["B", "C", "D", "E", "F", "G", "H", "I", "J"],
        ["L", "M", "N", "O", "P", "Q", "R", "S", "T"],
        ["V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD"]]
        let pos_al = ["J", "T", "AD", "J", "T", "AD"]
        let cons_data = await db.query(`SELECT * FROM variables_generales WHERE descripcion = 'rp${numeroSeleccionado * 2}'`)
        if (cons_data.length != 0) {
            let vlt = JSON.parse(cons_data[0].valorLongText)
            pos_title = JSON.parse(vlt.pos_title)
            inicio = JSON.parse(vlt.inicio)
            pos_al = JSON.parse(vlt.pos_al)
        }
        let lotes = await db.query(`SELECT * FROM lotes WHERE Sexo = 'H' and idProduccion in(?)
        GROUP BY lote_str ORDER BY CorrelativoLote DESC `, [produccionSeleccionados.map(p => p.idProduccion)])
        console.log("2", lotes)

        lotes.sort((a, b) => {
            if (a.CorrelativoLote < b.CorrelativoLote) {
                if (a.TipoGenero > b.TipoGenero) {
                    return 1
                } else {
                    return -1;
                }
            } else {
                if (a.TipoGenero > b.TipoGenero) {
                    return 1;
                } else {
                    return -1;
                }
            }
        });
        for (let i = 0; i < lotes.length; i++) {
            const l = lotes[i];
            let cons_semana = await db.query(`SELECT MAX(semana_prod) as semana_prod FROM mortalidad_prod_det 
            WHERE idLote = ${l.idLote}`)

            l.max_semana = 1;
            l.pos_title = pos_title[i];
            l.inicio = inicio[i];
            l.pos_al = pos_al[i];
            if (cons_semana.length != 0 && cons_semana[0] && cons_semana[0].semana_prod) {
                l.max_semana = cons_semana[0].semana_prod;
            }
            let cons_aves = await db.query(`SELECT * FROM mortalidad_prod_sem
            WHERE semana_prod = ${parseInt(l.max_semana) - 1} and idLote = ${l.idLote}`);
            l.naves = 0;
            l.ps_ant = 0;
            if (cons_aves.length != 0) {
                l.ps_ant = cons_aves[0].PorcMortalidadTot;
                l.naves = cons_aves[0].saldo_fin_sem
            }
            let mortalidad = await db.query(`SELECT * FROM mortalidad_prod_det 
            WHERE semana_prod = ${l.max_semana} and idLote = ${l.idLote}`);
            l.mortalidad = mortalidad;
            if (cons_aves.length == 0) {
                let sumME = 0
                for (let rh = 0; rh < l.mortalidad.length; rh++) {
                    const rhm = l.mortalidad[rh];
                    sumME += (rhm.NoAves + rhm.NoEliminados)
                }
                l.naves = l.Num_Aves_Fin_Levante - sumME
                l.ps_ant = 0
            }
            let alimento = await db.query(`SELECT STD, Ave_Dia_Gr FROM alimento_prod_sem 
            WHERE Semana = ${l.max_semana} and idLote = ${l.idLote}`)
            l.STD = 0;
            l.REAL = 0;
            if (alimento.length != 0) {
                l.STD = alimento[0].STD;
                l.REAL = alimento[0].Ave_Dia_Gr;
            }
            let phs = await db.query(`SELECT STD_Act_Avedia
            FROM produccion_huevos_sem WHERE semana_prod = ${l.max_semana} and IdLote = ${l.idLote}`)
            l.STDPROD = 0;
            if (phs.length != 0) {
                l.STDPROD = phs[0].STD_Act_Avedia;
            }
            let phs_ant = await db.query(`SELECT PorHI, Act_Avedia
            FROM produccion_huevos_sem WHERE semana_prod = ${parseInt(l.max_semana) - 1} and IdLote = ${l.idLote}`)
            l.PorHI = 0;
            l.PorDiario = 0;
            if (phs_ant.length != 0) {
                l.PorHI = phs_ant[0].PorHI;
                l.PorDiario = phs_ant[0].Act_Avedia;
            }
            let phd = await db.query(`SELECT * FROM produccion_huevos_det
            WHERE semana_prod = ${l.max_semana} and IdLote = ${l.idLote}`)
            l.phd = phd;
        }

        return {
            lotes,
            lotes_rp: numeroSeleccionado * 2
        }
    },
    reportProduction: async function () {
        return new Promise(async (resolve, reject) => {
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }
            const fillLH = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "F8CBAD"
                }
            }
            const fillLm = {
                type: "pattern",
                pattern: "solid",

                fgColor: {
                    argb: "DAE3F3"
                }
            }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            let verify = await this.verifyExistReportProduction();
            if (!verify) {
                resolve({
                    success: false,
                    message: "El Reporte de Produccion del mes actual, ya ha sido enviado."
                })
            }


            let rutaRP = "/template/RP.xlsx";
            if (fs.existsSync("./template/RP.xlsx")) {
                fs.unlinkSync("./template/RP.xlsx")
            }
            let od = await this.obtainData()
            let data = od.lotes
            let lotes_rp = od.lotes_rp
            const dataExcel = fs.readFileSync(`./template/PlantillaRP${lotes_rp}.xlsx`);
            const wor = await workbook.xlsx.load(dataExcel)
            // const wor = await workbook.xlsx.readFile(`./template/PlantillaRP${lotes_rp}.xlsx`)
            const sheet = wor.worksheets[0];
            let totalHuevosIncubablesPorFecha = []
            sheet.name = "LOTES PROD " + ReporteProduccion.formatDate(new Date(), '-');
            for (let i = 0; i < data.length; i++) {
                let porcentajeDiarioIndexFormula = 0;

                const d = data[i];
                let pos = 2;
                let pos_det = 8;
                if (i >= (lotes_rp / 2)) {
                    pos = 21;
                    pos_det = 27;
                }

                let titulo = `${d.lote_str}: Edad ${parseInt(d.max_semana) + 24} Sem`
                sheet.getCell(d.pos_title).value = titulo;
                sheet.getCell(d.pos_al + pos).value = d.STD;
                sheet.getCell(d.pos_al + (pos + 1)).value = d.REAL;
                sheet.getCell(d.pos_al + (pos + 2)).value = (d.STDPROD / 100);
                for (let j = 0; j < d.mortalidad.length; j++) {
                    const m = d.mortalidad[j];
                    let fechaMoment = moment(m.fecha, "YYYY-MM-DD", true);
                    const ph = d.phd[j];
                    if (j == 0) {
                        sheet.getCell(d.inicio[0] + (pos_det)).value = m.fecha;
                        let div = (sheet.getCell(d.inicio[1] + (pos_det)).value.formula).split('-');
                        let formula = { formula: d.naves + "-" + div[1] + "-" + div[2] }
                        sheet.getCell(d.inicio[1] + (pos_det)).value = formula
                    }
                    sheet.getCell(d.inicio[2] + (pos_det + j)).value = m.NoAves;
                    sheet.getCell(d.inicio[3] + (pos_det + j)).value = m.NoEliminados;
                    if (typeof ph != "undefined") {
                        sheet.getCell(d.inicio[5] + (pos_det + j)).value = ph.TotalDiarioProd_Huevo;
                        if (j > 1) {
                            porcentajeDiarioIndexFormula++;
                        }
                        sheet.getCell(d.inicio[6] + (pos_det + j)).value = { formula: `+(${d.inicio[5] + (pos_det + j)}/${d.inicio[1] + (pos_det + porcentajeDiarioIndexFormula)})` };
                        sheet.getCell(d.inicio[7] + (pos_det + j)).value = ph.TotalHI;
                        sheet.getCell(d.inicio[8] + (pos_det + j)).value = { formula: `+(${d.inicio[7] + (pos_det + j)}/${d.inicio[5] + (pos_det + j)}*100)` };
                        const indexHuevosIncubables = totalHuevosIncubablesPorFecha.findIndex(huevosIncubables => huevosIncubables.fecha == fechaMoment.format("YYYY-MM-DD") && huevosIncubables.TipoGenero == d.TipoGenero);

                        if (indexHuevosIncubables != -1) {
                            const huevoIncuable = totalHuevosIncubablesPorFecha[indexHuevosIncubables]
                            totalHuevosIncubablesPorFecha[indexHuevosIncubables] = { ...huevoIncuable, total: huevoIncuable.total + ph.TotalHI }
                        } else {
                            totalHuevosIncubablesPorFecha.push({ fecha: fechaMoment.format("YYYY-MM-DD"), total: ph.TotalHI, TipoGenero: d.TipoGenero })
                        }
                    } else {
                        sheet.getCell(d.inicio[5] + (pos_det + j)).value = 0;
                        sheet.getCell(d.inicio[7] + (pos_det + j)).value = 0;
                    }
                    fechaMoment.add(1, "day")
                }
                sheet.getCell(d.inicio[4] + (pos_det + 10)).value = d.ps_ant;
                sheet.getCell(d.inicio[6] + (pos_det + 10)).value = d.PorDiario;
                sheet.getCell(d.inicio[8] + (pos_det + 10)).value = d.PorHI;

            }
            const groupForDate = totalHuevosIncubablesPorFecha.reduce((prev, cur) => {
                if (!prev.find(p => p.fecha == cur.fecha)) {
                    const { fecha, total } = totalHuevosIncubablesPorFecha.find(t => t.fecha == cur.fecha && t.TipoGenero == "LH");
                    const { total: totalLm = 0 } = totalHuevosIncubablesPorFecha.find(t => t.fecha == cur.fecha && t.TipoGenero == "LM") || {};

                    prev.push({ fecha: fecha, totalLh: total, totalLm: totalLm })
                }
                return prev
            }, [])
            for (let k = 0; k < groupForDate.length; k++) {
                const totalHuevosIncubablesPorFechaActual = groupForDate[k]
                sheet.getCell("B" + (k + 42)).value = totalHuevosIncubablesPorFechaActual.fecha
                sheet.getCell("B" + (k + 42)).border = borderStylesC
                sheet.getCell("B" + (k + 42)).alignment = alignmentStyle

                sheet.getCell("C" + (k + 42)).value = totalHuevosIncubablesPorFechaActual.totalLm
                sheet.getCell("C" + (k + 42)).border = borderStylesC
                sheet.getCell("C" + (k + 42)).fill = fillLm
                sheet.getCell("C" + (k + 42)).alignment = alignmentStyle

                sheet.getCell("D" + (k + 42)).value = totalHuevosIncubablesPorFechaActual.totalLh
                sheet.getCell("D" + (k + 42)).border = borderStylesC
                sheet.getCell("D" + (k + 42)).fill = fillLH
                sheet.getCell("D" + (k + 42)).alignment = alignmentStyle
            }
            await wor.xlsx.writeFile("./template/RP.xlsx");



            resolve({
                success: true,
                message: "Exportación realizada correctamente.",
                rutaRP
            })
            /*       for (let index = 0; index < totalHuevosIncubablesPorFecha.length; index++) {
                      const totalHuevoIncubablesActual = totalHuevosIncubablesPorFecha[index]
                      sheet.getCell("AY" + (index + 8)).value = totalHuevoIncubablesActual.fecha;
                      sheet.getCell("AZ" + (index + 8)).value = totalHuevoIncubablesActual.total;
                  }
      
                  await wor.xlsx.writeFile("./template/RP.xlsx");
                  resolve({
                      success: true,
                      message: "Exportación realizada correctamente.",
                      rutaRP
                  }) */
        })

    }
}
module.exports = ReporteProduccion;
