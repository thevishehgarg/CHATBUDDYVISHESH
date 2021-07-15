const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(()=>{
    console.log(`connection successfull`);
}).catch((e)=>{
    console.log(`no connection`);
});

