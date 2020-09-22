import socketIOClient from "socket.io-client";

declare var filterXSS: any;

const serverURL = process.env.SERVER_URL || 'http://localhost:5000'

console.log(process.env);

export const socket = socketIOClient(serverURL);