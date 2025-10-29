const fs=require('fs');
const data=fs.readFileSync('backend/server.js','utf8');
const endpointRegex=/['\"`]\/api[^'\"`]*/g;
const endpoints=new Set();
let match;
while((match=endpointRegex.exec(data))){
	const text=match[0].slice(1);
	endpoints.add(text);
