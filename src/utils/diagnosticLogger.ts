/**
 * Sistema de Diagnóstico para Debug Silencioso
 * Registra erros sem quebrar a app, permitindo debug via localStorage
 */

interface DiagnosticLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  component: string;
  message: string;
  details?: any;
  unitId?: string;
}

class DiagnosticLogger {
  private logs: DiagnosticLog[] = [];
  private maxLogs = 100;
  private storageKey = 'btq_diagnostic_logs';

  constructor() {
    this.loadFromStorage();
  }

  log(level: 'info' | 'warn' | 'error', component: string, message: string, details?: any, unitId?: string) {
    const entry: DiagnosticLog = {
      timestamp: Date.now(),
      level,
      component,
      message,
      details,
      unitId
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.saveToStorage();

    // Também loga para console em desenvolvimento
    if (level === 'error') {
      console.error(`[${component}] ${message}`, details);
    } else if (level === 'warn') {
      console.warn(`[${component}] ${message}`, details);
    }
  }

  info(component: string, message: string, details?: any, unitId?: string) {
    this.log('info', component, message, details, unitId);
  }

  warn(component: string, message: string, details?: any, unitId?: string) {
    this.log('warn', component, message, details, unitId);
  }

  error(component: string, message: string, details?: any, unitId?: string) {
    this.log('error', component, message, details, unitId);
  }

  getLogsByUnit(unitId: string): DiagnosticLog[] {
    return this.logs.filter(log => log.unitId === unitId);
  }

  getAllLogs(): DiagnosticLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to save diagnostic logs', e);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load diagnostic logs', e);
    }
  }

  // Helper: Exporte logs para debug
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const diagnosticLogger = new DiagnosticLogger();
