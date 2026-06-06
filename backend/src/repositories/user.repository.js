import { query } from "../config/database.js";
import { BaseRepository } from "./base.repository.js";

class UserRepository extends BaseRepository {
  constructor() {
    super("users");
  }

  findByUsername(username) {
    return query("SELECT * FROM users WHERE username = ? LIMIT 1", [username]);
  }

  findActiveById(id) {
    return query("SELECT * FROM users WHERE id = ? AND is_active = TRUE LIMIT 1", [id]);
  }
}

export const userRepository = new UserRepository();

