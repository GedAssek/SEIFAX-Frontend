/**
 * LEFAXEUR - API Helper Functions
 * Phase 1 : Simulation (avant connexion réelle au Backend FastAPI)
 * Remplacez API_BASE_URL par votre vraie URL quand le backend sera lancé.
 */

const API_BASE_URL = 'https://seifax-backend.onrender.com/api'; // Backend distant sur Render

const api = {
    // ─── Authentification ───────────────────────────────────────────────────
    login: async (username, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erreur de connexion');
        }
        return res.json();
    },

    register: async (userData) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erreur lors de l\'inscription');
        }
        return res.json();
    },

    // ─── Sujets / Matières ────────────────────────────────────────────────
    getSubjects: async () => {
        /*
        const res = await fetch(`${API_BASE_URL}/subjects`);
        return res.json();
        */

        // ─── SIMULATION ───
        return new Promise((resolve) => {
            setTimeout(() => resolve(SUBJECTS_DATA), 300);
        });
    },

    getDocuments: async (filters = {}) => {
        try {
            const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
            const user = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.user;

            // Filtrage strict si l'utilisateur n'est pas admin
            if (user && user.role !== 'admin') {
                filters.cycle = user.cycle;
                filters.annee = user.annee;
            }

            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.cycle) params.append('cycle', filters.cycle);
            if (filters.annee) params.append('annee', filters.annee);
            if (filters.matiere) params.append('matiere', filters.matiere);
            if (filters.categorie_eval) params.append('categorie_eval', filters.categorie_eval);

            const res = await fetch(`${API_BASE_URL}/documents?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error("Erreur API getDocuments", res.status);
                return [];
            }
            return await res.json();
        } catch (error) {
            console.error("Erreur de connexion API:", error);
            return []; // Retourne vide si le backend ne répond pas
        }
    },

    addDocument: async (formData) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData // FormData
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de l'ajout du document");
        }
        return res.json();
    },

    deleteDocument: async (id) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la suppression du document");
        }
        return res.json();
    },

    updateDocument: async (id, formData) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la modification du document");
        }
        return res.json();
    },

    // ─── Informations ─────────────────────────────────────────────────────
    getInfos: async (cycle = null) => {
        try {
            const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
            const user = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.user;

            // Filtrage strict si l'utilisateur n'est pas admin
            let fetchCycle = cycle;
            if (user && user.role !== 'admin') {
                fetchCycle = user.cycle;
            }

            let url = `${API_BASE_URL}/infos`;
            if (fetchCycle) {
                url += `?cycle=${encodeURIComponent(fetchCycle)}`;
            }
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (error) {
            console.error("Erreur api.getInfos:", error);
            return [];
        }
    },

    addInfo: async (formData) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/infos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la publication de l'information");
        }
        return res.json();
    },

    updateInfo: async (id, formData) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/infos/${id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la modification de l'annonce");
        }
        return res.json();
    },

    deleteInfo: async (id) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/infos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la suppression de l'annonce");
        }
        return res.json();
    },

    // ─── Profil ─────────────────────────────────────────────────────
    updatePassword: async (old_password, new_password) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/auth/password`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ old_password, new_password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la modification du mot de passe");
        }
        return res.json();
    },

    sendHeartbeat: async () => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/auth/heartbeat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Heartbeat failed', e);
        }
    },

    // ─── Admin ────────────────────────────────────────────────────
    getAdminStats: async () => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        return res.json();
    },

    getAdminUsers: async () => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return res.json();
    },

    updateUserRole: async (userId, role) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role?role=${role}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erreur lors du changement de rôle');
        }
        return res.json();
    },

    deleteAdminUser: async (userId) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erreur lors de la suppression');
        }
        return res.json();
    }
};

// ─── Données statiques des cycles et matières (issues du PDF EAMAC) ────────
// Assiduité et EPS exclues comme demandé.
const SUBJECTS_DATA = [
    {
        cycle: "IEAMAC-NA",
        label: "Cycle Ingénieur (IEAMAC/NA)",
        matieres: ["Navigation aérienne", "Aérodynamique", "Mécanique du vol", "Droit aérien", "Réglementation technique", "Météorologie", "Anglais technique", "Gestion de la sécurité"]
    },
    {
        cycle: "EAC-NA",
        label: "Cycle Exploitation Aéronautique Civile (EAC/NA)",
        matieres: ["Exploitation BDP/SIA", "Réglementation du transport aérien", "Opérations aériennes", "Cartographie aéronautique", "Navigation aérienne", "Météorologie aéronautique", "Anglais général"]
    },
    {
        cycle: "T-NA",
        label: "Cycle Technicien (T/NA)",
        matieres: ["Infrastructure aéroportuaire et balisage", "Bureau de Piste", "Service de l'information aéronautique", "Service mobile aéronautique", "Secourisme", "Anglais"]
    },
    {
        cycle: "CCA",
        label: "Contrôleur Circulation Aérienne (CCA)",
        matieres: ["RCA : Contrôle d'aérodrome", "RCA : Contrôle d'approche", "RCA : Contrôle en route", "PANS/OPS", "Exploitation radar", "Météo Générale", "Anglais Phraséologie", "Secourisme"]
    },
    {
        cycle: "IEAMAC-SEI",
        label: "Cycle Ingénieur (IEAMAC/SEI)",
        matieres: ["Circuits Electriques", "Electronique Numérique", "Microprocesseurs", "Transmissions numériques", "Radionavigation", "Radar", "Télécommunications par satellites", "Réseaux informatiques"]
    },
    {
        cycle: "EAC-SEI",
        label: "Cycle Exploitation Aéronautique Civile (EAC/SEI)",
        matieres: ["Réseaux de télécommunications aéronautiques (ATN)", "Maintenance", "Equipements MTO satellitaires", "Antennes - Propagation", "Emission / Réception", "Administration réseau", "CNS/ATM"]
    },
    {
        cycle: "IEAMAC-M",
        label: "Cycle Ingénieur (IEAMAC/M)",
        matieres: ["Météorologie générale", "Météorologie aéronautique", "Météorologie tropicale", "Thermodynamique", "Mécanique des fluides", "Physique", "Mathématiques", "Prévision météorologique"]
    },
    {
        cycle: "EAC-M",
        label: "Cycle Exploitation Aéronautique Civile (EAC/M)",
        matieres: ["Assistance météorologique à la NA", "Observation météorologique", "Instruments météorologiques", "Climatologie", "Codes OPMET", "Transmission des données météorologiques"]
    },
    {
        cycle: "T-M",
        label: "Cycle Technicien (T/M)",
        matieres: ["Observation au sol", "Lecture des instruments", "Transmission MTO", "Anglais technique", "Informatique de base", "Secourisme"]
    }
];
