const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const proyPedidoVentaDetalleModel = require("./proyPedidoVentaDetalle")
const mysqlClass = require("../dbConnectionClass")
var Excel = require('exceljs');

var workbook = new Excel.Workbook();

var fs = require('fs');
const proyPedidoVentaModel = {

    crear: async function (pedidoVentaConDetalle, usuarioRegistroId) {
        const connection = await mysql.connection();
        try {
            if (await this.verificarSiLaEmpresaSeEncuentraRegistrado(pedidoVentaConDetalle.cliente.CL_CNUMRUC)) {
                throw new Error("Ya existe el cliente registrado")
            }
            await connection.query("START TRANSACTION");
            const ultimoOrden = await connection.query("select orden from proy_pedido_venta order by orden desc ")
            const ultimoOrdenValor = ultimoOrden.length > 0 ? ultimoOrden[0].orden + 1 : 0
            await connection.query("insert into proy_pedido_venta(id,rucCliente,nombreCliente,color,fechaRegistro,usuarioRegistro,orden) values(?,?,?,?,?,?,?)", [
                pedidoVentaConDetalle.id,
                pedidoVentaConDetalle.cliente.CL_CNUMRUC,
                pedidoVentaConDetalle.cliente.CL_CNOMCLI,
                pedidoVentaConDetalle.color,
                new Date(),
                usuarioRegistroId,
                ultimoOrdenValor
            ]);
            await proyPedidoVentaDetalleModel.crearBatch(pedidoVentaConDetalle.detalles, pedidoVentaConDetalle.id, usuarioRegistroId)

            await connection.query("COMMIT");
        } catch (error) {
            console.log("e", error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    pedidosConsolidado: async function ({ fechaInicial, fechaFinal, rangoFechas, anio, semana }) {

        if (!rangoFechas) {
            const data = await mysqlClass.ejecutarQueryPreparado(`select * from semana_year where anio='${anio}' and semana=${semana} order by fecha asc `, {})
            fechaInicial = moment(data[0].fecha, ["YYYY-MM-DD"]).format("YYYY-MM-DD")
            fechaFinal = moment(data[data.length - 1].fecha, ["YYYY-MM-DD"]).format("YYYY-MM-DD")
        }
        let dataProcess = []
        const dataClientes = [{ key: "cantidad_RedondosNorte", name: "Redondos Norte", ruc: "20221084684" },
        { key: "cantidad_RedondosSur", name: "Redondos Sur", ruc: "77777777" },
        { key: "cantidad_SantaElenaNorte", name: "Santa Elena Norte", ruc: "88888888" },
        { key: "cantidad_SantaElenaSur", name: "Santa Elena Sur", ruc: "20155261570" },
        { key: "cantidad_LaPerla", name: "La Perla", ruc: "20131589086" },
        { key: "cantidad_Yugoslavia", name: "Yugoslavia", ruc: "20132100552" },
        ]
        const dataRucClientes = dataClientes.map(d => `'${d.ruc}'`);
        const dataClienteColor = await mysqlClass.ejecutarQueryPreparado(`select rucCliente,color from proy_pedido_venta where rucCliente in(${dataRucClientes.join()})`, {})
        for (const cliente of dataClientes) {
            const clienteColor = dataClienteColor.find(c => c.rucCliente == cliente.ruc)
            cliente.color = clienteColor.color
        }
        const data = await mysqlClass.ejecutarQueryPreparado(`CALL sp_reporte1('${fechaInicial}', '${fechaFinal}');`, {})
        for (const d of data[data.length - 2]) {
            const datos = dataClientes.flatMap(s => ({ valor: d[s.key], color: s.color }))
            dataProcess.push({
                totalPedido: d.total_pedido,
                cantidadNacimiento: d.cantidadnacimienos,
                porcentajeEntregado: d.porc_entregado,
                cantidadNacimientoUno: d.cantidadnacimienos_1, porcentajeNacimiento: d.porc_nac, fechaPedido: d.fechapedido,
                datos,
                semana: d.semana
            })

        }
        return { data: dataProcess, dataClientes }
    },
    exportarExcelConsolidado: async function ({ fechaInicial, fechaFinal, rangoFechas, anio, semana }) {

        try {
            const { data, dataClientes } = await this.pedidosConsolidado({ fechaInicial, fechaFinal, rangoFechas, anio, semana })
            const rutaTemplateHC = `./template/plantilla pedido venta consolidado.xlsx`;
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }

            const borderStylesC = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            if (fs.existsSync(`./template/pedido venta consolidado.xlsx`)) {
                fs.unlinkSync(`./template/pedido venta consolidado.xlsx`)
            }
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            const dataIndex = 9;
            for (let i = 0; i < data.length; i++) {
                const d = data[i]
                const rowData = sheet.getRow(i + dataIndex)
                sheet.getCell(`A${i + dataIndex}`).value = d.semana
                sheet.getCell(`A${i + dataIndex}`).border = borderStylesC
                sheet.getCell(`B${i + dataIndex}`).value = d.fechaPedido
                sheet.getCell(`B${i + dataIndex}`).border = borderStylesC
                sheet.getCell(`C${i + dataIndex}`).value = d.cantidadNacimientoUno
                sheet.getCell(`C${i + dataIndex}`).border = borderStylesC
                sheet.getCell(`D${i + dataIndex}`).value = d.porcentajeNacimiento
                sheet.getCell(`D${i + dataIndex}`).border = borderStylesC
                for (let j = 0; j < d.datos.length; j++) {
                    const dato = d.datos[j]
                    rowData.getCell(j + 5).value = dato.valor
                    rowData.getCell(j + 5).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: dato.color.replace("#", '') },
                        bgColor: { argb: '52AEA7' }
                    }
                    rowData.getCell(j + 5).font = {
                        color: { argb: "FFFFFF" }
                    }
                    rowData.getCell(j + 5).border = borderStylesC
                }
                sheet.getCell(`K${i + dataIndex}`).value = d.totalPedido
                sheet.getCell(`K${i + dataIndex}`).border = borderStylesC
                sheet.getCell(`L${i + dataIndex}`).value = d.cantidadNacimiento
                sheet.getCell(`L${i + dataIndex}`).border = borderStylesC
                sheet.getCell(`M${i + dataIndex}`).value = d.porcentajeEntregado
                sheet.getCell(`M${i + dataIndex}`).border = borderStylesC
            }
            await workbook.xlsx.writeFile(`./template/pedido venta consolidado.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/supergen-be/template/pedido venta consolidado.xlsx"
            }
            return json;
        } catch (error) {
            console.log("e", error)
        }
    },

    exportarExel: async function ({ fechaInicio, fechaFin, rucClientes = [] }) {
        const connection = await mysql.connection();
        try {
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
        } finally {
            connection.release()
        }


    },
    listar: async function () {
        const connection = await mysql.connection();
        try {

            return await connection.query("select pv.*,cl.CL_CNOMCOM as nombreAlternativoProveedor from proy_pedido_venta pv left join clientes cl on cl.CL_CCODCLI=pv.rucCliente where  estado<>0");

        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }
    },
    verificarSiLaEmpresaSeEncuentraRegistrado: async function (rucCliente) {
        const connection = await mysql.connection();
        let listaCliente = []
        try {
            listaCliente = await connection.query("select id from proy_pedido_venta where rucCliente=? and estado<>0", [rucCliente]);
            console.log("lis", listaCliente.length > 0)

        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }
        return listaCliente.length > 0
    },
    editar: async function (pedidoVentaConDetalle, usuarioRegistroId) {
        const connection = await mysql.connection();
        try {
            await connection.query("update  proy_pedido_venta set color=? where id=? ", [pedidoVentaConDetalle.color, pedidoVentaConDetalle.id])
            await connection.query("delete from proy_pedido_venta_detalle where idPedidoVenta=? ", [pedidoVentaConDetalle.id]);
            await proyPedidoVentaDetalleModel.crearBatch(pedidoVentaConDetalle.detalles, pedidoVentaConDetalle.id, usuarioRegistroId)
        } catch (error) {
            console.log("e", error)
            throw error;
        } finally {
            connection.release();
        }
    },
}

module.exports = proyPedidoVentaModel