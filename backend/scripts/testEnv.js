require('dotenv').config();

console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('MONGODB_URI from env:', process.env.MONGODB_URI);