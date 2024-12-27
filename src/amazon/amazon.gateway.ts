import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  StartStreamTranscriptionCommand,
  TranscribeStreamingClient,
} from '@aws-sdk/client-transcribe-streaming';

@WebSocketGateway({ namespace: '/amazon', cors: true })
export class AmazonGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private lastTranscript = '';
  private isTranscribing = false;

  private transcribeClient = new TranscribeStreamingClient({
    region: 'ap-northeast-2',
    credentials: {
      accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
      secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY_ID,
    },
  });

  @WebSocketServer()
  server: Server;

  constructor() {}

  handleConnection(client: Socket) {
    console.log(`Client connected Amazon: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.isTranscribing = false;
  }

  @SubscribeMessage('startTranscription')
  async handleStartTranscription(client: Socket) {
    console.log('Starting transcription');
    this.isTranscribing = true;
    let buffer = Buffer.from('');

    const audioStream = async function* () {
      while (this.isTranscribing) {
        const chunk = await new Promise((resolve) =>
          client.once('audioData', resolve),
        );
        if (chunk === null) break;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

        while (buffer.length >= 1024) {
          yield { AudioEvent: { AudioChunk: buffer.slice(0, 1024) } };
          buffer = buffer.slice(1024);
        }
      }
    }.bind(this);

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: 'ko-KR',
      MediaSampleRateHertz: 44100,
      MediaEncoding: 'pcm',
      AudioStream: audioStream(),
      VocabularyName: 'myvoca',
    });

    try {
      const response = await this.transcribeClient.send(command);
      for await (const event of response.TranscriptResultStream) {
        if (!this.isTranscribing) break;

        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          if (results.length > 0 && results[0].Alternatives.length > 0) {
            const transcript = results[0].Alternatives[0].Transcript;
            const isFinal = !results[0].IsPartial;

            if (isFinal) {
              client.emit('transcription', { transcript, isFinal: true });
              this.lastTranscript = transcript;
            } else {
              const newPart = transcript.substring(this.lastTranscript.length);
              if (newPart.trim() !== '') {
                client.emit('transcription', {
                  transcript: newPart,
                  isFinal: false,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      client.emit('error', 'Transcription error occurred: ' + error.message);
    }
  }

  @SubscribeMessage('stopTranscription')
  handleStopTranscription() {
    console.log('Stopping transcription');
    this.isTranscribing = false;
    this.lastTranscript = '';
  }
}
