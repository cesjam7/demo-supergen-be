const moment = require("moment");
const mysql = require("../dbconnectionPromise")
const proy_ingresoLoteModel = require("./proy_ingresoLotes");
const proyStandardMachoModel = require("./proyStandardMacho")
const proyStandardHembraModel = require("./proyStandardHembra");
const factorMortalidadModel = require("./proyFactores");
const proyStandardMacho = require("./proyStandardMacho");
const proyDetalleLoteResumenModel = require("./proyDetalleLoteResumen");
const proyIngresoLoteDetalleYProyIngreso = require("./proyLoteDetalleYProyIngresoLote")
var Excel = require('exceljs');

var workbook = new Excel.Workbook();

var fs = require('fs');
const lineasProductivas = [
    { nombreLote: "L9", sexo: "H", tipoGenero: "LH", lineaHembra: true, propiedad: "poblacionLh" },
    { nombreLote: "L7", sexo: "M", tipoGenero: "LH", lineaHembra: false, propiedad: "" },
    { nombreLote: "L4", sexo: "H", tipoGenero: "LM", lineaHembra: true, propiedad: "poblacionLm" },
    { nombreLote: "L1", sexo: "M", tipoGenero: "LM", lineaHembra: false, propiedad: "" }]


const proyLoteDetalle = {

    actualizacionEnLote: async function (proyLoteDetalle = []) {
        const connection = await mysql.connection();
        try {
            const proyLoteQuery = proyLoteDetalle.map(loteDetalle => `update proy_lotedetalle set  `)
            await connection.query(proyLoteQuery)
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },

    listarPorIngresoLoteId: async function (ingresoLoteId) {
        return await proyIngresoLoteDetalleYProyIngreso.listarProyLoteDetallPorIngresoLoteId(ingresoLoteId)
    },
    listarSemanasPorIngresoLote: async function (ingreloteId, genero) {
        const connection = await mysql.connection();
        try {

            return (await connection.query("select proyDetalle.id,proyDetalle.saldoAves, proyDetalle.semana,proyDetalle.porcentajeHi,proyDetalle.porcentajeNacimiento,proyDetalle.porcentajePostura from  proy_loteDetalle proyDetalle INNER JOIN proy_lote lote on lote.idLote=proyDetalle.idLote where proyDetalle.idProyIngresoLote=? and lote.tipoGenero=? and proyDetalle.tipo='Produccion'",
                [ingreloteId, genero]))
        } catch (error) {
            console.error(error)
            throw error;
        } finally {
            connection.release();
        }
    },

    actualizacionGenerica: async function (props = {}, loteDetalleId) {

        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            await connection.query("update  proy_lotedetalle set " + Object.keys(props).join("=?, ") + " where id=? ", [Object.values(props).join(), loteDetalleId]);
            await connection.query("COMMIT");

        } catch (error) {
            await connection.query("ROLLBACK");

            throw error;
        } finally {
            connection.release();
        }

    },
    proyectarLista: async function (listaIngresoLotes, usuarioReg) {
        try {
            for (const ingresoLote of listaIngresoLotes) {
                await this.proyectar(ingresoLote, usuarioReg)
            }

        } catch (error) {
            throw error;
        }

    },
    proyectar: async function (ingresoLote, usuarioReg) {
        const connection = await mysql.connection();
        try {
            await connection.query("START TRANSACTION");

            const semanasProyeccionStandardHembra = await proyStandardHembraModel.listar()
            const semanasProyeccionStandardMacho = await proyStandardMacho.listar();
            let porcentajeHiYPorcentajeNacimientoPorSemana = []

            let factorMortalidad = await factorMortalidadModel.listar();

            if (factorMortalidad.length == 0) {
                throw new Error("No hay un factor registrado")
            }
            ingresoLote = await proy_ingresoLoteModel.traerPorId(ingresoLote.idProyIngresoLote)
            factorMortalidad = factorMortalidad[0];
            const semanaInicialProduccion = ingresoLote.semanasLevante + 1;
            const semanaFinalProduccion = ingresoLote.semanasLevante + ingresoLote.semanasProduccion;
            const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
            const rangoSemanas = range(semanaInicialProduccion, semanaFinalProduccion, 1)

            const existeTodasLasSemanas = rangoSemanas.every((semana, index) => {
                return semanasProyeccionStandardMacho.find((proMacho) => proMacho.semana == semana) && semanasProyeccionStandardHembra.find((proHembra) => proHembra.semana == semana)
            })
            if (!existeTodasLasSemanas) {
                throw new Error(`La semanas de proyeccion Estandar no tiene las mismas semanas en el rango ${semanaInicialProduccion} y ${semanaFinalProduccion}`)
            }
            await connection.query("delete from proy_loteDetalle where idProyIngresoLote=? ", [ingresoLote.idProyIngresoLote])
            await proyDetalleLoteResumenModel.eliminarPorIngresoLote(ingresoLote.idProyIngresoLote)
            const [lotesLineaHembra, listaLoteLevante] = await this.listarLevantePorIngresoLote(ingresoLote, factorMortalidad);
            porcentajeHiYPorcentajeNacimientoPorSemana = porcentajeHiYPorcentajeNacimientoPorSemana.concat(listaLoteLevante.map((levante) => ({ idLote: levante.idLote, idLinea: levante.idLinea, semana: levante.semanasLevante, porcentajeHi: 0, porcentajePostura: 0, porcentajeNacimiento: 0 })))
            let fechaLevante = moment(listaLoteLevante[listaLoteLevante.length - 1].fechaLevante)
            const listaValoresLevante = listaLoteLevante.map((levante) => [levante.idLote, levante.saldoAves, levante.numeroIngreso, levante.idProyIngresoLote, levante.fechaLevante, levante.semanaLevante, new Date(), usuarioReg, levante.tipo])
            await connection.query("insert into proy_loteDetalle(idLote,saldoAves,numeroIngreso,idProyIngresoLote,fechaMovimiento,semana,fechaRegistro,usuarioRegistro,tipo) values ?", [listaValoresLevante])
            for (let j = ingresoLote.semanasLevante + 1; j <= ingresoLote.semanasProduccion + ingresoLote.semanasLevante; j++) {
                fechaLevante = fechaLevante.add(7, "days")
                const semanaStandardMacho = semanasProyeccionStandardMacho.find((proMacho) => proMacho.semana == j)
                const semanaStandardHembra = semanasProyeccionStandardHembra.find((proHembra) => proHembra.semana == j)
                for (let n = 0; n < lotesLineaHembra.length; n++) {
                    const loteActual = lotesLineaHembra[n]
                    let datosStandard = semanaStandardMacho
                    lotesLineaHembra[n].saldoAves = this.calcularNumeroAvesProduccion(lotesLineaHembra[n].saldoAves, loteActual.idLinea == "L9" ? factorMortalidad.factormort_prod_lh : factorMortalidad.factormort_prod_lm);
                    if (loteActual.idLinea == "L9") {
                        datosStandard = semanaStandardHembra;
                    }
                    const calculoPorcentajeHuevosIncubables = this.calcularPorcentajeHuevosIncubable(lotesLineaHembra[n].saldoAves, datosStandard.porc_postura, datosStandard.porc_hi)
                    const porcentajeHiDeHaceTresSemanas = porcentajeHiYPorcentajeNacimientoPorSemana.find((porcentaje) => porcentaje.idLinea == loteActual.idLinea && porcentaje.semana == (j - 3))

                    const calculoPorcentahePbbs = this.calcularPorcentajeBbs(porcentajeHiDeHaceTresSemanas ? porcentajeHiDeHaceTresSemanas.porcentajeHi : 0, porcentajeHiDeHaceTresSemanas ? porcentajeHiDeHaceTresSemanas.porcentajeNacimiento : 0, factorMortalidad.factorcastigo, factorMortalidad.factor_bbs)
                    porcentajeHiYPorcentajeNacimientoPorSemana.push({ idLote: loteActual.idLote, idLinea: loteActual.idLinea, semana: j, porcentajeHi: calculoPorcentajeHuevosIncubables, porcentajePostura: datosStandard.porc_postura, porcentajeNacimiento: datosStandard.porc_nacimiento })
                    await proyDetalleLoteResumenModel.crear(ingresoLote,
                        { idLote: loteActual.idLote, saldoHi: calculoPorcentajeHuevosIncubables, semana: j, saldoBbs: calculoPorcentahePbbs, fechaMovimiento: fechaLevante.format("YYYY-MM-DD") }, usuarioReg)
                    await connection.query("insert into proy_loteDetalle(idLote,saldoAves,saldoHi,saldoBbs,numeroIngreso,idProyIngresoLote,fechaMovimiento,semana,porcentajePostura,porcentajeHi,porcentajeNacimiento,fechaRegistro,usuarioRegistro,tipo) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
                        loteActual.idLote,
                        lotesLineaHembra[n].saldoAves,
                        calculoPorcentajeHuevosIncubables,
                        calculoPorcentahePbbs,
                        ingresoLote.numeroIngreso,
                        ingresoLote.idProyIngresoLote,
                        fechaLevante.format("YYYY-MM-DD"),
                        j,
                        datosStandard.porc_postura,
                        datosStandard.porc_hi,
                        datosStandard.porc_nacimiento,
                        new Date(),
                        usuarioReg,
                        "Produccion"
                    ])


                }


            }
            await connection.query("update proy_ingresolote  set estado=2 where idProyIngresoLote=?", [ingresoLote.idProyIngresoLote])
            await connection.query("COMMIT");
        } catch (error) {
            console.error(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    listarLevantePorIngresoLote: async function (ingresoLote, factorMortalidad) {
        const listaLoteLevante = []
        let saldoAvesLevante = 0;
        let fechaLevante = moment(ingresoLote.fecIngresoLevante);
        const lotes = await proy_ingresoLoteModel.listarLotesPorIngreso(ingresoLote.idProyIngresoLote)
        const lotesLineaHembra = lotes.filter((lote) => {
            return lineasProductivas.find((linea) => linea.nombreLote == lote.idLinea && linea.lineaHembra) != null;
        })
        for (let i = 1; i <= 2; i++) {
            for (let k = 0; k < lotesLineaHembra.length; k++) {
                const linea = lotesLineaHembra[k]
                const semanaLevante = i == 1 ? 0 : ingresoLote.semanasLevante
                saldoAvesLevante = linea.poblacionInicialLev;
                if (i > 1) {
                    saldoAvesLevante = this.calcularNumerAvesLevante(saldoAvesLevante, factorMortalidad.factormort_lev)
                }
                lotesLineaHembra[k].saldoAves = saldoAvesLevante;
                listaLoteLevante.push({
                    idLote: linea.idLote,
                    idLinea: linea.idLinea,
                    saldoAves: saldoAvesLevante,
                    numeroIngreso: ingresoLote.numeroIngreso,
                    idProyIngresoLote: ingresoLote.idProyIngresoLote,
                    fechaLevante: fechaLevante.format("YYYY-MM-DD"),
                    semanaLevante: semanaLevante,
                    tipo: "Levante"
                })
            }
            fechaLevante = fechaLevante.add(ingresoLote.semanasLevante * 7, "days")


        }
        return [lotesLineaHembra, listaLoteLevante]
    },
    calcularNumeroAvesProduccion: function (numeroAves, mortalidad = 0) {
        return parseFloat(numeroAves - (mortalidad / 100) * numeroAves)
    },
    calcularNumerAvesLevante: function (numeroAves, factorMortalidad) {
        return numeroAves * (1 - factorMortalidad)
    },

    calcularPorcentajeHuevosIncubable: function (numeroAves = 0, porcentajePostura = 0, porcentajeHi,) {

        return parseFloat(((numeroAves * porcentajePostura) / 100 * porcentajeHi / 100) * 7)
    },
    calcularPorcentajeBbs: function (porcentaheHi, porcentajeNacimiento = 0, factorCastigo = 0, factorBbs = 0) {
        return parseFloat(((porcentaheHi * porcentajeNacimiento) / 100) * factorCastigo) * factorBbs
    },
    editar: async function (proyIngresoLoteId, detalleLoteConGenero) {
        const connection = await mysql.connection();
        let factorMortalidad = await factorMortalidadModel.listar();

        if (factorMortalidad.length == 0) {
            throw new Error("No hay un factor registrado")
        }
        factorMortalidad = factorMortalidad[0];
        try {
            await connection.query("START TRANSACTION");
            const listaSemanas = await this.listarSemanasPorIngresoLote(proyIngresoLoteId, detalleLoteConGenero.genero);
            let saldoBbs = 0;
            const indexproyDetalle = listaSemanas.findIndex((proyDetalle) => proyDetalle.id == detalleLoteConGenero.id);
            const proyDetalle = listaSemanas[indexproyDetalle];
            let saldoHi = this.calcularPorcentajeHuevosIncubable(proyDetalle.saldoAves, detalleLoteConGenero.porcentajePostura, detalleLoteConGenero.porcentajeHi);
            const calcularSaldoBbs = indexproyDetalle > 3;
            if (calcularSaldoBbs) {
                saldoBbs = this.calcularPorcentajeBbs(detalleLoteConGenero.porcentajeHi, detalleLoteConGenero.porcentajeNacimiento, factorMortalidad.factorcastigo, factorMortalidad.factor_bbs)

            }
            await connection.query("update  proy_loteDetalle set saldoHi=?,saldoBbs=?,porcentajePostura=?,porcentajeHi=?,porcentajeNacimiento=? where id=?", [
                saldoHi,
                saldoBbs,
                detalleLoteConGenero.porcentajePostura,
                detalleLoteConGenero.porcentajeHi,
                detalleLoteConGenero.porcentajeNacimiento,
                detalleLoteConGenero.id
            ])
            await connection.query("COMMIT");
        } catch (error) {
            console.log(error)
            await connection.query("ROLLBACK");
            throw error;
        } finally {
            connection.release();
        }
    },
    exportarExcelDetalleDatosReales: async function (proyIdIngresoLote) {
        try {
            const rutaTemplateHC = `./template/comparativo ingresos plantilla con datos reales.xlsx`;

            if (fs.existsSync(`./template/proyeccion ingresos reales.xlsx`)) {
                fs.unlinkSync(`./template/proyeccion ingresos reales.xlsx`)
            }
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const proyIngresoLote = await proy_ingresoLoteModel.traerPorId(proyIdIngresoLote);
            const detalles = await this.listarPorIngresoLoteId(proyIdIngresoLote)
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            sheet.getCell("A1").value = proyIngresoLote.nombreIngreso
            sheet.getCell("E2").value = proyIngresoLote.factorMortProdLh
            sheet.getCell("E3").value = proyIngresoLote.factorMortProdLm
            sheet.getCell("E4").value = proyIngresoLote.factorCastigo
            for (let i = 0; i < detalles.length; i++) {
                const detalle = detalles[i]
                sheet.getCell("A" + (i + 7)).value = detalle.fechaMovimiento
                sheet.getCell("A" + (i + 7)).border = borderStyles
                sheet.getCell("B" + (i + 7)).value = detalle.semana
                sheet.getCell("B" + (i + 7)).border = borderStyles
                sheet.getCell("C" + (i + 7)).value = parseFloat(detalle.lineaHembra.saldoAves).toFixed(0)
                sheet.getCell("C" + (i + 7)).border = borderStyles
                sheet.getCell("D" + (i + 7)).value = detalle.lineaHembra.saldoAvesReal ? parseFloat(detalle.lineaHembra.saldoAvesReal).toFixed(0) : null
                sheet.getCell("D" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }

                sheet.getCell("D" + (i + 7)).border = borderStyles
                sheet.getCell("E" + (i + 7)).value = parseFloat(detalle.lineaHembra.saldoHi).toFixed(0)
                sheet.getCell("E" + (i + 7)).border = borderStyles
                sheet.getCell("F" + (i + 7)).value = detalle.lineaHembra.saldoHiReal ? parseFloat(detalle.lineaHembra.saldoHiReal).toFixed(0) : null
                sheet.getCell("F" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }
                sheet.getCell("F" + (i + 7)).border = borderStyles
                sheet.getCell("G" + (i + 7)).value = parseFloat(detalle.lineaHembra.saldoBbs).toFixed(0)
                sheet.getCell("G" + (i + 7)).border = borderStyles
                sheet.getCell("H" + (i + 7)).value = detalle.lineaHembra.saldoBbsReal ? parseFloat(detalle.lineaHembra.saldoBbsReal).toFixed(0) : null
                sheet.getCell("H" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }

                sheet.getCell("H" + (i + 7)).border = borderStyles
                sheet.getCell("I" + (i + 7)).value = parseFloat(detalle.lineaHembra.porcentajePostura).toFixed(2)
                sheet.getCell("I" + (i + 7)).border = borderStyles
                sheet.getCell("J" + (i + 7)).value = detalle.lineaHembra.porcentajePosturaReal ? parseFloat(detalle.lineaHembra.porcentajePosturaReal).toFixed(2) : null
                sheet.getCell("J" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }


                sheet.getCell("J" + (i + 7)).border = borderStyles
                sheet.getCell("K" + (i + 7)).value = parseFloat(detalle.lineaHembra.porcentajeHi).toFixed(0)
                sheet.getCell("K" + (i + 7)).border = borderStyles
                sheet.getCell("L" + (i + 7)).value = detalle.lineaHembra.porcentajeHiReal ? parseFloat(detalle.lineaHembra.porcentajeHiReal).toFixed(0) : null
                sheet.getCell("L" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }


                sheet.getCell("L" + (i + 7)).border = borderStyles
                sheet.getCell("M" + (i + 7)).value = parseFloat(detalle.lineaHembra.porcentajeNacimiento).toFixed(2)
                sheet.getCell("M" + (i + 7)).border = borderStyles
                sheet.getCell("N" + (i + 7)).value = detalle.lineaHembra.porcentajeNacimientoReal ? parseFloat(detalle.lineaHembra.porcentajeNacimientoReal).toFixed(2) : null
                sheet.getCell("N" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }
           
                sheet.getCell("N" + (i + 7)).border = borderStyles
                sheet.getCell("O" + (i + 7)).value = parseFloat(detalle.lineaMacho.saldoAves).toFixed(0)
                sheet.getCell("O" + (i + 7)).border = borderStyles
                sheet.getCell("P" + (i + 7)).value = detalle.lineaMacho.saldoAvesReal ? parseFloat(detalle.lineaMacho.saldoAvesReal).toFixed(0) : null
                sheet.getCell("P" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }

                sheet.getCell("P" + (i + 7)).border = borderStyles
                sheet.getCell("Q" + (i + 7)).value = parseFloat(detalle.lineaMacho.saldoHi).toFixed(0)
                sheet.getCell("Q" + (i + 7)).border = borderStyles
                sheet.getCell("R" + (i + 7)).value = detalle.lineaMacho.saldoHiReal ? parseFloat(detalle.lineaMacho.saldoHiReal).toFixed(0) : null
                sheet.getCell("R" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }
                sheet.getCell("R" + (i + 7)).border = borderStyles
                sheet.getCell("S" + (i + 7)).value = parseFloat(detalle.lineaMacho.saldoBbs).toFixed(0)
                sheet.getCell("S" + (i + 7)).border = borderStyles
                sheet.getCell("T" + (i + 7)).value = detalle.lineaMacho.saldoBbsReal ? parseFloat(detalle.lineaMacho.saldoBbsReal).toFixed(0) : null
                sheet.getCell("T" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }
                sheet.getCell("T" + (i + 7)).border = borderStyles
                sheet.getCell("U" + (i + 7)).value = parseFloat(detalle.lineaMacho.porcentajePostura).toFixed(2)
                sheet.getCell("U" + (i + 7)).border = borderStyles
                sheet.getCell("V" + (i + 7)).value = detalle.lineaMacho.porcentajePosturaReal ? parseFloat(detalle.lineaMacho.porcentajePosturaReal).toFixed(2) : null
                sheet.getCell("V" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }

                sheet.getCell("V" + (i + 7)).border = borderStyles
                sheet.getCell("W" + (i + 7)).value = parseFloat(detalle.lineaMacho.porcentajeHi).toFixed(0)
                sheet.getCell("W" + (i + 7)).border = borderStyles
                sheet.getCell("X" + (i + 7)).value = detalle.lineaMacho.porcentajeHiReal ? parseFloat(detalle.lineaMacho.porcentajeHiReal).toFixed(0) : null
                sheet.getCell("X" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }

                sheet.getCell("X" + (i + 7)).border = borderStyles
                sheet.getCell("Y" + (i + 7)).value = parseFloat(detalle.lineaMacho.porcentajeNacimiento).toFixed(2)
                sheet.getCell("Y" + (i + 7)).border = borderStyles
                sheet.getCell("Z" + (i + 7)).value = detalle.lineaMacho.porcentajeNacimientoReal ? parseFloat(detalle.lineaMacho.porcentajeNacimientoReal).toFixed(2) : null
                sheet.getCell("Z" + (i + 7)).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'EF8747' }
                }

                sheet.getCell("Z" + (i + 7)).border = borderStyles
            }
            await workbook.xlsx.writeFile(`./template/proyeccion ingresos reales.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/template/proyeccion ingresos reales.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }
    },
    exportarExcelDetalle: async function (proyIdIngresoLote) {
        try {
            const rutaTemplateHC = `./template/plantilla proyeccion  ingresos.xlsx`;

            if (fs.existsSync(`./template/proyeccion ingresos.xlsx`)) {
                fs.unlinkSync(`./template/proyeccion ingresos.xlsx`)
            }
            const proyIngresoLote = await proy_ingresoLoteModel.traerPorId(proyIdIngresoLote);
            const detalles = await this.listarPorIngresoLoteId(proyIdIngresoLote)
            const wor = await workbook.xlsx.readFile(rutaTemplateHC)
            const sheet = wor.worksheets[0];
            sheet.getCell("A1").value = proyIngresoLote.nombreIngreso
            sheet.getCell("E2").value = proyIngresoLote.factorMortProdLh
            sheet.getCell("E3").value = proyIngresoLote.factorMortProdLm
            sheet.getCell("E4").value = proyIngresoLote.factorCastigo
            for (let i = 0; i < detalles.length; i++) {
                const detalle = detalles[i]
                sheet.getRow(i + 7).values = [detalle.fechaMovimiento, detalle.semana,
                parseFloat(detalle.lineaHembra.saldoAves.toFixed(0)),
                parseFloat(detalle.lineaHembra.saldoHi).toFixed(0),
                parseFloat(detalle.lineaHembra.saldoBbs).toFixed(0),
                parseFloat(detalle.lineaHembra.porcentajePostura).toFixed(2),
                parseFloat(detalle.lineaHembra.porcentajeHi).toFixed(0),
                parseFloat(detalle.lineaHembra.porcentajeNacimiento).toFixed(2),
                parseFloat(detalle.lineaMacho.saldoAves).toFixed(0),
                parseFloat(detalle.lineaMacho.saldoHi).toFixed(0),
                parseFloat(detalle.lineaMacho.saldoBbs).toFixed(0),
                parseFloat(detalle.lineaMacho.porcentajePostura).toFixed(2),
                parseFloat(detalle.lineaMacho.porcentajeHi).toFixed(0),
                parseFloat(detalle.lineaMacho.porcentajeNacimiento).toFixed(2)]
            }
            await workbook.xlsx.writeFile(`./template/proyeccion ingresos.xlsx`)
            const json = {
                success: true,
                message: "Exportación realizada correctamente.",
                rutaCM: "/template/proyeccion ingresos.xlsx"
            }
            return json;
        } catch (error) {
            console.log("err", error)
            throw error;
        }

    }

}
module.exports = proyLoteDetalle