var express = require('express');
var router = express.Router();
var mortalidad = require('../models/levanteSemana');

router.get('/lote/:id/:idLote',function(req,res,next){
    mortalidad.getLoteSemanalLevante(req.params.id,req.params.idLote,function(err,rows){
 
         if(err)
         {
             res.json(err);
         }
         else{
             res.json(rows);
         }
     });
 })

 router.get('/data/:id/:idLote',async function(req,res,next){
    let rows = await mortalidad.getAlimentoSemanalLevante(req.params.id,req.params.idLote);
    let data = []
    data.push(rows);
    let rows2 = await mortalidad.getMortalidadSemanalLevante(req.params.id,req.params.idLote);
    data.push(rows2);
    let rows3 = await mortalidad.getPesoSemanalLevante(req.params.id,req.params.idLote);
    data.push(rows3)                      
    res.json(data);
 })




router.get('/ultimo-dia/:id?',function(req,res,next){
   mortalidad.getmortalidadUltimoDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/dia/:idlevante/:edad',function(req,res,next){
    console.log('params', req.params);
   mortalidad.getmortalidadDia(req.params.idlevante, req.params.edad,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/levantes/',function(req,res,next){
   mortalidad.getMortalidadLevantes(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/levante/:id?',function(req,res,next){
   mortalidad.getMortalidadLevante(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/mortalidades/:id?',function(req,res,next){
   mortalidad.getMortalidadByIdLevante(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/dias/:id?',function(req,res,next){
   mortalidad.getmortalidadDia(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/edad-maximo/',function(req,res,next){
   mortalidad.getEdadMaximo(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/edad/:id?',function(req,res,next){
   mortalidad.getEdadEspecifica(req.params.id,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows);
        }
    });
})
router.get('/dia-inicio/',function(req,res,next){
   mortalidad.getDiaInicio(function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else{
            res.json(rows[0]);
        }
    });
})
router.get('/:id?',function(req,res,next){

    if(req.params.id > 0){

        mortalidad.getmortalidadById(req.params.id,function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else{
                res.json(rows);
            }
        });
    }else{

        mortalidad.getAllmortalidad(function(err,rows){

            if(err)
            {
                res.json(err);
            }
            else
            {
                res.json(rows);
            }

        });
    }
});
router.post('/',function(req,res,next){
    mortalidad.addMortalidad(req.body,function(err,count){

        //console.log(req.body);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/modal/',function(req,res,next){
    mortalidad.addMortalidadModal(req.body,function(err,count){

        //console.log(req.body);
        if(err)
        {
            res.json(err);
        }
        else{
            res.json(req.body);//or return count for 1 & 0
        }
    });
});
router.post('/:id',function(req,res,next){
    mortalidad.deleteAll(req.body,function(err,count){
        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }
    });
});
router.delete('/:id',function(req,res,next){

    mortalidad.deletemortalidad(req.params.id,function(err,count){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(count);
        }

    });
});
router.put('/:id',function(req,res,next){

    mortalidad.updateMortalidad(req.params.id,req.body,function(err,rows){

        if(err)
        {
            res.json(err);
        }
        else
        {
            res.json(rows);
        }
    });
});
module.exports=router;
