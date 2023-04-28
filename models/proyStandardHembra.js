const mysql = require("../dbconnectionPromise")

const { poolPromise } = require('../dbconnectionMSSQL')

const proyLoteDetalleModel = require("./proy_loteDetalle");
const Excel = require('exceljs')
const fs = require("fs")
const excelUtil = require("../utils/excel");

const workbook = new Excel.Workbook()
const proyStandardHembra = {

    guardar: async function (proyStandardHembra, userIdRegistro) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("insert into proy_standard_hembra(semana,idprod,porc_postura,porc_hi,porc_nacimiento,fec_reg,usuario_reg) values(?,?,?,?,?,?,?)", [proyStandardHembra.semana,
                1, proyStandardHembra.porc_postura, proyStandardHembra.porc_hi, proyStandardHembra.porc_nacimiento, new Date(), userIdRegistro])
            await connection.query("COMMIT")
        }
        catch (error) {
            throw error;
        } finally {
            await connection.release();

        }
    },
    importar: async function (excelRuta) {
        const connection = await mysql.connection();
        try {
            let errors = []
            let dataNoEncontrada = []
            const dataEncontradaA = []
            await connection.query("START TRANSACTION");

            const dataBd = await connection.query("select * from proy_standard_hembra where estado<>0 order by semana")
            const celdasConValidaciones = [
                { column: "A", validate: true, message: "Semana requerido", fn: function (valor) { return valor != null && !valor != undefined; }, field: "semana" },
                {
                    column: "B", validate: true, message: "Porcentaje postura requerido", fn: function (valor) { return valor != null && !valor != undefined; }, message: "", field: "porc_postura",
                },
                {
                    column: "C", validate: true, message: "Porcentaje huevos incubables requerido", fn: function (valor) { return valor != null && !valor != undefined; }, message: "", field: "porc_hi"
                },
                { column: "D", validate: true, message: "Porcentaje nacimiento requerido", field: "porc_nacimiento", fn: function (valor) { return valor != null && !valor != undefined; } },
            ];
            const data = await excelUtil.transformExcelAJson(excelRuta, celdasConValidaciones, 4, "Hoja1")
            for (const proyeccionStandar of data) {
                const dataEncontrada = dataBd.find(d => d.semana == proyeccionStandar.semana)
                if (!dataEncontrada) {
                    dataNoEncontrada.push({ ...proyeccionStandar })
                } else {
                    dataEncontradaA.push({ ...proyeccionStandar })
                }
            }
            const queryMapUpdate = dataEncontradaA.map(s => `update proy_standard_hembra set porc_postura=${s.porc_postura},porc_hi=${s.porc_hi},porc_nacimiento=${s.porc_nacimiento} where semana=${s.semana}`)
            if (queryMapUpdate.length > 0) {
                await connection.query(queryMapUpdate.join(";"))

            }
            await connection.query("COMMIT")
            return dataNoEncontrada

        } catch (error) {
            await connection.query("ROLLBACK")
            throw error

        } finally {
            await connection.release();

        }
    },
    exportarExcel: async function ({ data = [] }) {

        try {
            const rutaTemplateHC = `./template/Plantilla Exportacion Hembras.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/proyeccion hembras.xlsx`)) {
                fs.unlinkSync(`./template/proyeccion hembras.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            for (let i = 0; i < data.length; i++) {
                const dataActual = data[i]
                sheet.getCell("A" + (i + 4)).value = dataActual.semana
                sheet.getCell("A" + (i + 4)).border = borderStylesC
                sheet.getCell("A" + (i + 4)).alignment = alignmentStyle
                sheet.getCell("B" + (i + 4)).value = dataActual.porc_postura
                sheet.getCell("B" + (i + 4)).border = borderStylesC;
                sheet.getCell("B" + (i + 4)).alignment = alignmentStyle
                sheet.getCell("C" + (i + 4)).value = dataActual.porc_hi
                sheet.getCell("C" + (i + 4)).border = borderStylesC
                sheet.getCell("C" + (i + 4)).alignment = alignmentStyle
                sheet.getCell("D" + (i + 4)).value = dataActual.porc_nacimiento
                sheet.getCell("D" + (i + 4)).border = borderStylesC
                sheet.getCell("D" + (i + 4)).alignment = alignmentStyle

            }
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/proyeccion hembras.xlsx"
            }
            await workbook.xlsx.writeFile(`./template/proyeccion hembras.xlsx`)

            return json;


        } catch (error) {
            console.log(error)
            throw error;
        }

    },
    eliminar: async function (proyStandardHembraId) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update proy_standard_hembra set estado=0 where idStandardProyHembra=?", [proyStandardHembraId])
            await connection.query("COMMIT")
        }
        catch (error) {
            throw error;
        } finally {
            await connection.release();

        }
    },
    editar: async function (proyStandardHembra) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");
            await connection.query("update proy_standard_hembra set semana=?,porc_postura=?,porc_hi=?,porc_nacimiento=? where idStandardProyHembra=?", [proyStandardHembra.semana,
            proyStandardHembra.porc_postura, proyStandardHembra.porc_hi, proyStandardHembra.porc_nacimiento, proyStandardHembra.idStandardProyHembra])
            await connection.query("COMMIT")
        }
        catch (error) {
            throw error;
        } finally {
            await connection.release();

        }
    },
    proyectar: async function (listaProyingreso = [], usuarioRegId) {
        try {
            for (const proyIngreso of listaProyingreso) {
                await proyLoteDetalleModel.proyectar(proyIngreso, usuarioRegId)
            }
        }
        catch (error) {
            throw error;
        }
    },
    listar: async function () {
        const connection = await mysql.connection();
        try {
            return await connection.query("select * from proy_standard_hembra where estado<>0 order by semana")
        }
        catch (error) {
            throw error;
        } finally {
            await connection.release();

        }
    }
}
module.exports = proyStandardHembra;