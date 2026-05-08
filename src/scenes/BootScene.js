// src/scenes/BootScene.js
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // No external assets — all rendering uses Phaser Graphics primitives
  }

  create() {
    this.scene.start('Menu');
  }
}
