import { Component, Input, OnInit, signal } from '@angular/core';
import { DataConnection } from 'peerjs';
import { NgIf } from '@angular/common';
import { MeterGaugeComponent } from '../shared/meter-gauge/meter-gauge.component';
import { ConnectionDirectoryService } from '../../services/root-services/connection-directory.service';

@Component({
  selector: 'speed-test',
  standalone: true,
  imports: [NgIf, MeterGaugeComponent],
  templateUrl: './speed-test.component.html',
  styleUrl: './speed-test.component.scss',
})
export class SpeedTestComponent implements OnInit {
  @Input() peerId?: string;

  public currentSpeedInMbPs = 0;
  public averageSpeedInMbPs = 0;

  public showSpeedTest = false;
  public currentSpeedSignal = signal<number>(0);

  private readonly testData256Kb = new Uint8Array(256 * 1024);

  private _dataConnection?: DataConnection;
  private _statsRecord: { timestamp: number; bytesSent: number }[] = [];
  private _bytesSent: number = 0;
  private _timestamp?: number;
  private _startTime?: number;
  private _isRunning: boolean = false;

  constructor(private _connectionRegistry: ConnectionDirectoryService) {}

  ngOnInit(): void {
    if (!this.peerId) {
      return;
    }

    this._dataConnection = this._connectionRegistry.getConnectionById(this.peerId);
  }

  toggle() {
    this.showSpeedTest = !this.showSpeedTest;
  }

  onStart() {
    this._isRunning = true;
    this.runSpeedTest();
  }

  onStop() {
    this._isRunning = false;
  }

  runSpeedTest() {
    if (!this._dataConnection) {
      return;
    }

    const rtcDataChannel = this._dataConnection.dataChannel;

    const data = new Uint8Array(10 * 1024 * 1024);

    rtcDataChannel.send(this.testData256Kb);

    this._bytesSent = this.testData256Kb.length;
    this._timestamp = performance.now();
    this._statsRecord.push({ bytesSent: this._bytesSent, timestamp: this._timestamp });

    rtcDataChannel.onbufferedamountlow = () => {
      if (!this._isRunning) {
        return;
      }

      console.log('buffered amount low, sending one Mega byte.');
      rtcDataChannel.send(this.testData256Kb);

      this._statsRecord.push({
        bytesSent: this._bytesSent ?? 0 + this.testData256Kb.length,
        timestamp: performance.now(),
      });

      if (this._timestamp) {
        this.currentSpeedInMbPs = Math.floor(
          (this.testData256Kb.length / ((performance.now() - this._timestamp) * 1024 * 1024)) * 1000
        );
        this.currentSpeedSignal.set(this.currentSpeedInMbPs);
      }

      this._timestamp = performance.now();
      this._bytesSent += this.testData256Kb.length;
    };
  }
}
