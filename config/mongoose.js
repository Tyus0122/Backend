const mongoose = require("mongoose");
const connectDb = async() =>{
    try{
        //console.log(process.env.CONNECTION_STRING_ATLAS)
        const connect = await mongoose.connect(process.env.CONNECTION_STRING_ATLAS,{ useNewUrlParser: true });
        console.log("database connected: ",connect.connection.host);
       // console.log(connect.connections);

    }
    catch(err){
        console.log(err);
        process.exit(1);
    }

    
      mongoose.connection.on('disconnected', () => {
        console.log('Mongoose connection is disconnected...');
      });
    
      process.on('SIGINT', () => {
        mongoose.connection.close().then(() => {
          console.log(
            'Mongoose connection is disconnected due to app termination...'
          );
          process.exit(0);
        });
      });
}



module.exports = connectDb;
