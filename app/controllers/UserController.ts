import { Request, Response } from 'express';
import pool from '../utils/database';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/User';

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { email, full_name, phone, kyc_status }: CreateUserRequest = req.body;

      const result = await pool.query(
        'INSERT INTO users (email, full_name, phone, kyc_status) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, full_name, phone, kyc_status]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ error: 'User with this email already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, full_name, phone, kyc_status }: UpdateUserRequest = req.body;

      const result = await pool.query(
        'UPDATE users SET email = COALESCE($1, email), full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), kyc_status = COALESCE($4, kyc_status), updated_at = NOW() WHERE id = $5 RETURNING *',
        [email, full_name, phone, kyc_status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.code === '23505') {
        res.status(409).json({ error: 'User with this email already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}