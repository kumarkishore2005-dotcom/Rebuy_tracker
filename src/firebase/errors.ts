import { getAuth, type User } from "firebase/auth";

export type SecurityRuleOperation = 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';

export interface SecurityRuleContext {
  path: string;
  operation: SecurityRuleOperation;
  requestResourceData?: any;
}

export class FirestorePermissionError extends Error {
  private context: SecurityRuleContext;
  private auth: User | null;

  constructor(context: SecurityRuleContext) {
    const debugMessage = FirestorePermissionError.generateDebugMessage(context);
    super(debugMessage);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    try {
      this.auth = getAuth().currentUser;
    } catch (e) {
      this.auth = null;
    }

    // This is for V8 compatibility.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  private static generateDebugMessage(context: SecurityRuleContext): string {
    return `Firestore Security Rules denied a '${context.operation}' request on path '${context.path}'.`;
  }

  public getDebugMessage(): string {
    return this.message;
  }

  public getContext() {
    return {
      ...this.context,
      auth: this.auth ? this.auth.toJSON() : null,
    };
  }
}
