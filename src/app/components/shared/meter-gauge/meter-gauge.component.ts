import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, Signal, computed, signal } from '@angular/core';

export interface MeterGaugeStyle {
  backgroundColor: string;
  meterColor: string;
  gaugeColor: string;
}

@Component({
  selector: 'meter-gauge',
  standalone: true,
  imports: [NgIf],
  templateUrl: './meter-gauge.component.html',
  styleUrl: './meter-gauge.component.scss',
})
export class MeterGaugeComponent implements OnInit {
  private readonly _maxTurnRotation = 0.5;
  private readonly _defaultStyle: MeterGaugeStyle = {
    backgroundColor: '#ccc',
    gaugeColor: 'slateblue',
    meterColor: 'grey',
  };

  @Input() minValue: number = 0;
  @Input() maxValue: number = 100;
  @Input() unit: string = 'MbPs';
  @Input() value: Signal<number> = signal(0);
  @Input() styles: MeterGaugeStyle = this._defaultStyle;
  @Input() enableStartButton = true; // TODO: Turn false before merging, this is for testing only

  @Output() start = new EventEmitter<void>();
  @Output() stop = new EventEmitter<void>();

  public turnRotation: Signal<number> = signal(0);
  public state: 'idle' | 'running' = 'idle';

  ngOnInit(): void {
    this.turnRotation = computed(() => this.calculateRotation(this.value(), this.minValue, this.maxValue));
  }

  onStart() {
    this.state = 'running';
    this.start.emit();
  }

  onStop() {
    this.state = 'idle';
    this.stop.emit();
  }

  calculateRotation(value: number, min: number, max: number): number {
    if (this.state === 'idle') {
      return 0 * this._maxTurnRotation;
    }

    if (value <= min) {
      return 0 * this._maxTurnRotation;
    }

    if (value >= max) {
      return 1 * this._maxTurnRotation;
    }

    const range = max - min;
    const delta = value - min;

    return (delta / range) * this._maxTurnRotation;
  }
}
