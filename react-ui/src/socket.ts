import socketIOClient from "socket.io-client";

declare var filterXSS: any;
var serverURL;

if (process.env.NODE_ENV === 'development') {
    serverURL = window.location.protocol + '//' + window.location.hostname + ':5000';
}
else {
    serverURL = window.location.origin;
}

console.log(serverURL)

export const socket = socketIOClient(serverURL);