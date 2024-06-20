import { FileInfo } from './file-info';
import { ResponseStatusEnum } from './response-status-enum';

export interface FileSendResponse {
  fileSenderId: string;
  fileReceiverId: string;
  fileInfo: FileInfo;
  responseStatus: ResponseStatusEnum;
}
