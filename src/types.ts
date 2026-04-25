export type EmployeeRole = 'employee' | 'facilitator' | 'superuser';

export type Employee = {
    "Employee ID": string;
    "Name": string;
    "Email": string;
    "Team": string;
    "Cluster": string;
    "Wave": string;
    "role"?: EmployeeRole;
};

export type ThemeMode = 'light' | 'dark';
