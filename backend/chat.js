const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema2 = new mongoose.Schema({


        fromEmail:{
        	type:String,
        	default:''
        },
        toEmail:{
        	type:String,
        	default:''
        },
        message:{
        	type:Array,
        	default:[]
        }

});


var Chat = mongoose.model('user2', UserSchema2);
module.exports = Chat;