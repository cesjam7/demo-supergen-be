
const mssqlClass = require('../dbConnectionMSSQLClass')()
const moment = require('moment');
moment.locale("es")
const Excel = require('exceljs');
const workbook = new Excel.Workbook();
const ServerError = require('../error');

const alimentacionCosteoModelo = {
    consultarMovilidad: async function ({ anio, mes }) {

        const periodo = moment(`${anio}${mes}`, "YYYYMM")
        const fechaInicial = periodo.clone().startOf("M")
        const fechaFinal = periodo.clone().endOf("M")
        const data = await mssqlClass.ejecutarQueryPreparado(`select * from rep_movilidad where periodo='${periodo.format("YYYYMM")}'`, {})
        const dataResumen = await mssqlClass.ejecutarQueryPreparado(`select *,FAsigMonto as fAsigMonto,FAsigPorc as fAsigPorc,CostoVariable as costoVariable,CostoDirecto as costoDirecto,CostoTotal as costoTotal from rep_movilidad_resumen where periodo='${periodo.format("YYYYMM")}'`, {})
        const titulos = await mssqlClass.ejecutarQueryPreparado(`select * from rep_movilidad_titulos where periodo='${periodo.format("YYYYMM")}' order by orden`, {})
        const titulosMap = titulos.map((t, index) => (index + 1).toString().padStart(2, "0"))
        const dataProcesado = []
        while (fechaInicial.isSameOrBefore(fechaFinal)) {
            const dataFind = data.find(d => moment(d.fecha).format("YYYY-MM-DD") == fechaInicial.format("YYYY-MM-DD"))
            const datos = titulosMap.map(tituloIndice => dataFind[`npcc${tituloIndice}`])
            const datosMovilidad = titulosMap.map(tituloIndice => dataFind[`cmpl${tituloIndice}`])
            dataProcesado.push({
                dia: fechaInicial.format("D"),
                datos,
                total: dataFind ? dataFind.nptotal : 0,
                ruta: dataFind ? dataFind.CRuta : 0,
                cUnit: dataFind ? dataFind.CCUnit : 0,
                datosMovilidad,
                totalMovilidad: dataFind ? dataFind.cmpltotal : 0
            })

            fechaInicial.add(1, "day")
        }
        const datosMovilidadProcesado = dataProcesado.map(d => d.datos)
        const datosDatosMovilidadProcesado = dataProcesado.map(d => d.datosMovilidad)
        const datosTotalMovilidad = this.totalArray(datosMovilidadProcesado, titulosMap)
        const datosTotalMovilidadMovilidad = this.totalArray(datosDatosMovilidadProcesado, titulosMap)
        const totalesMovilidad = dataProcesado.reduce((prev, curr) => {
            prev.total += curr.total
            prev.ruta += curr.ruta
            prev.cUnit += curr.cUnit
            prev.cUnit += curr.cUnit
            prev.totalMovilidad += curr.totalMovilidad
            return prev
        }, { total: 0, ruta: 0, cUnit: 0, cUnit: 0 ,totalMovilidad:0})
        dataProcesado.push({
            dia: "Total",
            datos: datosTotalMovilidad,
            datosMovilidad: datosTotalMovilidadMovilidad,
            ...totalesMovilidad,

        })
        let listaLotes = dataResumen.filter(f => !["OFICINA", "PLANTA"].includes(f.lotes))
        const listaOficinas = dataResumen.filter(f => ["OFICINA", "PLANTA"].includes(f.lotes))
        const totales = listaLotes.reduce((prev, curr) => {
            prev.aves += curr.aves ? curr.aves : 0;
            prev.fAsigMonto += curr.fAsigMonto ? curr.fAsigMonto : 0;
            prev.fAsigPorc += curr.fAsigPorc ? curr.fAsigPorc : 0;
            prev.costoVariable += curr.costoVariable ? curr.costoVariable : 0;
            prev.costoDirecto += curr.costoDirecto ? curr.costoDirecto : 0;
            prev.costoTotal += curr.costoTotal ? curr.costoTotal : 0;
            return prev;
        }, { aves: 0, fAsigMonto: 0, fAsigPorc: 0, costoVariable: 0, costoDirecto: 0, costoTotal: 0 })
        const totalOficinas = listaOficinas.reduce((prev, curr) => {
            prev.aves += curr.aves ? curr.aves : 0;
            prev.fAsigMonto += curr.fAsigMonto ? curr.fAsigMonto : 0;
            prev.fAsigPorc += curr.fAsigPorc ? curr.fAsigPorc : 0;
            prev.costoVariable += curr.costoVariable ? curr.costoVariable : 0;
            prev.costoDirecto += curr.costoDirecto ? curr.costoDirecto : 0;
            prev.costoTotal += curr.costoTotal ? curr.costoTotal : 0;
            return prev;
        }, { aves: 0, fAsigMonto: 0, fAsigPorc: 0, costoVariable: 0, costoDirecto: 0, costoTotal: 0 })
        listaLotes.push({ dia: null, ...totales, lotes: "Total" })
        listaOficinas.push({
            ...totalOficinas, aves: totales.aves + totalOficinas.aves,
            fAsigMonto: totalOficinas.fAsigMonto + totales.fAsigMonto, fAsigPorc: totales.fAsigPorc + totalOficinas.fAsigPorc, costoVariable: totales.costoVariable + totalOficinas.costoVariable, costoDirecto: totalOficinas.costoDirecto + totales.costoDirecto, costoTotal: totalOficinas.costoTotal + totales.costoTotal, lotes: "Total"
        })
        listaLotes = listaLotes.concat(listaOficinas)
        return { data: dataProcesado, titulos, dataResumen: listaLotes }

    },


    consultarAlimentacion: async function ({ anio, mes }) {
        const periodo = moment(`${anio}${mes}`, "YYYYMM")
        const dataConsolidadoProcesado = []
        const fechaInicial = periodo.clone().startOf("M")
        const fechaFinal = periodo.clone().endOf("M")
        const data = await mssqlClass.ejecutarQueryPreparado(`select * from rep_alimentacion where periodo='${periodo.format("YYYYMM")}'`, {})
        const dataResumen = await mssqlClass.ejecutarQueryPreparado(`select *,FAsigMonto as fAsigMonto,FAsigPorc as fAsigPorc,CostoVariable as costoVariable,CostoDirecto as costoDirecto,CostoTotal as costoTotal  from rep_alimentacion_resumen where periodo='${periodo.format("YYYYMM")}'`, {})
        const dataConsolidado = await mssqlClass.ejecutarQueryPreparado(`select * from rep_alimentacion_consolidado where periodo='${periodo.format("YYYYMM")}'`, {})
        const titulos = await mssqlClass.ejecutarQueryPreparado(`select * from rep_alimentacion_titulos where periodo='${periodo.format("YYYYMM")}' order by orden`, {})
        const titulosMap = titulos.map((t, index) => (index + 1).toString().padStart(2, "0"))
        const dataProcesado = []
        const dataUnidadesTotales = data.filter(d => d.fecha == '8888888888' || d.fecha == '9999999999')

        while (fechaInicial.isSameOrBefore(fechaFinal)) {
            const dataFind = data.find(d => moment(d.fecha).format("YYYY-MM-DD") == fechaInicial.format("YYYY-MM-DD"))
            const datosDesayuno = titulosMap.map(tituloIndice => dataFind[`d${tituloIndice}`])
            const datosAlmuerzo = titulosMap.map(tituloIndice => dataFind[`a${tituloIndice}`])
            const datosCena = titulosMap.map(tituloIndice => dataFind[`c${tituloIndice}`])
            dataProcesado.push({
                dia: fechaInicial.format("D"),
                total: dataFind.nptotal,
                ruta: dataFind.CRuta,
                desayunoTotal: dataFind.dtotal,
                almuerzoTotal: dataFind.atotal,
                cenaTotal: dataFind.ctotal,
                cUnit: dataFind.CCUnit,
                datosDesayuno,
                datosAlmuerzo,
                datosCena,
                totalMovilidad: dataFind.cmpltotal
            })

            fechaInicial.add(1, "day")

        }
        for (const dataUnidad of dataUnidadesTotales) {
            const datosDesayuno = titulosMap.map(tituloIndice => dataUnidad[`d${tituloIndice}`])
            const datosAlmuerzo = titulosMap.map(tituloIndice => dataUnidad[`a${tituloIndice}`])
            const datosCena = titulosMap.map(tituloIndice => dataUnidad[`c${tituloIndice}`])
            dataProcesado.push({
                dia: dataUnidad.fecha == '8888888888' ? 'Und' : 'S/',
                total: dataUnidad.nptotal,
                ruta: dataUnidad.CRuta,
                desayunoTotal: dataUnidad.dtotal,
                almuerzoTotal: dataUnidad.atotal,
                cenaTotal: dataUnidad.ctotal,
                cUnit: dataUnidad.CCUnit,
                datosDesayuno,
                datosAlmuerzo,
                datosCena,
                totalMovilidad: dataUnidad.cmpltotal
            })
        }
        for (const data of dataConsolidado) {
            const datos = titulosMap.map(t => data[`Costo${t}`])
            dataConsolidadoProcesado.push({ nombre: data.Nombre, costoTotal: data.Costototal, datos })
        }
        let listaLotes = dataResumen.filter(f => !["OFICINA", "PLANTA"].includes(f.lotes))
        const listaOficinas = dataResumen.filter(f => ["OFICINA", "PLANTA"].includes(f.lotes))
        const totales = listaLotes.reduce((prev, curr) => {
            prev.aves += curr.aves ? curr.aves : 0;
            prev.fAsigMonto += curr.fAsigMonto ? curr.fAsigMonto : 0;
            prev.fAsigPorc += curr.fAsigPorc ? curr.fAsigPorc : 0;
            prev.costoVariable += curr.costoVariable ? curr.costoVariable : 0;
            prev.costoDirecto += curr.costoDirecto ? curr.costoDirecto : 0;
            prev.costoTotal += curr.costoTotal ? curr.costoTotal : 0;
            return prev;
        }, { aves: 0, fAsigMonto: 0, fAsigPorc: 0, costoVariable: 0, costoDirecto: 0, costoTotal: 0 })
        const totalOficinas = listaOficinas.reduce((prev, curr) => {
            prev.aves += curr.aves ? curr.aves : 0;
            prev.fAsigMonto += curr.fAsigMonto ? curr.fAsigMonto : 0;
            prev.fAsigPorc += curr.fAsigPorc ? curr.fAsigPorc : 0;
            prev.costoVariable += curr.costoVariable ? curr.costoVariable : 0;
            prev.costoDirecto += curr.costoDirecto ? curr.costoDirecto : 0;
            prev.costoTotal += curr.costoTotal ? curr.costoTotal : 0;
            return prev;
        }, { aves: 0, fAsigMonto: 0, fAsigPorc: 0, costoVariable: 0, costoDirecto: 0, costoTotal: 0 })
        listaLotes.push({ dia: null, ...totales, lotes: "Total" })
        listaOficinas.push({
            ...totalOficinas, aves: totales.aves + totalOficinas.aves,
            fAsigMonto: totalOficinas.fAsigMonto + totales.fAsigMonto, fAsigPorc: totales.fAsigPorc + totalOficinas.fAsigPorc, costoVariable: totales.costoVariable + totalOficinas.costoVariable, costoDirecto: totalOficinas.costoDirecto + totales.costoDirecto, costoTotal: totalOficinas.costoTotal + totales.costoTotal, lotes: "Total"
        })
        listaLotes = listaLotes.concat(listaOficinas)

        return { data: dataProcesado, titulos, dataResumen: listaLotes, dataConsolidado: dataConsolidadoProcesado }
    },
    consultarTareo: async function ({ anio, mes }) {
        const periodo = moment(`${anio}${mes}`, "YYYYMM")
        const fechaInicial = periodo.clone().startOf("M")
        const fechaFinal = periodo.clone().endOf("M")
        const dias = []
        const data = await mssqlClass.ejecutarQueryPreparado(`select * from rep_tareo  where periodo='${periodo.format("YYYYMM")}'`, {})
        const titulos = await mssqlClass.ejecutarQueryPreparado(`select * from rep_alimentacion_titulos where periodo='${periodo.format("YYYYMM")}' order by orden`, {})
        const titulosMap = titulos.map((t, index) => (index + 1).toString().padStart(2, "0"))
        const dataProcesado = []
        while (fechaInicial.isSameOrBefore(fechaFinal)) {
            dias.push(fechaInicial.format("D").padStart(2, "0"))
            fechaInicial.add(1, "day")
        }
        for (const d of data) {
            const datosDias = dias.map(dia => d[`d${dia}`])
            const datos = titulosMap.map(t => d[`Conteo${t}`])
            dataProcesado.push({
                datos,
                datosDias,
                codigoEmpleado: d.emp_code,
                costoTotal: d.Conteototal,
                apellidos: d.apellidos,
            })

        }
        const costoTotal = dataProcesado.reduce((prev, curr) => prev += curr.costoTotal, 0)
        const datosDeDataProcesado = dataProcesado.map(d => d.datos)
        const datosTotales = this.totalArray(datosDeDataProcesado, titulos)
        dataProcesado.push({
            codigoEmpleado: "",
            apellidos: "",
            costoTotal,
            datosDias: dias.map(d => null),
            datos: datosTotales
        })
        return { data: dataProcesado, titulos, dias }
    },
    totalArray: function (datos = [], titulosIndice = []) {
        let dataTotal = []
        for (const d of datos) {
            for (let i = 0; i < titulosIndice.length; i++) {
                const dataGuardada = dataTotal[i] ? dataTotal[i] : 0
                dataTotal[i] = dataGuardada + (d[i] ? d[i] : 0)
            }
        }
        return dataTotal

    },




    exportExcel: async function ({ anio, mes }) {
        try {
            const borderStyles = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            const dataMovilidad = await this.consultarMovilidad({ anio, mes })
            const dataTareo = await this.consultarTareo({ anio, mes })
            const dataAlimentacion = await this.consultarAlimentacion({ anio, mes })
            const titulosMovilidad = [[
                { titulo: "Día", colSpan: 1, rowSpan: 2 },
                { titulo: "Numero salida personas los lotes", rowSpan: 1, colSpan: dataMovilidad.titulos.length },
                { titulo: "Total", rowSpan: 2, colSpan: 1 },
                { titulo: "Costo", rowSpan: 1, colSpan: 2 },
                { titulo: "Costo Movilidad por Lotes", rowSpan: 1, colSpan: dataMovilidad.titulos.length },
                { titulo: "Total", rowSpan: 2, colSpan: 1 }
            ],
            [...dataMovilidad.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
            { titulo: "Ruta", rowSpan: 1, colSpan: 1 },
            { titulo: "C/Unit", rowSpan: 1, colSpan: 1 },
            ...dataMovilidad.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
            ]
            ]
            const titulosTareo = [[
                { titulo: "Día", colSpan: 1, rowSpan: 2 },
                { titulo: "Nombre y Apellidos", rowSpan: 2, colSpan: 1 },
                { titulo: "Mes", rowSpan: 1, colSpan: dataTareo.dias.length },
                { titulo: "Total", rowSpan: 1, colSpan: dataTareo.titulos.length + 1 },
            ],
            [...dataTareo.dias.map(t => ({ titulo: t, colSpan: 1, rowSpan: 1 })),
            ...dataTareo.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
            { titulo: "Total", rowSpan: 1, colSpan: 1 },

            ]
            ]
            const titulosAlimentacion = [[
                { titulo: "Día", colSpan: 1, rowSpan: 2 },
                { titulo: "Desayuno", rowSpan: 1, colSpan: dataAlimentacion.titulos.length + 1 },
                { titulo: "Almuerzo", rowSpan: 1, colSpan: dataAlimentacion.titulos.length + 1 },
                { titulo: "Cena", rowSpan: 1, colSpan: dataAlimentacion.titulos.length + 1 },
            ],
            [...dataAlimentacion.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
            { titulo: "Total", rowSpan: 1, colSpan: 1 },
            ...dataAlimentacion.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
            { titulo: "Total", rowSpan: 1, colSpan: 1 },
            ...dataAlimentacion.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
            { titulo: "Total", rowSpan: 1, colSpan: 1 },
            ]
            ]
            const titulosResumenAlimentacion = [[
                { titulo: "Descripcion", colSpan: 1, rowSpan: 1 },
                ...dataAlimentacion.titulos.map(t => ({ titulo: t.nombrecosto, colSpan: 1, rowSpan: 1 })),
                { titulo: "Total", rowSpan: 1, colSpan: 1 },
            ]
            ]

            const titulosConsolidadAlimenacion = [[
                { titulo: "Lotes", colSpan: 1, rowSpan: 1 },
                { titulo: "Aves", colSpan: 1, rowSpan: 1 },
                { titulo: "Dias", colSpan: 1, rowSpan: 1 },
                { titulo: "Factor Asignacion", colSpan: 2, rowSpan: 1 },
                { titulo: "Costo variable", colSpan: 1, rowSpan: 1 },
                { titulo: "Costo directo", colSpan: 1, rowSpan: 1 },
                { titulo: "Total", colSpan: 1, rowSpan: 1 },
            ]

            ]
            const titulosResumenMovilidad = [[
                { titulo: "Lotes", colSpan: 1, rowSpan: 1 },
                { titulo: "Aves", colSpan: 1, rowSpan: 1 },
                { titulo: "Dias", colSpan: 1, rowSpan: 1 },
                { titulo: "Factor Asignacion", colSpan: 2, rowSpan: 1 },
                { titulo: "Costo variable", colSpan: 1, rowSpan: 1 },
                { titulo: "Costo directo", colSpan: 1, rowSpan: 1 },
                { titulo: "Total", colSpan: 1, rowSpan: 1 },
            ]

            ]
            const wor = await workbook.xlsx.readFile("./template/plantilla granja alimentacion costeo.xlsx")
            const sheetMovilidad = wor.getWorksheet("Movilidad")
            const sheetTareo = wor.getWorksheet("Tareo Costeo")
            const sheetAlimentacion = wor.getWorksheet("Alimentacion")
            const { rowIndiceContador: rowIndiceTareo } = this.generarTitulosExcel(titulosTareo, wor, "Tareo Costeo", 2, 2)
            const { rowIndiceContador, colIndiceContador } = this.generarTitulosExcel(titulosMovilidad, wor, "Movilidad", 2, 2)
            const { rowIndiceContador: rowIndiceAlimentacion } = this.generarTitulosExcel(titulosAlimentacion, wor, "Alimentacion", 2, 2)
            const rowFinal = rowIndiceContador + dataMovilidad.data.length + 1
            const rowFinalAlimentacion = rowIndiceAlimentacion + dataAlimentacion.data.length + 1
            this.generarTitulosExcel(titulosResumenMovilidad, wor, "Movilidad", rowFinal, 2)
            const { rowIndiceContador: rowIndiceAlimentacionResumen } = this.generarTitulosExcel(titulosConsolidadAlimenacion, wor, "Alimentacion", rowFinalAlimentacion, 2)
            const rowFinalAlimentacionResumen = rowIndiceAlimentacionResumen + dataAlimentacion.dataResumen.length + 1
            this.generarTitulosExcel(titulosResumenAlimentacion, wor, "Alimentacion", rowFinalAlimentacionResumen, 2)

            for (let i = 0; i < dataMovilidad.data.length; i++) {
                const rowIndicador = rowIndiceContador + i
                let dataIndiceValor = 2
                const data = dataMovilidad.data[i]
                const row = sheetMovilidad.getRow(rowIndicador)
                row.getCell(dataIndiceValor).value = data.dia
                row.getCell(dataIndiceValor).border = borderStyles
                for (const dato of data.datos) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = dato
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.total
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.ruta
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.cUnit
                row.getCell(dataIndiceValor).border = borderStyles
                for (const datoMovilidad of data.datosMovilidad) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = datoMovilidad
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.totalMovilidad
                row.getCell(dataIndiceValor).border = borderStyles
            }
            for (let i = 0; i < dataAlimentacion.data.length; i++) {
                const rowIndicador = rowIndiceAlimentacion + i
                let dataIndiceValor = 2
                const data = dataAlimentacion.data[i]
                const row = sheetAlimentacion.getRow(rowIndicador)
                row.getCell(dataIndiceValor).value = data.dia
                row.getCell(dataIndiceValor).border = borderStyles
                for (const dato of data.datosDesayuno) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = dato
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.desayunoTotal
                row.getCell(dataIndiceValor).border = borderStyles
                for (const datoMovilidad of data.datosAlmuerzo) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = datoMovilidad
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.almuerzoTotal
                row.getCell(dataIndiceValor).border = borderStyles
                for (const datoMovilidad of data.datosCena) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = datoMovilidad
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.cenaTotal
                row.getCell(dataIndiceValor).border = borderStyles
            }
            for (let i = 0; i < dataAlimentacion.dataResumen.length; i++) {
                const rowIndicador = rowIndiceAlimentacionResumen + i
                let dataIndiceValor = 2
                const data = dataAlimentacion.dataResumen[i]
                const row = sheetAlimentacion.getRow(rowIndicador)
                row.getCell(dataIndiceValor).value = data.lotes
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.aves
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.dias
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.fAsigMonto
                row.getCell(dataIndiceValor).border = borderStyles

                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.fAsigPorc
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoVariable
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoDirecto
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoTotal
                row.getCell(dataIndiceValor).border = borderStyles
            }
            for (let i = 0; i < dataAlimentacion.dataConsolidado.length; i++) {
                const rowIndicador = rowFinalAlimentacionResumen + i + 1
                let dataIndiceValor = 2
                const data = dataAlimentacion.dataConsolidado[i]
                const row = sheetAlimentacion.getRow(rowIndicador)
                row.getCell(dataIndiceValor).value = data.nombre
                row.getCell(dataIndiceValor).border = borderStyles
                for (const datoMovilidad of data.datos) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = datoMovilidad
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoTotal
                row.getCell(dataIndiceValor).border = borderStyles
            }
            for (let i = 0; i < dataMovilidad.dataResumen.length; i++) {
                const rowIndicador = rowFinal + i + 1
                let dataIndiceValor = 2
                const data = dataMovilidad.dataResumen[i]
                const row = sheetMovilidad.getRow(rowIndicador)
                row.getCell(dataIndiceValor).value = data.lotes
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.aves
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.dias
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.fAsigMonto
                row.getCell(dataIndiceValor).border = borderStyles

                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.fAsigPorc
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoVariable
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoDirecto
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoTotal
                row.getCell(dataIndiceValor).border = borderStyles
            }
            console.log(rowIndiceContador, colIndiceContador)
            for (let i = 0; i < dataTareo.data.length; i++) {
                const rowIndicador = rowIndiceTareo + i
                let dataIndiceValor = 2
                const data = dataTareo.data[i]
                const row = sheetTareo.getRow(rowIndicador)
                row.getCell(dataIndiceValor).value = data.codigoEmpleado
                row.getCell(dataIndiceValor).border = borderStyles
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.apellidos
                row.getCell(dataIndiceValor).border = borderStyles
                for (const dato of data.datosDias) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = dato
                    row.getCell(dataIndiceValor).border = borderStyles
                }

                for (const datoMovilidad of data.datos) {
                    dataIndiceValor++
                    row.getCell(dataIndiceValor).value = datoMovilidad
                    row.getCell(dataIndiceValor).border = borderStyles
                }
                dataIndiceValor++
                row.getCell(dataIndiceValor).value = data.costoTotal
                row.getCell(dataIndiceValor).border = borderStyles
            }
            await workbook.xlsx.writeFile("./template/granja alimentacion costeo.xlsx")
            return { url: `/supergen-be/template/granja alimentacion costeo.xlsx` }
        } catch (error) {
            throw error
        }
    },
    generarTitulosExcel: function (headers = [], workbook, nombreHoja = 'Hoja 1', rowIndice = 1, colIndice = 1) {
        let rowIndiceContador = rowIndice
        const borderStyles = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
        let colIndiceContador = headers[1] ? headers[1].reduce((prev, curr) => prev += curr.colSpan, 0) : 0
        const sheet = workbook.getWorksheet(nombreHoja)
        for (const header of headers) {
            const row = sheet.getRow(rowIndiceContador)
            let colIndiceContador = colIndice
            for (let i = 0; i < header.length; i++) {
                let sumColIndice = true
                const dato = header[i]
                const datoExcel = row.getCell(colIndiceContador).value
                if (datoExcel) {
                    colIndiceContador += dato.colSpan;
                    sumColIndice = false
                    i--
                    continue
                };
                sheet.mergeCells(rowIndiceContador, colIndiceContador, rowIndiceContador + dato.rowSpan - 1, colIndiceContador + dato.colSpan - 1)
                row.getCell(colIndiceContador).value = dato.titulo
                row.getCell(colIndiceContador).border = borderStyles
                row.getCell(colIndiceContador).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                if (sumColIndice) {
                    colIndiceContador += dato.colSpan
                }
            }
            rowIndiceContador++
        }
        return { rowIndiceContador, colIndiceContador }

    },
    pintarExcel: function (sheet, startRowIndex = 1, startColumnIndex = 1, headers = [], bodies = [], numberColumnsOfFirstColum = 0, pintarExcelVacio = false) {
        try {
            const borderStyles = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            const alignmentStyle = { vertical: "middle", horizontal: "center", wrapText: true }
            let lastRowIndex = startRowIndex + headers.length + bodies.length
            const numeroColumnas = headers[0].datos.reduce((prev, curr) => {
                prev += (curr.colSpan ? curr.colSpan : 1);
                return prev;
            }, 0)
            let lastColumnIndex = startColumnIndex + 1 + numeroColumnas
            for (let i = 0; i < headers.length; i++) {
                let lastIndexCol = startColumnIndex + 1
                const { color = "#FFFFFF", ...headerActual } = headers[i]
                let accAnterior = 1;
                const rowIndexActual = startRowIndex + i
                const rowActual = sheet.getRow(rowIndexActual)
                const cellActual = rowActual.getCell(startColumnIndex)
                if (headerActual.item != "" || pintarExcelVacio) {

                    cellActual.border = borderStyles
                    cellActual.value = headerActual.item
                    cellActual.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: "FFFFFF" },
                        bgColor: { argb: "FFFFFF" }
                    }
                    cellActual.alignment = alignmentStyle
                }
                for (let j = 0; j < headerActual.datos.length; j++) {
                    const { color: colorDato = "#343A40", ...datoActual } = headerActual.datos[j]
                    let initColumn = startColumnIndex + 1 + j
                    lastIndexCol += datoActual.colSpan ? datoActual.colSpan : 1
                    if (headerActual.datos[j - 1]) {
                        accAnterior += headerActual.datos[j - 1].colSpan
                    }
                    if (datoActual.colSpan > 1) {
                        sheet.mergeCells(rowIndexActual, accAnterior + 1 + (startColumnIndex > 1 ? startColumnIndex - 1 : 0), rowIndexActual, lastIndexCol - 1)
                        initColumn += lastIndexCol
                    }
                    const cellActualDato = rowActual.getCell(lastIndexCol - 1)

                    cellActualDato.value = datoActual.titulo ? datoActual.titulo : datoActual.valor
                    cellActualDato.alignment = alignmentStyle
                    cellActualDato.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colorDato.replace("#", "") },
                        bgColor: { argb: colorDato.replace("#", "") }
                    }
                    cellActualDato.font = { color: { argb: "FFFFFF" } };
                    cellActualDato.border = borderStyles
                }
            }
            for (let i = 0; i < bodies.length; i++) {
                const { color = "ffffff", ...bodieActual } = bodies[i]
                const rowIndexActual = headers.length + 1 + i + (startRowIndex == 1 ? 0 : startRowIndex - 1)
                const rowActual = sheet.getRow(rowIndexActual)
                const cellActual = rowActual.getCell(startColumnIndex + numberColumnsOfFirstColum)
                if (bodieActual.item != "") {
                    cellActual.border = borderStyles
                    cellActual.value = bodieActual.item
                }

                cellActual.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: color.replace("#", "") },
                    bgColor: { argb: color.replace("#", "") }
                }
                cellActual.alignment = alignmentStyle
                for (let j = 0; j < bodieActual.datos.length; j++) {
                    const { color: colorDato = "ffffff", ...datoActual } = bodieActual.datos[j]
                    let initColumn = startColumnIndex + 1 + j + numberColumnsOfFirstColum
                    const cellActualDato = rowActual.getCell(initColumn)
                    cellActualDato.value = datoActual.valor
                    cellActualDato.alignment = alignmentStyle
                    cellActualDato.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colorDato.replace("#", "") },
                        bgColor: { argb: colorDato.replace("#", "") }
                    }
                    cellActualDato.border = borderStyles
                }
            }

            return { lastRowIndex, lastColumnIndex }

        } catch (error) {
            throw new ServerError(error.message, 500)
        }


    }
}

module.exports = alimentacionCosteoModelo