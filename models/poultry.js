const axios = require('axios');
// var XLSX = require('xlsx')
var db = require('../dbconnection');
var uuid = require('uuid');
var fs = require('fs');
var Excel = require('exceljs');
var workbook = new Excel.Workbook();

let poultry = {
    formatDate: (params, signo) => {
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
        if (signo == '-') {
            hoy = dd + '-' + mm + '-' + yyyy;
        } else {
            hoy = dd + '/' + mm + '/' + yyyy;
        }
        return hoy;
    },
    getInfo: async (Lotes, urlPoultry) => {
        let array = [];
        for (let i = 0; i < Lotes.length; i++) {
            const e = Lotes[i];
            for (let i = 1; i < 4; i++) {
                await axios.get(urlPoultry + "batch_name=" + e.name + "&warehouse_name=" + "G" + i + "/" + e.galpon + "&week=" + e.semana)
                    .then(function (response) {
                        if (typeof response.data.error == "undefined") {
                            {
                                array[e.idLote] = response.data;
                            }
                        }
                    })
                    .catch(function (error) {
                        console.log("Existe ERROR **************", error);
                    })
            }
        }
        return array;
    },
    getInfoDelphus: async (Lotes) => {
        let array = [];
        for (let i = 0; i < Lotes.length; i++) {
            const l = Lotes[i];
            l.semana = parseInt(l.semana);
            let lote = await db.query(`SELECT * FROM lotes lo
            INNER JOIN galpones ga ON ga.idGalpon = lo.idGalpon
            INNER JOIN lineas li ON li.idLinea = lo.idLinea
            WHERE idLote = ?`, [l.idLote]);

            let namerow = "Peso" + lote[0].Sexo + "_" + lote[0].CodLinea

            lote[0].nroaves = 0;
            lote[0].promedio = 0;
            lote[0].nombregalpon = "G" + lote[0].Galpon + "/" + lote[0].lote;
            lote[0].nombregalponNac = "G" + lote[0].Galpon + "/" + lote[0].lote_str;
            lote[0].aves = [];

            let rowsSTD
            if (l.semana > 24) {
                rowsSTD = await db.query(`SELECT * FROM standard_prod_hembra li
                INNER JOIN standard_prod_macho lo ON lo.idprod = li.idprod  WHERE li.Semana = ?`, [l.semana]);
            } else {
                rowsSTD = await db.query("SELECT * FROM standard_levante WHERE Semana  = ? ", [l.semana]);
            }

            let STD = rowsSTD[0][namerow];
            let cons_pes = await db.query(`SELECT * FROM semanas
            INNER JOIN corrales ON semanas.idcorral = corrales.id 
            WHERE corrales.idlote = ? and semanas.semana = ? `, [l.idLote, l.semana]);
            let json = {
                Semana: l.semana,
                average_weight: 0,
                total_standar: STD,
                variance_coeficient: 0,
                uniformity: 0,
                standar_diff: 0
            }
            if (cons_pes.length != 0) {
                let aves = [];
                let suma = 0;
                for (let j = 0; j < cons_pes.length; j++) {
                    const pes = cons_pes[j];
                    pes.detalle = JSON.parse(pes.detalle);
                    for (let k = 0; k < pes.detalle.length; k++) {
                        const pd = pes.detalle[k];
                        suma = suma + pd;
                        aves.push(pd);
                    }
                }

                json.average_weight = suma / aves.length;

                let valormas10 = (json.average_weight * 0.1) + json.average_weight;

                let valormenos10 = json.average_weight - (json.average_weight * 0.1);

                let sumaDS = 0;
                let conteo = 0;
                for (var x = 0; x < aves.length; x++) {
                    const p = aves[x];
                    let valor = Math.pow((p - json.average_weight), 2);
                    sumaDS += valor;

                    if (p <= valormas10 && p >= valormenos10) {
                        conteo = conteo + 1;
                    }
                }
                let DS = Math.sqrt(sumaDS / (aves.length - 1));

                json.standar_diff = ((json.average_weight - STD) / STD) * 100
                json.uniformity = (conteo / aves.length) * 100;
                json.variance_coeficient = (DS / json.average_weight) * 100;
            }
            array[l.idLote] = json;
        }
        return array;
    },
    importarPesaje: async (Data) => {
        let filas = Data.filas;
        let lote = await db.query(`SELECT * FROM lotes lo
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE lo.idLote = ?`, [Data.idLote]);

        let observaciones = [];
        for (let i = 0; i < filas.length; i++) {
            const f = filas[i];
            let cons_corr = await db.query(`SELECT * FROM corrales 
            WHERE idlote = ? and corral = ?`, [Data.idLote, f.name])
            if (cons_corr.length != 0) {
                let idcorral = cons_corr[0].id;
                let cons_pesa = await db.query(`SELECT * FROM semanas
                WHERE idcorral = ? and semana = ?`, [idcorral, f.Semana])
                if (cons_pesa.length == 0) {
                    f.id = uuid.v4();
                    let valormas10 = (f.Promedio * 0.1) + f.Promedio;
                    let valormenos10 = f.Promedio - (f.Promedio * 0.1);
                    let sumaDS = 0;
                    let conteo = 0;
                    let arrayPeso = [];
                    for (var x = 0; x < f.data.length; x++) {
                        const p = f.data[x].Peso;
                        arrayPeso.push(p);
                        let valor = Math.pow((f.Promedio - p), 2);
                        sumaDS += valor;
                        if (p <= valormas10 && p >= valormenos10) {
                            conteo = conteo + 1;
                        }
                    }
                    f.Uniformidad = (conteo / f.data.length) * 100;
                    f.Dif_standard = ((f.Promedio - f.STD) / f.STD) * 100;
                    let DS = Math.sqrt(sumaDS / (f.data.length - 1));
                    f.Coef_de_var = (DS / f.Promedio) * 100;
                    await db.query(`INSERT INTO semanas (
                    id, semana, promedio, aves, idcorral, detalle, STD, Dif_standard, Uniformidad, Coef_de_var) 
                    values(?,?,?,?,?,?,?,?,?,?)`, [f.id, f.Semana, f.Promedio, f.data.length, idcorral,
                    JSON.stringify(arrayPeso), f.STD, f.Dif_standard, f.Uniformidad, f.Coef_de_var]);
                } else {
                    observaciones.push(`La semana ${f.Semana} para el corral ${f.name} ya existe.`)
                }
            } else {
                observaciones.push(`El corral ${f.name} no existe, la data para este corral no fue importada.`)
            }
        }
        if (observaciones.length == 0) {
            return {
                success: true,
                message: "Se realizo la importación correctamente.",
            }
        } else {
            return {
                success: false,
                message: "Se realizo la importación con observaciones.",
                observaciones
            }
        }
    },
    ExcelRA: async (Data) => {
        let rutaRA = "/template/RA.xlsx";
        if (fs.existsSync("./template/RA.xlsx")) {
            await fs.unlinkSync("./template/RA.xlsx")
        }
        let cons_lote = await db.query(`SELECT * FROM lotes lo 
        INNER JOIN lineas li ON li.idLinea = lo.idLinea
        WHERE idLote = ?`, [Data.idLote])
        let lote = cons_lote[0].lote;
        let CodLinea = cons_lote[0].CodLinea;
        let cons_corrales = await db.query(`SELECT * FROM semanas 
        INNER JOIN corrales ON corrales.id = semanas.idcorral
        WHERE corrales.idlote = ? and semana = ?`, [Data.idLote, Data.Semana])
        cons_corrales.sort((a, b) => {
            let corral_a = parseInt(a.corral.substr(1, a.corral.length));
            let corral_b = parseInt(b.corral.substr(1, b.corral.length));
            if (corral_a < corral_b) {
                return -1;
            } else if (corral_a > corral_b) {
                return 1;
            } else {
                return 0;
            }
        });

        const wor = await workbook.xlsx.readFile('./template/PlantillaRA.xlsx')
        const sheet = wor.worksheets[0];
        sheet.getCell('D7').value = lote
        sheet.getCell('G7').value = "SEMANA " + Data.Semana;
        sheet.getCell('N3').value = "Fecha : " + poultry.formatDate();
        sheet.getCell('K9').value = "Semana " + Data.Semana;
        sheet.getCell('K10').value = "Semana " + (parseInt(Data.Semana) + 1);
        sheet.name = "Semana " + Data.Semana;

        for (let i = 0; i < cons_corrales.length; i++) {
            const c = cons_corrales[i];
            sheet.getCell('A' + (i + 13)).value = CodLinea
            sheet.getCell('B' + (i + 13)).value = c.corral
            sheet.getCell('E' + (i + 13)).value = c.promedio
            sheet.getColumn('E').numFmt = '0'
            sheet.getCell('D' + (i + 13)).value = 0
            if (Data.Semana != '1') {
                let cons_corrales2 = await db.query(`SELECT * FROM supergen.semanas 
                INNER JOIN corrales ON corrales.id = semanas.idcorral
                WHERE idcorral = ? and semana = ?`, [c.idcorral, (parseInt(Data.Semana) - 1)])
                if (cons_corrales2.length != 0) {
                    sheet.getCell('D' + (i + 13)).value = cons_corrales2[0].promedio
                }
            }
            sheet.getCell('D' + (i + 13)).numFmt = '0'
            sheet.getCell('F' + (i + 13)).value = (c.promedio - sheet.getCell('D' + (i + 13)).value)
            sheet.getCell('F' + (i + 13)).numFmt = '0'
            sheet.getCell('G' + (i + 13)).value = c.Dif_standard
            sheet.getCell('G' + (i + 13)).numFmt = '0.0';
            sheet.getCell('H' + (i + 13)).value = c.Coef_de_var
            sheet.getCell('H' + (i + 13)).numFmt = '0.0';
            sheet.getCell('I' + (i + 13)).value = c.Uniformidad
            sheet.getCell('I' + (i + 13)).numFmt = '0.0';
        }
        sheet.mergeCells('A' + (cons_corrales.length + 13) + ':B' + (cons_corrales.length + 13));
        sheet.getCell('A' + (cons_corrales.length + 13)).value = 'Error Sexo'
        sheet.mergeCells('A' + (cons_corrales.length + 14) + ':B' + (cons_corrales.length + 14));
        sheet.getCell('A' + (cons_corrales.length + 14)).value = 'Pico deforme'
        await workbook.xlsx.writeFile("./template/RA.xlsx")
        /*       .then(async function (work) {
              return new Promise((resolve, reject) => {
                  workbook.eachSheet(async function (worksheet, sheetId) {
                      worksheet.getCell('D7').value = lote
                      worksheet.getCell('G7').value = "SEMANA " + Data.Semana;
                      worksheet.getCell('N3').value = "Fecha : " + poultry.formatDate();
                      worksheet.getCell('K9').value = "Semana " + Data.Semana;
                      worksheet.getCell('K10').value = "Semana " + (parseInt(Data.Semana) + 1);
                      worksheet.name = "Semana " + Data.Semana;
  
                      for (let i = 0; i < cons_corrales.length; i++) {
                          const c = cons_corrales[i];
                          worksheet.getCell('A' + (i + 13)).value = CodLinea
                          worksheet.getCell('B' + (i + 13)).value = c.corral
                          worksheet.getCell('E' + (i + 13)).value = c.promedio
                          worksheet.getColumn('E').numFmt = '0'
                          worksheet.getCell('D' + (i + 13)).value = 0
                          if (Data.Semana != '1') {
                              let cons_corrales2 = await db.query(`SELECT * FROM supergen.semanas 
                              INNER JOIN corrales ON corrales.id = semanas.idcorral
                              WHERE idcorral = ? and semana = ?`, [c.idcorral, (parseInt(Data.Semana) - 1)])
                              if (cons_corrales2.length != 0) {
                                  worksheet.getCell('D' + (i + 13)).value = cons_corrales2[0].promedio
                              }
                          }
                          worksheet.getCell('D' + (i + 13)).numFmt = '0'
                          worksheet.getCell('F' + (i + 13)).value = (c.promedio - worksheet.getCell('D' + (i + 13)).value)
                          worksheet.getCell('F' + (i + 13)).numFmt = '0'
                          worksheet.getCell('G' + (i + 13)).value = c.Dif_standard
                          worksheet.getCell('G' + (i + 13)).numFmt = '0.0';
                          worksheet.getCell('H' + (i + 13)).value = c.Coef_de_var
                          worksheet.getCell('H' + (i + 13)).numFmt = '0.0';
                          worksheet.getCell('I' + (i + 13)).value = c.Uniformidad
                          worksheet.getCell('I' + (i + 13)).numFmt = '0.0';
                      }
                      await worksheet.mergeCells('A' + (cons_corrales.length + 13) + ':B' + (cons_corrales.length + 13));
                      worksheet.getCell('A' + (cons_corrales.length + 13)).value = 'Error Sexo'
                      await worksheet.mergeCells('A' + (cons_corrales.length + 14) + ':B' + (cons_corrales.length + 14));
                      worksheet.getCell('A' + (cons_corrales.length + 14)).value = 'Pico deforme'
                      setTimeout(() => resolve(), 2000);
                  });
              }).then(data => {
                  workbook.xlsx.writeFile("./template/RA.xlsx").then(function () {
                      console.log("xls file is written.");
                  });
              }) */
        return {
            success: true,
            message: "Exportación realizada correctamente.",
            rutaRA
        };
    },
    getLotes: async () => {
        let lotes = await db.query(`SELECT * FROM lotes WHERE idLevante != 1 
        ORDER BY CorrelativoLote DESC`);
        for (let i = 0; i < lotes.length; i++) {
            const e = lotes[i];
            let cons_corrales = await db.query(`SELECT * FROM corrales 
            WHERE idlote = ?`, [e.idLote]);
            let rows4 = await db.query(`SELECT * 
            FROM nacimiento_det nd 
            INNER JOIN nacimiento na ON na.idNacimiento = nd.idNacimiento
            INNER JOIN lotes lo on lo.idLote = nd.idLote 
            WHERE nd.idLote = ? order by nd.fechaNacimiento DESC`, [e.idLote]);
            e.nacimientos = rows4.length;
            e.corrales = cons_corrales.length;
            e.galpones = 1;
        }
        return lotes;
    }
}
module.exports = poultry;