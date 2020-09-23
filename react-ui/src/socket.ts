import socketIOClient from 'socket.io-client';

declare var filterXSS: any;

const serverURL =
    process.env.NODE_ENV === 'development'
        ? window.location.protocol + '//' + window.location.hostname + ':5000'
        : window.location.origin;

export const socket = socketIOClient(serverURL);
