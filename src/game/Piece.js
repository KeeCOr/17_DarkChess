export class Piece {
  constructor(type, owner) {
    this.type = type;
    this.owner = owner;
  }

  clone() {
    return new Piece(this.type, this.owner);
  }
}
