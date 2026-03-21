<<<<<<< HEAD
import themeGroups from './themeGroups.json';

export const THEME_GROUPS = themeGroups;
=======
export const THEME_GROUPS = [
    {
        label: '🔥 Warm',
        themes: [
            {
                id: 'flax', name: 'Flax',
                light: { bg: '#F8F5F2', card: '#FFFCFA', sidebar: '#EEEAE4', primary: '#7B6751', highlight: '#C4A35A', border: 'rgba(74,52,33,0.12)', text: '#1A1A1A' },
                dark: { bg: '#1a1310', card: '#241a14', sidebar: '#201812', primary: '#B89B7E', highlight: '#E8DCC8', border: 'rgba(180,155,126,0.18)', text: '#f1f5f9' }
            },
            {
                id: 'coral', name: 'Coral',
                light: { bg: '#FFF4F2', card: '#FFFFFF', sidebar: '#FCE5E1', primary: '#E0634E', highlight: '#F3A79C', border: 'rgba(224,99,78,0.12)', text: '#1A1A1A' },
                dark: { bg: '#261715', card: '#2F1E1B', sidebar: '#2A1A18', primary: '#F3A79C', highlight: '#E0634E', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
            {
                id: 'rust', name: 'Rust',
                light: { bg: '#F7F2EF', card: '#FFFFFF', sidebar: '#EFE3DD', primary: '#A0523D', highlight: '#D29A8A', border: 'rgba(160,82,61,0.12)', text: '#1A1A1A' },
                dark: { bg: '#211A18', card: '#2B2220', sidebar: '#251E1C', primary: '#D29A8A', highlight: '#A0523D', border: 'rgba(160,82,61,0.18)', text: '#f1f5f9' }
            },
            {
                id: 'amber', name: 'Amber',
                light: { bg: '#FAF5EF', card: '#FFFFFF', sidebar: '#F1E5D7', primary: '#B57A42', highlight: '#E3B285', border: 'rgba(120,80,30,0.12)', text: '#1A1A1A' },
                dark: { bg: '#1F1A12', card: '#29221A', sidebar: '#241E16', primary: '#E3B285', highlight: '#B57A42', border: 'rgba(200,160,100,0.18)', text: '#f1f5f9' }
            },
        ],
    },
    {
        label: '❄️ Cool',
        themes: [
            {
                id: 'ocean', name: 'Ocean',
                light: { bg: '#F3F7FA', card: '#FFFFFF', sidebar: '#E7EFF5', primary: '#4F6D8A', highlight: '#7FA7C2', border: 'rgba(50,70,90,0.12)', text: '#1A1A1A' },
                dark: { bg: '#1C252E', card: '#242F3A', sidebar: '#202A34', primary: '#7FA7C2', highlight: '#4F6D8A', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
            {
                id: 'indigo', name: 'Indigo',
                light: { bg: '#F3F4FA', card: '#FFFFFF', sidebar: '#E8EBF5', primary: '#4C5D8A', highlight: '#8C9FD1', border: 'rgba(60,70,120,0.12)', text: '#1A1A1A' },
                dark: { bg: '#1C1E2C', card: '#232534', sidebar: '#20222F', primary: '#8C9FD1', highlight: '#4C5D8A', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
            {
                id: 'teal', name: 'Teal',
                light: { bg: '#F2F7F7', card: '#FFFFFF', sidebar: '#E4F0F0', primary: '#3F7C7C', highlight: '#7DB5B5', border: 'rgba(40,90,90,0.12)', text: '#1A1A1A' },
                dark: { bg: '#192526', card: '#1F2E30', sidebar: '#1D2A2B', primary: '#7DB5B5', highlight: '#3F7C7C', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
            {
                id: 'forest', name: 'Forest',
                light: { bg: '#F2F6F3', card: '#FFFFFF', sidebar: '#E6EFE8', primary: '#4E6B57', highlight: '#7FA88C', border: 'rgba(50,80,60,0.12)', text: '#1A1A1A' },
                dark: { bg: '#1A2019', card: '#222822', sidebar: '#1E2420', primary: '#7FA88C', highlight: '#4E6B57', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
        ],
    },
    {
        label: '🌸 Soft',
        themes: [
            {
                id: 'rose', name: 'Rose',
                light: { bg: '#FAF3F5', card: '#FFFFFF', sidebar: '#F3E6EA', primary: '#B86A7A', highlight: '#E2A7B1', border: 'rgba(130,60,80,0.12)', text: '#1A1A1A' },
                dark: { bg: '#241820', card: '#2E202A', sidebar: '#281C26', primary: '#E2A7B1', highlight: '#B86A7A', border: 'rgba(220,160,180,0.15)', text: '#f1f5f9' }
            },
            {
                id: 'lavender', name: 'Lavender',
                light: { bg: '#F5F3F8', card: '#FFFFFF', sidebar: '#ECE7F3', primary: '#6B5C8E', highlight: '#A79BC8', border: 'rgba(70,60,100,0.12)', text: '#1A1A1A' },
                dark: { bg: '#211E27', card: '#2A2632', sidebar: '#25212C', primary: '#A79BC8', highlight: '#6B5C8E', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
            {
                id: 'mint', name: 'Mint',
                light: { bg: '#F1FBF7', card: '#FFFFFF', sidebar: '#E0F3EA', primary: '#4AA88A', highlight: '#92D6C0', border: 'rgba(74,168,138,0.12)', text: '#1A1A1A' },
                dark: { bg: '#1B2622', card: '#23312C', sidebar: '#1E2B27', primary: '#92D6C0', highlight: '#4AA88A', border: 'rgba(255,255,255,0.08)', text: '#f1f5f9' }
            },
            {
                id: 'sand', name: 'Sand',
                light: { bg: '#F6F3EE', card: '#FFFFFF', sidebar: '#ECE7E0', primary: '#8C7A61', highlight: '#C8B79C', border: 'rgba(100,80,50,0.12)', text: '#1A1A1A' },
                dark: { bg: '#201D18', card: '#28251F', sidebar: '#24211C', primary: '#C8B79C', highlight: '#8C7A61', border: 'rgba(180,160,130,0.18)', text: '#f1f5f9' }
            },
        ],
    },
];
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
