var db=require('../dbconnection');

var categorias = {

    getAllcategorias:function(callback){

        return db.query("Select * from categorias",callback);

    },
    getcategoriasById:function(id,callback){

        return db.query("select * from categorias where idCategoria=?",[id],callback);
    },
    addcategorias:function(categorias,callback){
        console.log("inside service");
        console.log(categorias.Id);
        return db.query("INSERT INTO categorias (Categorias) values(?)",[categorias.Categorias],callback);
    },
    deletecategorias:function(id,callback){
        return db.query("delete from categorias where idCategoria=?",[id],callback);
    },
    updateCategorias:function(id,categorias,callback){
        return  db.query("UPDATE categorias set Categorias=? WHERE idCategoria=?",[categorias.Categorias, id], callback);
    },
    deleteAll:function(item,callback){

        var delarr=[];
        for(i=0;i<item.length;i++){

            delarr[i]=item[i].Id;
        }
        return db.query("delete from geproductos where IDPRODUCTO in (?)",[delarr],callback);
    },
    getUnidades:function(callback){

        return db.query("Select * from geunidad",callback);

    }
};
module.exports=categorias;
