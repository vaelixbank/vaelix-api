import { Request, Response } from 'express';
import { UserQueries } from '../queries/userQueries';

interface CreateUserRequest {
  email: string;
  full_name: string;
  phone?: string;
  kyc_status?: string;
}

interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  kyc_status?: string;
}

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserQueries.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserQueries.getUserById(parseInt(id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { email, full_name, phone, kyc_status }: CreateUserRequest = req.body;

      const user = await UserQueries.createUser(email, full_name, phone, kyc_status);

      res.status(201).json(user);
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
      const { full_name, phone, kyc_status }: UpdateUserRequest = req.body;

      const user = await UserQueries.updateUser(parseInt(id), full_name, phone, kyc_status);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
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
      const user = await UserQueries.deleteUser(parseInt(id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}