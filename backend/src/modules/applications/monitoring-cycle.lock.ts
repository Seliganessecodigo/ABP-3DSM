import { Injectable } from "@nestjs/common";

@Injectable()
export class MonitoringCycleLock {
  private locked = false;

  acquire(): boolean {
    if (this.locked) return false;
    this.locked = true;
    return true;
  }

  release(): void {
    this.locked = false;
  }
}
