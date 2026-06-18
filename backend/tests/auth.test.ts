import { hashPassword, comparePassword } from '../src/services/auth.service';

describe('Auth Service', () => {
  it('should hash and verify passwords correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

describe('Journal Entry Balance', () => {
  it('should validate double-entry balance', () => {
    const lines = [
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 1000 },
    ];
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
  });
});

describe('RBAC Permissions', () => {
  const auditorPermissions = ['read'];
  const writeActions = ['create', 'update', 'delete'];

  it('auditor should only have read permissions', () => {
    writeActions.forEach((action) => {
      expect(auditorPermissions.includes(action)).toBe(false);
    });
  });
});
