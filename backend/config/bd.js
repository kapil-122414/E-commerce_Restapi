const mongoose=require ("mongoose");

const connectdb= async() => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("databse connected");
    }
    catch(error){
        console.error(error.message);
        process.exit(1);
    }
}  

 module.exports=connectdb;