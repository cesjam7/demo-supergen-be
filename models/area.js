var db = require('../dbconnection');


const areaModel = {

    insertar: function ({ Desc_Area, Cod_Area }) {
        return new Promise((resolve, reject) => {
            db.query("insert into req_area(Cod_Area,Desc_Area) values(?,?)", [Cod_Area, Desc_Area], (err, results) => {
                if (err) reject(err)
                resolve()
            })

        })
    },
    editar: function ({ IdArea, Cod_Area, Desc_Area }) {
        return new Promise((resolve, reject) => {
            db.query("update req_area set Cod_area=?, Desc_Area=? where IdArea=?", [Cod_Area, Desc_Area, IdArea], (err, results) => {
                if (err) reject(err)
                resolve();
            })
        })

    }
}
module.exports = areaModel;