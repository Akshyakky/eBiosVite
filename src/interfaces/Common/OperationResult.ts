//interfaces/OperationResults
export interface ValidationError {
  propertyName: string;
  errorMessage: string;
}

export interface ConcurrencyConflictInfo {
  propertyName: string;
  currentValue: any;
  databaseValue: any;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
  affectedRows?: number;
  validationErrors?: ValidationError[];
  additionalData?: { [key: string]: any };
  concurrencyConflict?: boolean;
  databaseValues?: any;
  currentValues?: any;
}
