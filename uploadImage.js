const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const imageUpload = new mongoose.Schema({


        image:{
        	type:String,
        	default:''
        },
        email:{
                type:String,
                default:''
        }


});


var Image = mongoose.model('Image', imageUpload);
module.exports = Image;