import { query } from "../config/database.js";

export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  findById(id) {
    return query(`SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`, [id]);
  }

  findAll({ limit = 20, offset = 0 } = {}) {
    return query(`SELECT * FROM ${this.tableName} ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]);
  }
}

