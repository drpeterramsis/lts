export type EmployeeRole = 'employee' | 'facilitator' | 'superuser';

export type Employee = {
    id: string;
    name: string;
    email: string;
    team: string; // "A", "B", "C", "D"
    cluster: string; // "1", "2"...
    wave: string;
    role?: EmployeeRole;
};

export type ThemeMode = 'light' | 'dark';
