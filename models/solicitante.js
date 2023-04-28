var db = require('../dbconnection');
function guardar({ Desc_Solicitante, Cod_Solicitante }) {
    return new Promise((resolve, reject) => {
        db.query("insert into req_solicitante(Cod_Solicitante,Desc_Solicitante) values(?,?)", [Cod_Solicitante, Desc_Solicitante], (err, results) => {
            if (err) reject(err)
            resolve()
        })

    })
}
function editar({ IdSolicitante, Cod_Solicitante, Desc_Solicitante }) {
    return new Promise((resolve, reject) => {
        db.query("update req_solicitante set Cod_Solicitante=?, Desc_Solicitante=? where IdSolicitante=?", [Cod_Solicitante, Desc_Solicitante, IdSolicitante], (err, results) => {
            if (err) reject(err)
            resolve();
        })
    })

}
module.exports = {
    editar,
    guardar
};


