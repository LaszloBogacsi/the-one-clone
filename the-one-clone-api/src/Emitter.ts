import {Namespace, Socket} from "socket.io";

export class Emitter {
    constructor(private readonly io: Namespace, private readonly roomId: string) {
    }

    emit(event: string, args: { [key: string]: any }) {
        this.io.to(this.roomId).emit(event, args)
    }

    emitToClient(clientId: string, event: string, args: { [key: string]: any }) {
        this.getClient(clientId)?.emit(event, args)
    }

    hasClient(clientId: string): boolean {
        return this.io.sockets.has(clientId);
    }

    getClient(clientId: string): Socket | undefined {
        return this.io.sockets.get(clientId);
    }

}