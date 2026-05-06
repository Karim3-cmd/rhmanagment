import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getToken, setToken, removeToken, authApi, employeesApi, departmentsApi, skillsApi, notificationsApi, settingsApi } from './api';

// Mock axios
vi.mock('axios', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    create: vi.fn(),
  };
  mockApi.create = vi.fn(() => mockApi);
  return { default: mockApi };
});

// Mock the api instance directly
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

describe('Token utilities', () => {
  beforeEach(() => localStorage.clear());

  it('getToken returns null when not set', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores token in localStorage', () => {
    setToken('my-token');
    expect(localStorage.getItem('hrbrain_token')).toBe('my-token');
  });

  it('getToken returns stored token', () => {
    localStorage.setItem('hrbrain_token', 'abc123');
    expect(getToken()).toBe('abc123');
  });

  it('removeToken clears token from localStorage', () => {
    localStorage.setItem('hrbrain_token', 'abc123');
    removeToken();
    expect(localStorage.getItem('hrbrain_token')).toBeNull();
  });
});

describe('authApi', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('login stores token and returns data', async () => {
    const { api } = await import('./api');
    vi.mocked(api.post).mockResolvedValue({
      data: { message: 'ok', access_token: 'token123', user: { _id: '1', name: 'Test' } },
    });
    const result = await authApi.login({ email: 'a@b.com', password: 'pass' });
    expect(result.access_token).toBe('token123');
    expect(localStorage.getItem('hrbrain_token')).toBe('token123');
  });

  it('register returns user data', async () => {
    const { api } = await import('./api');
    vi.mocked(api.post).mockResolvedValue({
      data: { message: 'created', user: { _id: '2', name: 'New User' } },
    });
    const result = await authApi.register({ name: 'New', email: 'n@b.com', password: 'pass', role: 'Employee' });
    expect(result.user.name).toBe('New User');
  });

  it('logout removes token', () => {
    localStorage.setItem('hrbrain_token', 'tok');
    authApi.logout();
    expect(localStorage.getItem('hrbrain_token')).toBeNull();
  });

  it('listUsers returns users list', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { total: 1, items: [{ _id: '1' }] } });
    const result = await authApi.listUsers();
    expect(result.total).toBe(1);
  });

  it('getUser returns single user', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { _id: '1', name: 'Test' } });
    const result = await authApi.getUser('1');
    expect(result._id).toBe('1');
  });
});

describe('employeesApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list returns employees', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { total: 2, items: [] } });
    const result = await employeesApi.list();
    expect(result.total).toBe(2);
  });

  it('get returns single employee', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { _id: 'e1', fullName: 'John' } });
    const result = await employeesApi.get('e1');
    expect(result.fullName).toBe('John');
  });

  it('create returns new employee', async () => {
    const { api } = await import('./api');
    vi.mocked(api.post).mockResolvedValue({ data: { _id: 'e2', fullName: 'Jane' } });
    const result = await employeesApi.create({ fullName: 'Jane' });
    expect(result.fullName).toBe('Jane');
  });

  it('update returns updated employee', async () => {
    const { api } = await import('./api');
    vi.mocked(api.patch).mockResolvedValue({ data: { _id: 'e1', fullName: 'Updated' } });
    const result = await employeesApi.update('e1', { fullName: 'Updated' });
    expect(result.fullName).toBe('Updated');
  });

  it('remove returns message', async () => {
    const { api } = await import('./api');
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'deleted' } });
    const result = await employeesApi.remove('e1');
    expect(result.message).toBe('deleted');
  });
});

describe('departmentsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list returns departments', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { total: 3, items: [] } });
    const result = await departmentsApi.list();
    expect(result.total).toBe(3);
  });

  it('create returns new department', async () => {
    const { api } = await import('./api');
    vi.mocked(api.post).mockResolvedValue({ data: { _id: 'd1', name: 'IT' } });
    const result = await departmentsApi.create({ name: 'IT' });
    expect(result.name).toBe('IT');
  });
});

describe('skillsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list returns skills', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { total: 5, items: [] } });
    const result = await skillsApi.list();
    expect(result.total).toBe(5);
  });

  it('list filters by employeeId', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({
      data: {
        total: 2,
        items: [
          { _id: 's1', assignments: [{ employeeId: 'emp1' }] },
          { _id: 's2', assignments: [{ employeeId: 'emp2' }] },
        ],
      },
    });
    const result = await skillsApi.list({ employeeId: 'emp1' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]._id).toBe('s1');
  });

  it('assign calls correct endpoint', async () => {
    const { api } = await import('./api');
    vi.mocked(api.post).mockResolvedValue({ data: { _id: 's1' } });
    await skillsApi.assign('s1', { employeeId: 'emp1' });
    expect(api.post).toHaveBeenCalledWith('/skills/s1/assign', { employeeId: 'emp1' }, {});
  });
});

describe('notificationsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list returns notifications', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { total: 1, unread: 1, items: [] } });
    const result = await notificationsApi.list({ userId: 'u1' });
    expect(result.unread).toBe(1);
  });

  it('markRead calls correct endpoint', async () => {
    const { api } = await import('./api');
    vi.mocked(api.patch).mockResolvedValue({ data: { _id: 'n1', read: true } });
    await notificationsApi.markRead('n1');
    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read', {}, {});
  });

  it('markAllRead calls correct endpoint', async () => {
    const { api } = await import('./api');
    vi.mocked(api.patch).mockResolvedValue({ data: { message: 'ok' } });
    await notificationsApi.markAllRead('u1');
    expect(api.patch).toHaveBeenCalledWith('/notifications/read/all/u1', {}, {});
  });

  it('remove calls correct endpoint', async () => {
    const { api } = await import('./api');
    vi.mocked(api.delete).mockResolvedValue({ data: { message: 'deleted' } });
    await notificationsApi.remove('n1');
    expect(api.delete).toHaveBeenCalledWith('/notifications/n1', {});
  });
});

describe('settingsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('get returns user settings', async () => {
    const { api } = await import('./api');
    vi.mocked(api.get).mockResolvedValue({ data: { userId: 'u1', theme: 'dark' } });
    const result = await settingsApi.get('u1');
    expect(result.theme).toBe('dark');
  });

  it('update returns updated settings', async () => {
    const { api } = await import('./api');
    vi.mocked(api.patch).mockResolvedValue({ data: { userId: 'u1', theme: 'light' } });
    const result = await settingsApi.update('u1', { theme: 'light' });
    expect(result.theme).toBe('light');
  });
});
