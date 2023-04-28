var express = require('express');
var router = express.Router();
var galpones = require('../models/galpones');
const auth = require('../middlewares/auth')

router.get('/:id?', function (req, res, next) {

    if (req.params.id > 0) {

        galpones.getGalponById(req.params.id, function (err, rows) {

            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }
        });
    } else {

        galpones.getAllGalpones(function (err, rows) {

            if (err) {
                res.json(err);
            } else {
                res.json(rows);
            }

        });
    }
});
router.post('/', auth.isAuth, function (req, res, next) {

    galpones.addGalpon(req.body, function (err, count) {

        //console.log(req.body);
        if (err) {
            res.json(err);
        } else {
            res.json(req.body); //or return count for 1 & 0
        }
    });
});
router.post('/:id', auth.isAuth, function (req, res, next) {
    galpones.deleteAll(req.body, function (err, count) {
        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }
    });
});
router.delete('/:id', auth.isAuth, function (req, res, next) {

    galpones.deleteGalpon(req.params.id, function (err, count) {

        if (err) {
            res.json(err);
        } else {
            res.json(count);
        }

    });
});
router.put('/:id', auth.isAuth, function (req, res, next) {

    galpones.updateGalpon(req.params.id, req.body, function (err, rows) {

        if (err) {
            res.json(err);
        } else {
            res.json(rows);
        }
    });
});
router.get('/getlotes/:idGalpon/:idLote/:idcorral', auth.isAuth, async function (req, res, next) {
    let rows3 = await galpones.getlotebyIDgalpon(req.params.idGalpon, req.params.idLote, req.params.idcorral);
    res.json(rows3);
})

router.get("/delete/:id/semana", auth.isAuth, async function (req, res) {
    await galpones.deleteSemana(req.params.id)
    res.send({ message: "exitoso" })
})
router.get('/getlotesxid/:idGalpon/:idLote/:idcorral', auth.isAuth, async function (req, res, next) {
    let rows6 = await galpones.getSemanasxidlotes(req.params.idGalpon, req.params.idLote, req.params.idcorral);
    res.json(rows6);
})
router.post('/getlotesxid/dataGalponesLotes', auth.isAuth, async function (req, res, next) {
    try {
        const data = await galpones.getDataPorIdLotesYGalpones(req.body)
        res.send(data)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

})
router.get('/getCorral/:idGalpon', auth.isAuth, async function (req, res, next) {
    let rows3 = await galpones.getlotebyIDcorral(req.params.idGalpon);
    res.json(rows3);
})
router.get('/getSemanas/:id', auth.isAuth, async function (req, res, next) {
    let rows4 = await galpones.getSemanaxidCorral(req.params.id);
    res.json(rows4);
})
router.get('/getcorralxidlote/:idGalpon/:idLote', auth.isAuth, async function (req, res, next) {
    let rows3 = await galpones.getlotebyIDgalponxloteid(req.params.idGalpon, req.params.idLote);
    res.json(rows3);
})
router.get('/SemanaExcel/:semana/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await galpones.Exportsemanal(req.params.semana, req.params.idLote);
    res.json(rows);
})
router.get('/SemanaExcelNac/:semana/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await galpones.ExportsemanalNac(req.params.semana, req.params.idLote);
    res.json(rows);
})
router.get('/SemanaFilter/:semana/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await galpones.ExportFiltersemanal(req.params.semana, req.params.idLote);
    res.json(rows);
})
router.put('/updatepesaje/:id', auth.isAuth, async function (req, res, next) {
    let rows8 = await galpones.updatePesaje(req.params.id, req.body);
    res.json(rows8);
})
router.get('/Semanasfilter/:idLote', auth.isAuth, async function (req, res, next) {
    let rows9 = await galpones.Semanafilter(req.params.idLote);
    console.log(req.params.idLote)
    res.json(rows9);
})
router.get('/ExportPesajes/:idLote/:Semana/:id', auth.isAuth, async function (req, res, next) {
    let rows11 = await galpones.ExportExcelSemanaxId(req.params.idLote, req.params.Semana, req.params.id);
    res.json(rows11);
})
router.get('/ExportPesajesNac/:idLote/:Semana/:id', auth.isAuth, async function (req, res, next) {
    let rows11 = await galpones.ExportExcelSemanaxIdNac(req.params.idLote, req.params.Semana, req.params.id);
    res.json(rows11);
})
router.get('/rutaspesajedet/:idLote/:id', auth.isAuth, async function (req, res, next) {
    let rows11 = await galpones.rutaspesajesdet(req.params.idLote, req.params.id);
    res.json(rows11);
})
router.get('/getInfo/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await galpones.getInfo(req.params.idLote);
    res.json(rows);
})
router.get('/grafica/:idLote', auth.isAuth, async function (req, res, next) {
    let rows = await galpones.grafica(req.params.idLote);
    res.json(rows);
})
module.exports = router;