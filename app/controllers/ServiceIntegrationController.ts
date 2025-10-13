import { Request, Response } from 'express';
import { ServiceQueries } from '../queries/serviceQueries';
import { CreateServiceIntegrationRequest, UpdateServiceIntegrationRequest } from '../models/ServiceIntegration';

export class ServiceIntegrationController {
  static async getAllServiceIntegrations(req: Request, res: Response) {
    try {
      const integrations = await ServiceQueries.getAllServiceIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching service integrations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getServiceIntegration(req: Request, res: Response) {
    try {
      const { serviceName } = req.params;
      const integration = await ServiceQueries.getServiceIntegration(serviceName);

      if (!integration) {
        return res.status(404).json({ error: 'Service integration not found' });
      }

      res.json(integration);
    } catch (error) {
      console.error('Error fetching service integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createServiceIntegration(req: Request, res: Response) {
    try {
      const { service_name, api_key, auth_token, base_url }: CreateServiceIntegrationRequest = req.body;

      if (!service_name || !api_key || !auth_token) {
        return res.status(400).json({ error: 'service_name, api_key, and auth_token are required' });
      }

      const integration = await ServiceQueries.createServiceIntegration(service_name, api_key, auth_token, base_url);

      res.status(201).json(integration);
    } catch (error) {
      console.error('Error creating service integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateServiceIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { api_key, auth_token, base_url, is_active }: UpdateServiceIntegrationRequest = req.body;

      const updatedIntegration = await ServiceQueries.updateServiceIntegration(parseInt(id), api_key, auth_token, base_url, is_active);

      if (!updatedIntegration) {
        return res.status(404).json({ error: 'Service integration not found' });
      }

      res.json(updatedIntegration);
    } catch (error) {
      console.error('Error updating service integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteServiceIntegration(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deletedIntegration = await ServiceQueries.deleteServiceIntegration(parseInt(id));

      if (!deletedIntegration) {
        return res.status(404).json({ error: 'Service integration not found' });
      }

      res.json({ message: 'Service integration deleted successfully' });
    } catch (error) {
      console.error('Error deleting service integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}