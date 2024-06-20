import { FileTransferStatusEnum } from './transfer-status-enum';

export interface FileTransferInfo {
  senderId: string;
  receiverId: string;
  isSender: boolean;
  fileName: string;
  fileSize: number;
  transferStatus: FileTransferStatusEnum;
  transferredBytes: number;
  transferStartTime: Date;
}
