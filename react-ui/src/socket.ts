import socketIOClient from "socket.io-client";

declare var filterXSS: any;

const serverURL = window.location.protocol + '//' + window.location.hostname + ':5000';

export const socket = socketIOClient(serverURL);