import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { PlacementScene } from './scenes/PlacementScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { MultiplayerLobbyScene } from './scenes/MultiplayerLobbyScene.js';
import { LAYOUT } from './config.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: LAYOUT.GAME_WIDTH,
  height: LAYOUT.GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MenuScene, PlacementScene, GameScene, UIScene, ResultScene, TutorialScene, MultiplayerLobbyScene],
});
