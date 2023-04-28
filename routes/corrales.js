var express = require('express');
var router = express.Router();
var corrales = require('../models/corrales');
const auth = require('../middlewares/auth')

router.get('/:id?', function(req, res, next) {

    if (req.params.id > 0) {

        corrales.getGalponById(req.params.id, function(err, rows) {

            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }
        });
    } else {

        corrales.getAllGalpones(function(err, rows) {

            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }

        });
    }
});
router.post('/', auth.isAuth, function(req, res, next) {

    corrales.addGalpon(req.body, function(err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        } else {
            res.json(req.body); //or return count for 1 & 0
        }
    });
});
router.post('/:id', auth.isAuth, function(req, res, next) {
    corrales.deleteAll(req.body, function(err, count) {
        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function(req, res, next) {

    corrales.deleteGalpon(req.params.id, function(err, count) {

        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth, function(req, res, next) {

    corrales.updateGalpon(req.params.id, req.body, function(err, rows) {

        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
});
router.get('/getlotes/:idGalpon/:idLote/:idcorral', auth.isAuth, async function(req, res, next) {
    let rows3 = await corrales.getlotebyIDgalpon(req.params.idGalpon, req.params.idLote, req.params.idcorral);
    res.json(rows3);
})
router.get('/getlotesxid/:idGalpon/:idLote/:idcorral', auth.isAuth, async function(req, res, next) {
    let rows6 = await corrales.getSemanasxidlotes(req.params.idGalpon, req.params.idLote, req.params.idcorral);
    res.json(rows6);
})
router.get('/getCorral/:idGalpon', auth.isAuth, async function(req, res, next) {
    let rows3 = await corrales.getlotebyIDcorral(req.params.idGalpon);
    res.json(rows3);
})
router.get('/getSemanas/:id', auth.isAuth, async function(req, res, next) {
    let rows4 = await corrales.getSemanaxidCorral(req.params.id);
    res.json(rows4);
})
router.get('/getcorralxidlote/:idGalpon/:idLote', auth.isAuth, async function(req, res, next) {
    let rows3 = await corrales.getlotebyIDgalponxloteid(req.params.idGalpon, req.params.idLote);
    res.json(rows3);
})
router.get('/SemanaExcel/:semana/:idLote', auth.isAuth, async function(req, res, next) {
    let rows = await corrales.Exportsemanal(req.params.semana, req.params.idLote);
    res.json(rows);
})
router.get('/SemanaFilter/:semana/:idLote', auth.isAuth, async function(req, res, next) {
    let rows = await corrales.ExportFiltersemanal(req.params.semana, req.params.idLote);
    res.json(rows);
})
router.get('/reportesimplenac/:semana/:idLote', auth.isAuth, async function(req, res, next) {
    let rows = await corrales.reportesimplenac(req.params.semana, req.params.idLote);
    res.json(rows);
})
router.put('/updatepesaje/:id', auth.isAuth, async function(req, res, next) {
    let rows8 = await corrales.updatePesaje(req.params.id, req.body);
    res.json(rows8);
})
router.get('/Semanasfilter/:idLote', auth.isAuth, async function(req, res, next) {
    let rows9 = await corrales.Semanafilter(req.params.idLote);
    console.log(req.params.idLote)
    res.json(rows9);
})
router.get('/ExportPesajes/:idLote/:Semana/:id', auth.isAuth, async function(req, res, next) {
    let rows11 = await corrales.ExportExcelSemanaxId(req.params.idLote, req.params.Semana, req.params.id);
    res.json(rows11);
})
router.get('/rutaspesajedet/:idLote/:id', auth.isAuth, async function(req, res, next) {
    let rows11 = await corrales.rutaspesajesdet(req.params.idLote, req.params.id);
    res.json(rows11);
})
module.exports = router;