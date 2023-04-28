var db = require('../dbconnection');
var Aviagen = require('./Aviagen');
const mysql = require("../dbconnectionPromise")

var ReporteProduccion = require('./ReporteProduccion');
const xlsx = require("xlsx")
const fs = require("fs")

var nodemailer = require('nodemailer');
const { send } = require('process');

let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'infosupergen@gmail.com',
        pass: 'svzqmnuzrgfjgslk'
    },
});

var sendEmail = {
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
    obtainDate: function (params) {
        if (typeof params == "undefined") {
            var hoy = new Date();
        } else {
            var hoy = new Date(params);
        }
        var dd = hoy.getDate();
        if (dd < 10) {
            dd = '0' + dd;
        }
        return dd;
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
    doActivity: async function () {
        try {
            let date = new Date();
            let today = date.getDate();
            let lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            let LastDay = lastDate.getDate();
            if (today == LastDay) {
                await this.reportAvigen();
            }
            let RP = await ReporteProduccion.reportProduction();
            if (!RP.success) {
                return;
            }
            await this.reportProduction(RP);

        } catch (error) {
            console.log("error", error)
            throw error;
        }

    },
    sendEmail: (subject, destinatarios, html = "", from = '"Supergen SA" <infosupergen@gmail.com>', attachments = []) => {
        return transporter.sendMail({
            from,
            subject,
            to: destinatarios,
            html,
            attachments: attachments
        })
    },
    destinatariosPorTipo: async function (tipo) {
        const connection = await mysql.connection();
        const data = await connection.query("select * from destinatarioGenerico where tipo=? and estado=1", [tipo]);
        await connection.release();
        return data;

    },

    reportProduction: async function (RP) {
        let array = [];
        if (fs.existsSync("." + RP.rutaRP)) {
            let RP_file = await fs.readFileSync("." + RP.rutaRP)
            array.push({
                filename: "RP.xlsx",
                content: RP_file,
            })
        }
        let destinatarios = await this.obtenerDestinatarios();
        transporter.sendMail({
            from: '"Supergen SA" <infosupergen@gmail.com>',
            to: destinatarios,
            subject: 'Reporte de Producción ' + this.obtainDate(new Date()) + " de " + this.YearMonth(new Date()),
            text: 'En el presente correo, se adjuntan los lotes con sus registros de las últimas semanas.',
            attachments: array
        }).then(async (res) => {
            let slra = await ReporteProduccion.saveLogReportProduction()
            if (slra == true) {
                console.log("Enviando correo con el reporte de producción");
            }
        }).catch((err) => {
            console.log('err :>> ', err);
        })
    },
    verifyTemperature: async function () {
        console.log("temperature verified");
    },
    verifyHumidity: async function () {
        console.log("humidity verified");
    },
    reportAvigen: async function () {
        let verify = await this.verifyExistReportAviagen();
        if (verify == true) {
            let carpeta = './temp/'
            if (!fs.existsSync(carpeta)) {
                await fs.mkdirSync(carpeta);
            }
            let lev = await Aviagen.LOP_L({ Tipo: 'Levante' })
            let rutaLev = "Aviagen-Levante " + this.formatDate(new Date(), '-') + ".xlsx"
            console.log('lev.tabla :>> ', lev.tabla.length);
            if (lev.tabla != 0) {
                var files = []
                for (each in lev.tabla) { files.push(lev.tabla[each]) };
                var obj = files.map((e) => { return e })

                const myHeader = ["Granja", "Galpon", "lote", "CodLinea", "fecha", "Semana", "NumHembras", "saldo_fin_sem",
                    "NoAves", "PorcMortalidad", "PorcAcumMortalidad", "SelGen", "PorcSelGen", "PorcAcumSelGen",
                    "ErSex", "PorcErSex", "PorcAcumErSex", "NoEliminados", "PorcEliminados", "PorcAcumEliminados",
                    "PorcMortalidadTot", "CantAlimentoSem", "CantAcumAlimento", "CantRealAlimento",
                    "CantIncreAlimento", "STD", "descripAlimento", "peso_actual", "peso_standard",
                    "peso_dif", "uniformidad", "ganancia_real", "ganancia_std", "Coef_V"];

                let s = {
                    fill: {
                        fgColor: {
                            rgb: "e30512"
                        }
                    }
                };

                var wb = xlsx.utils.book_new()
                var ws = await xlsx.utils.json_to_sheet(obj, { header: myHeader })
                const range = xlsx.utils.decode_range(ws['!ref']);
                range.e['c'] = range.e['c'] - 4;
                ws['!ref'] = xlsx.utils.encode_range(range);

                ws.A1.v = "Granja"
                ws.B1.v = "Galpon"
                ws.C1.v = "Lote"
                ws.D1.v = "Línea"
                ws.E1.v = "Fecha"
                ws.F1.v = "Edad"
                ws.G1.v = "Nº AVES INICIADAS"
                ws.H1.v = "N° Aves Fin Sem."
                ws.I1.v = "Total Sem.Mort"
                ws.J1.v = "%Mort. Sem."
                ws.K1.v = "%Mort. Acum."
                ws.L1.v = "Selección Genetica"
                ws.M1.v = "Selección Genetica%"
                ws.N1.v = "Selección Genetica%Acum."
                ws.O1.v = "SexErrN° Aves"
                ws.P1.v = "SexErr%"
                ws.Q1.v = "SexErr%Acum."
                ws.R1.v = "DescN° Aves"
                ws.S1.v = "Desc%"
                ws.T1.v = "Desc%Acum."
                ws.U1.v = "Morta%Tot. Acum."
                ws.V1.v = "Kilos Sem."
                ws.W1.v = "Acum. Kilos"
                ws.X1.v = "Real Grs/Ave"
                ws.Y1.v = "Incre. Gra/Ave"
                ws.Z1.v = "alimentoStandard"
                ws.AA1.v = "Tipo de Alimentos"
                ws.AB1.v = "Actual"
                ws.AC1.v = "STD"
                ws.AD1.v = "Dif %"
                ws.AE1.v = "Uniform."
                ws.AF1.v = "Ganan. Real"
                ws.AG1.v = "Ganan. STD"
                ws.AH1.v = "Coef. V."

                await xlsx.utils.book_append_sheet(wb, ws, "Levante")
                await xlsx.writeFileSync(wb, carpeta + rutaLev)
            }
            let prod = await Aviagen.LOP_P({ Tipo: 'Produccion' })
            let rutaProd = "Aviagen-Produccion " + this.formatDate(new Date(), '-') + ".xlsx"
            console.log('prod.tabla :>> ', prod.tabla.length);
            if (prod.tabla != 0) {
                var files = []
                for (each in prod.tabla) { files.push(prod.tabla[each]) };
                var obj = files.map((e) => { return e })

                const myHeader = ["Granja", "Galpon", "lote_str", "fecha", "Semana", "NumHembras", "NumMachos", "NoAves",
                    "NoAves_M", "PorcMortalidad", "PorcAcumMortalidad", "PorcMortalidad_M", "PorcAcumMortalidad_M",
                    "PTH", "PTH_Acum", "Acum_x_Gall", "STD_Gall", "AveDiaSem", "AveDiaSTD", "PorHI", "TotalHI",
                    "TotalHI_Acum", "Acum_Galle_Enca", "STD_HI", "HemGr", "IncreHemGr", "SemKilos", "SemKilos_Acum",
                    "AveDiaGrHem", "STDHem", "MacGr", "IncreMacGr", "SemKilos_M", "SemKilos_Acum_M", "AveDiaGrMac",
                    "STDMac", "NoEliminados_HEM", "NoEliminados_HEM_Acum", "NoEliminados_MAC",
                    "NoEliminados_MAC_Acum", "Peso_HEM", "STD_HEM", "DIF_HEM", "Peso_MAC", "STD_MAC", "DIF_MAC",
                    "Huevos_SEM", "Huevos_STD", "Huevos_DIF", "Huevos_MASA_SEM", "Huevos_MASA_STD"];

                var wb = xlsx.utils.book_new()
                var ws = await xlsx.utils.json_to_sheet(obj, { header: myHeader })
                const range = xlsx.utils.decode_range(ws['!ref']);
                range.e['c'] = range.e['c'] - 8;
                ws['!ref'] = xlsx.utils.encode_range(range);

                ws.A1.v = "Granja"
                ws.B1.v = "Galpón"
                ws.C1.v = "Lote"
                ws.D1.v = "Fecha"
                ws.E1.v = "Edad"
                ws.F1.v = "N° Aves_Hembra"
                ws.G1.v = "N° Aves_Macho"
                ws.H1.v = "Mortal_Hembra"
                ws.I1.v = "Mortal_Macho"
                ws.J1.v = "Mort % HEM SEM"
                ws.K1.v = "Mort% HEM AC"
                ws.L1.v = "Mort% MAC SEM"
                ws.M1.v = "Mort% MAC AC"
                ws.N1.v = "Prod_tot_Huevo_Semana"
                ws.O1.v = "Prod_tot_Huevo_Acum."
                ws.P1.v = "Prod_tot_Huevo_Acum. x Gall."
                ws.Q1.v = "Prod_tot_Huevo_STD ACU. GALL"
                ws.R1.v = "Prod_tot_Huevo_% ACT. AVE/DIA Prod_tot_Huevo_SEM"
                ws.S1.v = "Prod_tot_Huevo_% ACT. AVE/DIA STD"
                ws.T1.v = "Prod_Huevo_Incubable_% HUE. INCUB."
                ws.U1.v = "Prod_Huevo_Incubable_H. INCUB. PROD. SEM"
                ws.V1.v = "Prod_Huevo_Incubable_H. INCUB. PROD. ACUM."
                ws.W1.v = "Prod_Huevo_Incubable_ACUM. GALL. ENCASE"
                ws.X1.v = "Prod_Huevo_Incubable_STD HUEVO INC"
                ws.Y1.v = "Consumo_Alimento_Hembra_HEM. Grs."
                ws.Z1.v = "Consumo_Alimento_Hembra_INC HEM. Grs."
                ws.AA1.v = "Consumo_Alimento_Hembra_SEM. KILOS HEMBRA"
                ws.AB1.v = "Consumo_Alimento_Hembra_ACUM. KILOS HEMBRA"
                ws.AC1.v = "Consumo_Alimento_Hembra_AVE /DIA Grs. HEMBRA"
                ws.AD1.v = "Consumo_Alimento_Hembra_STD. HEM"
                ws.AE1.v = "Consumo_Alimento_Macho_MAC Grs."
                ws.AF1.v = "Consumo_Alimento_Macho_INC MAC. Grs."
                ws.AG1.v = "Consumo_Alimento_Macho_SEM. KILOS MACHO"
                ws.AH1.v = "Consumo_Alimento_Macho_ACUM. KILOS MACHO"
                ws.AI1.v = "Consumo_Alimento_Macho_AVE /DIA Grs. MACHO"
                ws.AJ1.v = "Consumo_Alimento_Macho_STD. MAC"
                ws.AK1.v = "Descarte_HEM"
                ws.AL1.v = "Descarte_ACUM HEM"
                ws.AM1.v = "Descarte_MAC"
                ws.AN1.v = "Descarte_ACUM MAC"
                ws.AO1.v = "Peso_gramos_HEM"
                ws.AP1.v = "Peso_gramos_STD HEM"
                ws.AQ1.v = "Peso_gramos_DIF HEM vs STD HEM"
                ws.AR1.v = "Peso_gramos_MAC"
                ws.AS1.v = "Peso_gramos_STD MAC"
                ws.AT1.v = "Peso_gramos_DIF MAC vs STD MAC"
                ws.AU1.v = "Peso_Huevo_SEM"
                ws.AV1.v = "Peso_Huevo_STD"
                ws.AW1.v = "Peso_Huevo_DIF vs STD"
                ws.AX1.v = "MasaHuevo_SEM"
                ws.AY1.v = "MasaHuevo_STD"

                await xlsx.utils.book_append_sheet(wb, ws, "Producción")
                await xlsx.writeFileSync(wb, carpeta + rutaProd)
            }

            let array = [];
            if (fs.existsSync(carpeta + rutaLev)) {
                let levR = await fs.readFileSync(carpeta + rutaLev)
                array.push({
                    filename: rutaLev,
                    content: levR,
                })
            }
            if (fs.existsSync(carpeta + rutaProd)) {
                let prodR = await fs.readFileSync(carpeta + rutaProd)
                array.push({
                    filename: rutaProd,
                    content: prodR,
                })
            }
            if (array.length != 0) {
                let destinatarios = await this.obtenerDestinatarios();
                await transporter.sendMail({
                    from: '"Supergen SA" <infosupergen@gmail.com>',
                    to: destinatarios,
                    subject: 'Reporte de Levante y Producción ' + this.YearMonth(new Date()) + ' - Aviagen',
                    text: 'En el presente correo, se adjunta las últimas semanas de todos los lotes de Levante y Producción del periodo ' + this.YearMonth(new Date()) + ', que deben ser enviados a Aviagen',
                    attachments: array
                }).then(async (res) => {
                    lev.idUser = 1;
                    prod.idUser = 1;
                    if (fs.existsSync(carpeta + rutaLev)) {
                        await Aviagen.ExportExcel(lev)
                        await fs.unlinkSync(carpeta + rutaLev)
                    }
                    if (fs.existsSync(carpeta + rutaProd)) {
                        await Aviagen.ExportExcel(prod)
                        await fs.unlinkSync(carpeta + rutaProd)
                    }
                    let slra = await this.saveLogReportAviagen()
                    if (slra == true) {
                        console.log("Enviando correo con el reporte de Aviagen");
                    }
                }).catch((err) => {
                    console.log('err :>> ', err);
                })
            }
        } else {
            console.log('El Reporte de Aviagen del mes actual, ya ha sido enviado.');
        }
    },
    verifyExistReportAviagen: async function () {
        let rows = await db.query("SELECT * FROM aviagen_logs WHERE date = ?",
            [this.formatDate(new Date(), '-').split('-').reverse().join('-')]);

        if (rows.length == 0) {
            return true;
        } else {
            return false;
        }
    },
    saveLogReportAviagen: async function () {
        let rows = await db.query(`INSERT INTO aviagen_logs (date) VALUES (?)`, [new Date()]);
        return true;
    },
    obtenerDestinatarios: async function () {
        let rows = await db.query(`SELECT * FROM destinatarios WHERE Estado = '1'`);
        let array = [];
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            array.push(e.email)
        }
        return array;
    },
    async destinatariosGranja() {
        let rows = await db.query(`SELECT email FROM destinatarios_granja WHERE state=1`);
        let array = [];
        for (let i = 0; i < rows.length; i++) {
            const e = rows[i];
            array.push(e.email)
        }
        return array;
    },
    async sendWeekReport(poolPromise) {
        let destinatarios = await this.destinatariosGranja();
        if (destinatarios.length == 0) {
            return;
        }
        let date = new Date();
        if (date.getDate() < 8) {
            date.setMonth(date.getMonth() - 1);
        }
        let month = date.getMonth() + 1;
        var Excel = require('exceljs');
        const pool = await poolPromise;
        const resultQuery = await pool.query(`exec Lista_Movim_Alimento ${date.getFullYear()},${month}`);
        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile("./template/PLANTILLA-REPORTE-ALIMENTOS.xlsx");
        const sheet = workbook.getWorksheet(1);
        const cells = {
            A: "C5_CNUMDOC",
            B: "C5_DFECDOC",
            C: "C5_CGLOSA1",
            D: "C5_CNOMPRO",
            E: "C5_CRFNDOC",
            F: "C5_DFECDOC",
            G: "C5_CNUMAJUSTE",
            H: "C5_USUARIOAJ",
            I: "C5_DFECAJUSTE",
            J: "C5_USUARIOAPROBA",
            K: "C5_DFECAPROBACION",
            L: "C5_USUARIOREAPERTURA",
            M: "C5_DFECREAPERTURA"
        };
        let index = 2;
        const border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        for (let row of resultQuery.recordset) {
            for (let c in cells) {
                let cell = sheet.getCell(`${c}${index}`);
                cell.value = row[cells[c]];
                cell.border = border;
            }
            index++;
        }
        console.log("destinatarios", destinatarios)
        const buffer = await workbook.xlsx.writeBuffer();

        await transporter.sendMail({
            from: '"Supergen SA" <infosupergen@gmail.com>',
            to: destinatarios,
            subject: 'Reporte de alimentos ' + this.obtainDate(new Date()) + " de " + this.YearMonth(new Date()),
            text: 'En el presente correo, se adjunta el reporte de alimentos.',
            attachments: [
                {
                    filename: 'reporte.xlsx',
                    content: buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            ]
        });

    }
}
module.exports = sendEmail;
