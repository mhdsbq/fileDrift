import { TransferStatusEnum } from './transfer-status-enum';

export interface TransferInfo {
  fileName: string;
  fileSize: number;
  transferStatus: TransferStatusEnum;
  transferredBytes: number;
  transferStartTime?: Date;
  operationId: string;
}
