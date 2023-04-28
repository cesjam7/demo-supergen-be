var express = require('express');
var router = express.Router();
var tareo = require('../models/tareo');
const auth = require('../middlewares/auth')

router.post("/export-excel", auth.isAuth, async function (req, res, next) {
    let rows = await tareo.exportExcelConsultaDetalle({...req.body})
    if (rows.success == true) {
        rows.pathComplete = "/supergen-be" + rows.path;
    		res.json(rows);
		} else {
			res.json({
				success: false,
				message: 'Ocurrio un error en el servidor'
			})

		}
})

module.exports = router;
