const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    Name : {
        type:String,
        required:true
    },
    Mobile : {
        type:String,
        required:true
    },
    Email : {
        type:String,
        required:true,
        unique:true
    },
    Password : {
        type:String,
        required:true
    },
    ConfirmPassword : {
        type:String,
        required:true
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})

userSchema.methods.generateToken = async function(){
    try {
        const token = jwt.sign({_id:this._id.toString()}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:token});
        await this.save();
        return token;
    } catch (error) {
        res.send("the error part"+error);
    }
}

userSchema.pre("save",  async function(next){
    if(this.isModified("Password")){
        this.Password = await bcrypt.hash(this.Password, 10);
        this.ConfirmPassword = await bcrypt.hash(this.ConfirmPassword, 10);
    }
    next();
} )

const Register = new mongoose.model("UserData", userSchema);

module.exports= Register;