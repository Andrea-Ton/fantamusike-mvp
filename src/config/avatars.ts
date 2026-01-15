
export interface Avatar {
    id: string;
    path: string;
    label: string;
}

export const AVAILABLE_AVATARS: Avatar[] = [
    { id: 'm-01', path: '/avatars/avatar-m-01.png', label: 'Cyber Male 1' },
    { id: 'm-02', path: '/avatars/avatar-m-02.png', label: 'Cyber Male 2' },
    { id: 'm-03', path: '/avatars/avatar-m-03.png', label: 'Cyber Male 3' },
    { id: 'm-04', path: '/avatars/avatar-m-04.png', label: 'Cyber Male 4' },
    { id: 'f-01', path: '/avatars/avatar-f-01.png', label: 'Cyber Female 1' },
    { id: 'f-02', path: '/avatars/avatar-f-02.png', label: 'Cyber Female 2' },
    { id: 'f-03', path: '/avatars/avatar-f-03.png', label: 'Cyber Female 3' },
    { id: 'f-04', path: '/avatars/avatar-f-04.png', label: 'Cyber Female 4' },
];
