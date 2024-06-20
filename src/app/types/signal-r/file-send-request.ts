import { FileInfo } from './file-info';

export interface FileSendRequest {
  fileSenderId: string;
  fileReceiverId: string;
  fileInfo: FileInfo;
}
