const db = require('../dbconnection');
const { poolPromise } = require('../dbconnectionMSSQL');
const sendEmail = require('./sendEmail');
const usuario = require('./usuario');
const moment = require("moment");
var Excel = require('exceljs');

var workbook = new Excel.Workbook();

var fs = require('fs');
const logisticaConsultaModel = {
    async listarOrdenServicio({ fechaInicio = moment().format("YYYY-MM-DD"), fechaFin = moment().format("YYYY-MM-DD") }) {
        try {
            const pool = await poolPromise;
            const data = await pool.query(`exec Lista_ordenservicio '${moment(fechaInicio).format("DD/MM/YYYY")}','${moment(fechaFin).format("DD/MM/YYYY")}'`);
            return data.recordset;
        } catch (error) {
            console.error("e", error)
            throw error;
        }

    },
    crearExcelDeUnaFechaAdelante: async function (fechaInicio) {
        try {
            const rutaTemplateHC = `./template/PlantillaOrdenServicio.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/orden servicio correo.xlsx`)) {
                fs.unlinkSync(`./template/orden servicio correo.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            const fechaInicioMoment = moment(fechaInicio);
            const fechaFinMoment = moment()
            const pool = await poolPromise;
            const data = (await pool.query(`exec Lista_ordenservicio '${fechaInicioMoment.format("DD/MM/YYYY")}','${fechaFinMoment.format("DD/MM/YYYY")}'`)).recordset;
            sheet.getRow(4).getCell(2).value = fechaInicioMoment.format("YYYY-MM-DD") + " Al " + fechaFinMoment.format("YYYY-MM-DD")
            for (let i = 0; i < data.length; i++) {
                const dataActual = data[i]
                const row = sheet.getRow(i + 9);
                row.getCell(1).value = dataActual.OC_CCODPRO
                row.getCell(1).border = borderStylesC
                row.getCell(1).alignment = alignmentStyle

                row.getCell(2).value = dataActual.AC_CNOMBRE
                row.getCell(2).border = borderStylesC
                row.getCell(2).alignment = alignmentStyle

                row.getCell(3).value = dataActual.OC_CNUMORD
                row.getCell(3).border = borderStylesC
                row.getCell(3).alignment = alignmentStyle

                row.getCell(4).value = dataActual.OC_CCODMON
                row.getCell(4).border = borderStylesC
                row.getCell(4).alignment = alignmentStyle

                row.getCell(5).value = moment(dataActual.OC_DFECDOC).format("DD/MM/YYYY")
                row.getCell(5).border = borderStylesC
                row.getCell(5).alignment = alignmentStyle


                row.getCell(6).value = dataActual.OC_CDESREF
                row.getCell(6).border = borderStylesC
                row.getCell(6).alignment = alignmentStyle

                row.getCell(7).value = dataActual.OC_COMENTA
                row.getCell(7).border = borderStylesC
                row.getCell(7).alignment = alignmentStyle

                row.getCell(8).value = dataActual.TG_CDESCRI
                row.getCell(8).border = borderStylesC
                row.getCell(8).alignment = alignmentStyle
            }
            await workbook.xlsx.writeFile(`./template/orden servicio correo.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "./template/orden servicio correo.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
        }
    },
    consultaArticulos: async function () {
        const pool = await poolPromise;
        const { recordset } = await pool.query(`SELECT AR_CCODIGO as codigo,AR_CDESCRI as descripcion,AR_CUNIDAD as unidad,ISNULL(RTRIM(ALTABL38.TG_CDESCRI), '') familia 
        FROM RSFACCAR..AL0003ARTI READONLY 
        LEFT OUTER JOIN RSFACCAR..AL0003TABL ALTABL38 ON ALTABL38.TG_CCOD='38' AND ALTABL38.TG_CCLAVE=AR_CFAMILI
            WHERE AR_CCODIGO NOT IN (SELECT A.AR_CCODIGO FROM RSFACCAR..AL0003BLACKLIST A)
                             ORDER BY AR_CDESCRI
        `);
        return recordset;
    },
    exportarConsultaArticulos: async function () {
        try {
            const data = await this.consultaArticulos()
            const rutaTemplateHC = `./template/plantilla logistica consulta articulos.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/consulta articulos.xlsx`)) {
                fs.unlinkSync(`./template/consulta articulos.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];

            for (let i = 0; i < data.length; i++) {
                const dataActual = data[i]
                sheet.getCell(`C${i + 5}`).value = dataActual.codigo
                sheet.getCell(`C${i + 5}`).border = borderStylesC
                sheet.getCell(`C${i + 5}`).alignment = alignmentStyle

                sheet.getCell(`D${i + 5}`).value = dataActual.descripcion
                sheet.getCell(`D${i + 5}`).border = borderStylesC
                sheet.getCell(`D${i + 5}`).alignment = alignmentStyle

                sheet.getCell(`E${i + 5}`).value = dataActual.unidad
                sheet.getCell(`E${i + 5}`).border = borderStylesC
                sheet.getCell(`E${i + 5}`).alignment = alignmentStyle

                sheet.getCell(`F${i + 5}`).value = dataActual.familia
                sheet.getCell(`F${i + 5}`).border = borderStylesC
                sheet.getCell(`F${i + 5}`).alignment = alignmentStyle

            }
            await workbook.xlsx.writeFile(`./template/consulta articulos.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/consulta articulos.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
        }


    },
    exportarExcelOrdenServicio: async function ({ fechaInicio, fechaFin, data = [] }) {
        try {
            const rutaTemplateHC = `./template/PlantillaOrdenServicio.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/orden servicio.xlsx`)) {
                fs.unlinkSync(`./template/orden servicio.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            const fechaInicioMoment = moment(fechaInicio);
            const fechaFinMoment = moment(fechaFin)
            sheet.getRow(4).getCell(2).value = fechaInicioMoment.format("YYYY-MM-DD") + " Al " + fechaFinMoment.format("YYYY-MM-DD")
            for (let i = 0; i < data.length; i++) {
                const dataActual = data[i]
                const row = sheet.getRow(i + 9);
                row.getCell(1).value = dataActual.OC_CCODPRO
                row.getCell(1).border = borderStylesC
                row.getCell(1).alignment = alignmentStyle

                row.getCell(2).value = dataActual.AC_CNOMBRE
                row.getCell(2).border = borderStylesC
                row.getCell(2).alignment = alignmentStyle

                row.getCell(3).value = dataActual.OC_CNUMORD
                row.getCell(3).border = borderStylesC
                row.getCell(3).alignment = alignmentStyle

                row.getCell(4).value = dataActual.OC_CCODMON
                row.getCell(4).border = borderStylesC
                row.getCell(4).alignment = alignmentStyle

                row.getCell(5).value = moment(dataActual.OC_DFECDOC).format("DD/MM/YYYY")
                row.getCell(5).border = borderStylesC
                row.getCell(5).alignment = alignmentStyle

                row.getCell(6).value = dataActual.OC_CDESREF
                row.getCell(6).border = borderStylesC
                row.getCell(6).alignment = alignmentStyle


                row.getCell(7).value = dataActual.OC_COMENTA
                row.getCell(7).border = borderStylesC
                row.getCell(8).alignment = alignmentStyle

                row.getCell(8).value = dataActual.TG_CDESCRI
                row.getCell(8).border = borderStylesC
                row.getCell(8).alignment = alignmentStyle




            }
            await workbook.xlsx.writeFile(`./template/orden servicio.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/orden servicio.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
        } try {
            const rutaTemplateHC = `./template/plantilla pedido venta.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/pedido venta.xlsx`)) {
                fs.unlinkSync(`./template/pedido venta.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            const rowNombreCliente = sheet.getRow(5);
            const rucClientesMap = rucClientes.map((cliente) => cliente.CL_CNUMRUC)
            const fechaInicioMoment = moment(fechaInicio);
            const fechaFinMoment = moment(fechaFin)
            const dataExcel = await connection.query(`select  pv.rucCliente,pv.nombreCliente, 
            pvd.fechaPedido ,pvd.cantidadHembras from proy_pedido_venta pv inner join proy_pedido_venta_detalle pvd on pv.id=pvd.idPedidoVenta 
            where pv.estado<>0 
            and pvd.fechaPedido BETWEEN ? and ?
            and pv.rucCliente in(${rucClientesMap.join()})  order by pv.rucCliente`, [fechaInicio, fechaFin])
            console.log(dataExcel)
            sheet.getCell("B4").value = "FECHA DE ENVIO: " + moment().format("YYYY-MM-DD")
            rucClientes.forEach((cliente, index) => {
                rowNombreCliente.getCell(index + 3).value = cliente.CL_CNOMCLI
                rowNombreCliente.getCell(index + 3).alignment = alignmentStyle;
                rowNombreCliente.getCell(index + 3).border = borderStylesC
            });
            let rowDataIndex = 6;
            while (fechaInicioMoment.isSameOrBefore(fechaFinMoment)) {
                const rowData = sheet.getRow(rowDataIndex)
                //    rowData.border = borderStylesC;

                rowData.values = [null, fechaInicioMoment.format("YYYY-MM-DD")].concat(rucClientes.map((data) => {
                    const object = dataExcel.find((dataE) => dataE.rucCliente == data.CL_CNUMRUC && moment(dataE.fechaPedido).isSame(fechaInicioMoment));
                    return object ? object.cantidadHembras : 0
                }))
                fechaInicioMoment.add(1, "day")
                rowDataIndex++;
            }
            await workbook.xlsx.writeFile(`./template/pedido venta.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/template/pedido venta.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
        }
    }
}

module.exports = logisticaConsultaModel;