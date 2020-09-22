import socketIOClient from "socket.io-client";

declare var filterXSS: any;

const serverURL = window.location.origin;
console.log(serverURL)

export const socket = socketIOClient(serverURL);