export interface SecurityIncident {
  id: number;
  incident_type: string;
  description: string;
  detected_at: Date;
}

export interface CreateSecurityIncidentRequest {
  incident_type: string;
  description: string;
}