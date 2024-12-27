import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GoogleService } from './google.service';

@WebSocketGateway({ namespace: '/google', cors: true })
export class GoogleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private recognizeStreams = new Map<string, any>();

  constructor(private readonly googleService: GoogleService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected Google: ${client.id}`);

    const recognizeStream = this.googleService
      .createRecognizeStream()
      .on('data', (data) => {
        const transcript = data.results
          .map((result) => result.alternatives[0].transcript)
          .join('\n');
        client.emit('transcript', { transcript });
      })
      .on('error', (error) => {
        console.error(`STT Error for client ${client.id}:`, error);
        client.emit('error', { message: error.message });
      });

    this.recognizeStreams.set(client.id, recognizeStream);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected Google: ${client.id}`);
    const recognizeStream = this.recognizeStreams.get(client.id);
    if (recognizeStream) {
      recognizeStream.end();
      this.recognizeStreams.delete(client.id);
    }
  }

  @SubscribeMessage('audioData')
  handleAudioData(client: Socket, payload: Buffer) {
    const recognizeStream = this.recognizeStreams.get(client.id);
    if (recognizeStream) {
      recognizeStream.write(payload);
    }
  }
}
