var express = require('express');
var router = express.Router();
var programasVacunacion = require('../models/programa-vacunacion');
const auth = require('../middlewares/auth')
const upload = require('../config/multerXmlFileStorageConfig')

router.get('/getAll', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.getAllProgramasVacunacion();
    res.json(rows);
});

router.get('/:id?', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.getProgramasVacunacionByid(req.params.id);
    res.json(rows);
});

router.post('/', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.addProgramaVacunacion(req.body);
    res.json(rows);
});
router.post('/importar/:idProgramacionVacunacion', auth.isAuth, upload.single("file"), async function (req, res) {
    try {
        await programasVacunacion.importarData(req.file.path,
            req.params.idProgramacionVacunacion, req.user)
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})
router.put('/:id', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.updateProgramasVacunacion(req.body, req.params.id);
    res.json(rows);
});

router.delete('/:id', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.deleteProgramasVacunacion(req.params.id);
    res.json(rows);
})

router.delete('/detalle/:id', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.deleteProgramasVacunacionDet(req.params.id);
    res.json(rows);
})
router.post('/detalles/:id', auth.isAuth, async function (req, res, next) {
    try {
        await programasVacunacion.eliminarProgamacionDetalle(req.body.ids);
        res.send({ message: "exitoso" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

router.post('/detalle', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.addDetalleProgramaVacunacion(req.body);
    res.json(rows);
});

router.put('/detalle/:id', auth.isAuth, async function (req, res, next) {
    let rows = await programasVacunacion.updateDetalleProgramaVacunacion(req.body, req.params.id);
    res.json(rows);
});
module.exports = router;
