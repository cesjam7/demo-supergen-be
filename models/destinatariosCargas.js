const moment = require("moment")
const mysql = require("../dbconnectionPromise")
const sendEmail = require("./sendEmail")
const usuario = require("./usuario")


const destinatarioCargas = {

    enviarCorreoCarga: async function ({ LH, TotalHC, LM, TotalLM, ...carga },idUser) {
        const user = await usuario.getusuarioByIdPromise(idUser)

        const correos = await this.listar()
        const correosMap=correos.map(c => c.email)
        correosMap.push(user.email)
        const filasLm = LM.map(l => `<tr>
        <td style="text-align: center">
        ${l.lote_str}
        </td>
        <td>
        ${l.lote_str == 'HIILH' ? l.CodigoLote : '-'}
        </td>
        <td>
        ${l.Semana}
        </td>
        <td>
        ${l.TipoA}
        </td>
        <td>
        ${l.TipoB}
        </td>
        <td>
        ${l.TipoB1}
        </td>
        <td>
        ${l.TipoC}
        </td>
        <td>
        ${l.Total}
        </td>
        <td>
        ${l.HC}
        </td>
        <td>
        ${moment(l.Fecha_Postura_Inicio).format("DD/MM/YYYY")}
        </td>
   
        <td>
        ${moment(l.Fecha_Postura_Fin).format("DD/MM/YYYY")}
        </td>
   <td>
   ${l.DiasAlm}
   </td>
        </tr>`)
        const filasLh = LH.map(l => `<tr>
        <td style="text-align: center">
        ${l.lote_str}
        </td>
        <td>
        ${l.lote_str == 'HIILH' ? l.CodigoLote : '-'}
        </td>
        <td>
        ${l.Semana}
        </td>
        <td>
        ${l.TipoA}
        </td>
        <td>
        ${l.TipoB}
        </td>
        <td>
        ${l.TipoB1}
        </td>
        <td>
        ${l.TipoC}
        </td>
        <td>
        ${l.Total}
        </td>
        <td>
        ${l.HC}
        </td>
        <td>
        ${moment(l.Fecha_Postura_Inicio).format("DD/MM/YYYY")}
        </td>
   
        <td>
        ${moment(l.Fecha_Postura_Fin).format("DD/MM/YYYY")}
        </td>
   <td>
   ${l.DiasAlm}
   </td>
        </tr>`)
        const html = `
        <p>
        Se envia el resumen de Carga de cliente ${carga.Cliente} con fecha de Carga :${moment(carga.Fecha_Carga).format("DD/MM/YYYY")}
        </p>
        <div style="box-shadow:0 0 8px -3px black">
        <h1 style="text-align: center">RESUMEN DE CARGA</h1>
        <p style="text-align: center">
        <strong>Carga N° ${moment(carga.Fecha_Transferencia).format("YYYY")}-${carga.CodCarga}</strong>
        </p>
        <p>
        <strong>Cliente: </strong><span>${carga.Cliente}</span>${carga.Cliente2 != null && carga.Cliente2 != '0' ? `'<span>${carga.Cliente2}</span>'` : ''}
        </p>
        <p>
        <strong>RUC: </strong><span>${carga.RUC}</span>${carga.Cliente2 != null && carga.Cliente2 != '0' ? `'<span>${carga.RUC2}</span>'` : ''}
        </p>
        <p>
        <strong>Fecha de Carga: </strong><span>${moment(carga.Fecha_Carga).format("DD/MM/YYYY")}</span>
        </p>
        <p>
        <strong>Fecha de Transferencia: </strong><span>${moment(carga.Fecha_Transferencia).format("DD/MM/YYYY")}</span>
        </p>
        <p>
        <strong>Fecha de Nacimiento: </strong><span>${moment(carga.Fecha_Nacimiento).format("DD/MM/YYYY")}</span>
        </p>
        <p>
        <strong>Pedido de Hembras: </strong><span>${carga.Pedido_Hembras}</span>
        </p>
        <p>
        <strong>Pedido de Macho: </strong><span>${carga.Pedido_Machos}</span>
        </p>
        <div style="margin-top:2rem">
        
        <h4>Linea Hembra</h4>
        <table>
        <thead>
        <tr style="background-color: #f5f5f5">
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Lote</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Código</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Edad(Sem)</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" colspan="4">HI cargados</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Total</th>

        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">H.C.</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Fecha Inicio Postura</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Fecha Fin Postura</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;" rowspan="2">Dias Almacenados</th>
    </tr>
    <tr style="background-color: #f5f5f5">
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">TIPO A</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">TIPO B</th>
        <th class="text-center" style="vertical-align: middle    padding: 1rem;;">TIPO B1</th>
        <th class="text-center" style="vertical-align: middle;    padding: 1rem;">TIPO C</th>
    </tr>
        
        
        </thead>
        <tbody>
        ${filasLh.join("\n")}

        <tr  style="background-color: #f5f5f5">
        <th class="text-center" colspan="3">Totales</th>
        <td class="text-center">${TotalHC.TipoA}  </td>
        <td class="text-center">${TotalHC.TipoB}</td>
        <td class="text-center">${TotalHC.TipoB1}</td>
        <td class="text-center">${TotalHC.TipoC}</td>
        <td class="text-center" style="vertical-align: middle;">${TotalHC.Total}</td>

        <td class="text-center" style="vertical-align: middle;">${TotalHC.TotalHC}</th>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        </tbody>
        </table>
        </div>
        <div style="margin-top:2rem">
       <h4>Linea Macho</h4>
        <table>
        <thead>
        <tr style="background-color: #f5f5f5">
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Lote</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Código</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Edad(Sem)</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" colspan="4">HI cargados</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Total</th>

        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">H.C.</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Fecha Inicio Postura</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Fecha Fin Postura</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem" rowspan="2">Dias Almacenados</th>
    </tr>
    <tr style="background-color: #f5f5f5">
        <th class="text-center" style="vertical-align: middle;padding: 1rem">TIPO A</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem">TIPO B</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem">TIPO B1</th>
        <th class="text-center" style="vertical-align: middle;padding: 1rem">TIPO C</th>
    </tr>
        </thead>
        <tbody>
        ${filasLm.join("\n")}
        <tr  style="background-color: #f5f5f5">
        <th class="text-center" colspan="3">Totales</th>
        <td class="text-center">${TotalLM.TipoA}  </td>
        <td class="text-center">${TotalLM.TipoB}</td>
        <td class="text-center">${TotalLM.TipoB1}</td>
        <td class="text-center">${TotalLM.TipoC}</td>
        <td class="text-center" style="vertical-align: middle;">${TotalLM.Total}</td>

        <td class="text-center" style="vertical-align: middle;">${TotalLM.TotalHC}</th>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        </tbody>
        </table>
        </div>
        </div>`
        await sendEmail.sendEmail(`Resumen de Carga n° ${moment(carga.Fecha_Transferencia).format("YYYY")}-${carga.CodCarga}   Cliente: ${carga.Cliente}, Fec.Carga ${moment(carga.Fecha_Carga).format("DD/MM/YYYY")} Fec.Nac. ${moment(carga.Fecha_Nacimiento).format("DD/MM/YYYY")}`, correosMap, html)

    },
    crear: async function ({ email }) {
        try {
            await mysql.query(`insert into destinatario_cargas(email)values('${email}')`)
        } catch (error) {
            throw error
        }
    },
    editar: async function ({ email, id }) {
        try {
            await mysql.query(`update destinatario_cargas set email='${email}' where id=${id}`)
        } catch (error) {
            throw error
        }


    },
    listar: async function () {
        try {
            const data = await mysql.query(`select * from destinatario_cargas where activo=1`)
            return data
        } catch (error) {
            throw error
        }

    },
    eliminar: async function (idDestinatario) {
        try {
            await mysql.query(`update destinatario_cargas set activo=0 where id=${idDestinatario}`)
        } catch (error) {
            throw error
        }

    },

}

module.exports = destinatarioCargas