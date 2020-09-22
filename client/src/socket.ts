import socketIOClient from "socket.io-client";
import config from './config'

export const socket = socketIOClient(config.serverURL);