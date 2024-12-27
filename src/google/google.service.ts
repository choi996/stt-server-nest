import { Injectable } from '@nestjs/common';
import { SpeechClient } from '@google-cloud/speech';

@Injectable()
export class GoogleService {
  private speechClient: SpeechClient;

  constructor() {
    this.speechClient = new SpeechClient({
      keyFilename: './key.json',
    });
  }

  createRecognizeStream() {
    return this.speechClient.streamingRecognize({
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
        speechContexts: [
          {
            phrases: [
              '엔진오일',
              '배터리',
              '양호',
              '주의',
              '교체',
              '오케이',
              '확인',
              'km',
              '외부벨트',
              '텐셔너',
              '전면',
              '헤드램프',
              '테일램프',
              '보닛',
              '트렁크',
            ],
            boost: 10,
          },
        ],
      },
      interimResults: true,
    });
  }
}
