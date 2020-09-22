import socketIOClient from "socket.io-client";

declare var filterXSS: any;

const port = process.env.PORT || '5000';
const serverURL = window.location.protocol + '//' + window.location.hostname + `:${port}`;
console.log(serverURL)

export const socket = socketIOClient(serverURL);