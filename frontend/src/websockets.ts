import { API } from "./api";
import { state } from "./state";

export const connectToWebsocket = () => {
    const ws = new WebSocket(`ws://localhost:3000`);
    ws.onopen = () => {
        console.log("Connected to websocket server");
    }
    ws.onmessage = (data) => {
        const message = JSON.parse(data.data.toString());
        state.events.sendMessage(message);
        console.log(message);
    }
    ws.onclose= () => {
        console.log("Disconnected from websocket server");
    }
    return ws;
}
