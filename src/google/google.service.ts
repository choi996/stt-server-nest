import { Injectable, OnModuleInit } from '@nestjs/common';
import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleService implements OnModuleInit {
  private speechClient: SpeechClient;
  private jsonFilePath: string;

  onModuleInit() {
    const googlekeyjson = process.env.GOOGLE_CLOUD_KEY_JSON;
    if (!googlekeyjson) {
      throw new Error(
        'GOOGLE_CLOUD_KEY_JSON environment variable is not defined',
      );
    }

    // JSON 파일을 저장할 디렉토리 경로 설정
    const dirPath = 'key';

    // 디렉토리 생성 (존재하지 않을 경우에만)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // JSON 파일 경로 설정
    this.jsonFilePath = path.join(dirPath, 'secret.json');

    fs.writeFileSync(this.jsonFilePath, googlekeyjson, { encoding: 'utf8' });
    console.log(`JSON file restored at: ${this.jsonFilePath}`);
  }
  constructor() {
    this.speechClient = new SpeechClient({
      keyFilename: './key/secret.json',
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
