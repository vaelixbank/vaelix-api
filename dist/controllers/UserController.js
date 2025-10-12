"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userQueries_1 = require("../queries/userQueries");
class UserController {
    static async getAllUsers(req, res) {
        try {
            const users = await userQueries_1.UserQueries.getAllUsers();
            res.json(users);
        }
        catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await userQueries_1.UserQueries.getUserById(parseInt(id));
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
        catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createUser(req, res) {
        try {
            const { email, full_name, phone, kyc_status } = req.body;
            const user = await userQueries_1.UserQueries.createUser(email, full_name, phone, kyc_status);
            res.status(201).json(user);
        }
        catch (error) {
            console.error('Error creating user:', error);
            if (error.code === '23505') { // Unique violation
                res.status(409).json({ error: 'User with this email already exists' });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { full_name, phone, kyc_status } = req.body;
            const user = await userQueries_1.UserQueries.updateUser(parseInt(id), full_name, phone, kyc_status);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
        catch (error) {
            console.error('Error updating user:', error);
            if (error.code === '23505') {
                res.status(409).json({ error: 'User with this email already exists' });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await userQueries_1.UserQueries.deleteUser(parseInt(id));
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.UserController = UserController;
