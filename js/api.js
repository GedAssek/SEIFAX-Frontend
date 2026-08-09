/**
 * LEFAXEUR - API Helper Functions
 * Backend FastAPI déployé sur Render : https://seifax-backend.onrender.com
 */

const API_BASE_URL = 'https://seifax-backend.onrender.com/api';

// ─── Base URL pour accéder aux fichiers statiques (uploads) ───────────────────
// IMPORTANT : les file_url retournés par le backend sont des chemins RELATIFS
// (ex: /uploads/documents/fichier.pdf). Il faut les préfixer avec le domaine backend.
const BACKEND_ORIGIN = 'https://seifax-backend.onrender.com';

/**
 * Préfixe un chemin de fichier relatif avec l'origine du backend.
 * Si l'URL est déjà absolue (http/https), elle est retournée telle quelle.
 */
function toAbsoluteUrl(url) {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Chemin relatif → préfixer avec l'origine backend
    return BACKEND_ORIGIN + (url.startsWith('/') ? '' : '/') + url;
}

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
        // Données statiques (SUBJECTS_DATA défini en bas de ce fichier)
        return new Promise((resolve) => {
            setTimeout(() => resolve(SUBJECTS_DATA), 100);
        });
    },

    // ─── Documents ────────────────────────────────────────────────────────
    /**
     * Récupère les documents depuis l'API.
     * CORRECTION : On ne filtre PAS par user.annee (année d'études 1/2) car
     * les documents publiés ont une année CALENDAIRE (2024, 2025, 2026…).
     * Seul le filtrage par cycle est appliqué automatiquement pour les étudiants.
     */
    getDocuments: async (filters = {}) => {
        try {
            const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
            const user = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.user;

            // Filtrage automatique par cycle ET année d'étude pour les étudiants
            if (user && user.role !== 'admin') {
                filters.cycle = user.cycle;
                // user.annee est le niveau d'étude (1, 2, 3) → envoyé comme annee_etude au backend
                if (user.annee) {
                    filters.annee_etude = user.annee;
                }
            }

            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.cycle) params.append('cycle', filters.cycle);
            // Filtre annee calendaire seulement si c'est une année calendaire (>= 2020)
            if (filters.annee && parseInt(filters.annee) >= 2020) {
                params.append('annee', filters.annee);
            }
            // Filtre année d'étude (1, 2, 3)
            if (filters.annee_etude) params.append('annee_etude', filters.annee_etude);
            if (filters.matiere) params.append('matiere', filters.matiere);
            if (filters.categorie_eval) params.append('categorie_eval', filters.categorie_eval);
            if (filters.q) params.append('q', filters.q);  // Recherche textuelle libre

            const queryStr = params.toString();
            const url = `${API_BASE_URL}/documents/${queryStr ? '?' + queryStr : ''}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error("Erreur API getDocuments", res.status);
                return [];
            }
            const docs = await res.json();

            // CORRECTION : préfixer les file_url avec l'origine backend
            return docs.map(doc => ({
                ...doc,
                file_url: toAbsoluteUrl(doc.file_url)
            }));
        } catch (error) {
            console.error("Erreur de connexion API:", error);
            return [];
        }
    },

    addDocument: async (formData) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/documents/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData // FormData (multipart)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de l'ajout du document");
        }
        const doc = await res.json();
        return { ...doc, file_url: toAbsoluteUrl(doc.file_url) };
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
        const doc = await res.json();
        return { ...doc, file_url: toAbsoluteUrl(doc.file_url) };
    },

    // ─── Informations ─────────────────────────────────────────────────────
    getInfos: async (cycle = null) => {
        try {
            const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
            const user = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.user;

            let fetchCycle = cycle;
            if (user && user.role !== 'admin') {
                fetchCycle = user.cycle;
            }

            let url = `${API_BASE_URL}/infos/`;
            if (fetchCycle) {
                url += `?cycle=${encodeURIComponent(fetchCycle)}`;
            }
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return [];
            const infos = await res.json();

            // CORRECTION : préfixer les file_url avec l'origine backend
            return infos.map(info => ({
                ...info,
                file_url: toAbsoluteUrl(info.file_url)
            }));
        } catch (error) {
            console.error("Erreur api.getInfos:", error);
            return [];
        }
    },

    addInfo: async (formData) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/infos/`, {
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
        const info = await res.json();
        return { ...info, file_url: toAbsoluteUrl(info.file_url) };
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

    // ─── Profil ─────────────────────────────────────────────────────────
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

    // ─── Admin ────────────────────────────────────────────────────────
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
    },

    syncDrive: async () => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/admin/sync-drive`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erreur lors de la synchronisation Drive');
        }
        return res.json();
    },

    fixAnneeEtude: async () => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/admin/fix-annee-etude`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erreur lors de la correction des années d\''étude');
        }
        return res.json();
    },

    // ─── Heures ────────────────────────────────────────────────────────
    getHeures: async (annee) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/heures/${annee}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return res.json();
    },

    getVolumes: async (annee) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/heures/volumes/${annee}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return res.json();
    },

    sauvegarderSemaine: async (data) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/heures/semaine`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de l'enregistrement des heures");
        }
        return res.json();
    },

    getHeuresSemaines: async (annee) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/heures/semaines/${annee}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return res.json();
    },

    deleteSemaine: async (id) => {
        const token = JSON.parse(localStorage.getItem('LEFAXEUR_user'))?.access_token;
        const res = await fetch(`${API_BASE_URL}/heures/semaine/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Erreur lors de la suppression de la semaine");
        }
        return res.json();
    }
};

// ─── Système de Notification In-App ──────────────────────────────────────────
// Utilise le localStorage pour détecter les nouveaux documents/infos publiés

const NotifSystem = {
    STORAGE_KEY_DOCS: 'LEFAXEUR_seen_docs',
    STORAGE_KEY_INFOS: 'LEFAXEUR_seen_infos',

    /**
     * Retourne le Set des IDs de documents déjà vus
     */
    getSeenDocs() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_DOCS);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch { return new Set(); }
    },

    /**
     * Retourne le Set des IDs d'infos déjà vues
     */
    getSeenInfos() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_INFOS);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch { return new Set(); }
    },

    /**
     * Marque les documents comme vus
     */
    markDocsAsSeen(docs) {
        const ids = docs.map(d => d.id);
        localStorage.setItem(this.STORAGE_KEY_DOCS, JSON.stringify(ids));
    },

    /**
     * Marque les infos comme vues
     */
    markInfosAsSeen(infos) {
        const ids = infos.map(i => i.id);
        localStorage.setItem(this.STORAGE_KEY_INFOS, JSON.stringify(ids));
    },

    /**
     * Retourne les nouveaux documents (jamais vus)
     */
    getNewDocs(docs) {
        const seen = this.getSeenDocs();
        return docs.filter(d => !seen.has(d.id));
    },

    /**
     * Retourne les nouvelles infos (jamais vues)
     */
    getNewInfos(infos) {
        const seen = this.getSeenInfos();
        return infos.filter(i => !seen.has(i.id));
    },

    /**
     * Affiche un toast de notification
     * @param {string} message - Texte du toast
     * @param {string} type - 'success' | 'info' | 'warning'
     * @param {string|null} actionUrl - URL optionnelle si on clique sur le toast
     */
    showToast(message, type = 'info', actionUrl = null) {
        // Injecter le style des toasts si pas encore fait
        if (!document.getElementById('lefaxeur-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'lefaxeur-toast-styles';
            style.textContent = `
                #lefaxeur-toasts {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                    max-width: 380px;
                }
                .lefaxeur-toast {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 0.9rem 1.1rem;
                    border-radius: 12px;
                    background: #ffffff;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
                    animation: toastIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
                    cursor: ${actionUrl ? 'pointer' : 'default'};
                    border-left: 4px solid #1a56db;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .lefaxeur-toast:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.18); }
                .lefaxeur-toast.success { border-left-color: #16a34a; }
                .lefaxeur-toast.warning { border-left-color: #f59e0b; }
                .lefaxeur-toast-icon { font-size: 1.4rem; flex-shrink: 0; }
                .lefaxeur-toast-body { flex: 1; }
                .lefaxeur-toast-title { font-weight: 700; font-size: 0.9rem; color: #111827; margin-bottom: 0.2rem; }
                .lefaxeur-toast-msg { font-size: 0.82rem; color: #6b7280; line-height: 1.4; }
                .lefaxeur-toast-close { background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 1rem; padding: 0; flex-shrink: 0; }
                .lefaxeur-toast-close:hover { color: #374151; }
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(60px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes toastOut {
                    from { opacity: 1; transform: translateX(0); max-height: 200px; margin-bottom: 0; }
                    to   { opacity: 0; transform: translateX(60px); max-height: 0; margin-bottom: -0.6rem; }
                }
                .lefaxeur-toast.removing { animation: toastOut 0.3s ease forwards; }
                /* Badge notification */
                .notif-badge {
                    display: inline-flex; align-items: center; justify-content: center;
                    background: #ef4444; color: #fff; font-size: 0.65rem; font-weight: 800;
                    border-radius: 9999px; min-width: 18px; height: 18px; padding: 0 5px;
                    position: absolute; top: -6px; right: -8px;
                    animation: pulseBadge 2s ease-in-out infinite;
                }
                @keyframes pulseBadge {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                /* Upload progress bar */
                .upload-progress-wrap {
                    margin-top: 1rem;
                    display: none;
                }
                .upload-progress-wrap.visible { display: block; }
                .upload-progress-bar-track {
                    height: 6px; background: #e5e7eb; border-radius: 9999px; overflow: hidden;
                }
                .upload-progress-bar-fill {
                    height: 100%; background: linear-gradient(90deg, #16a34a, #22c55e);
                    border-radius: 9999px;
                    transition: width 0.4s ease;
                    width: 0%;
                }
                .upload-status-msg {
                    font-size: 0.82rem; color: #6b7280; margin-top: 0.5rem; text-align: center;
                }
            `;
            document.head.appendChild(style);
        }

        // Conteneur de toasts
        let container = document.getElementById('lefaxeur-toasts');
        if (!container) {
            container = document.createElement('div');
            container.id = 'lefaxeur-toasts';
            document.body.appendChild(container);
        }

        const icons = { info: '🔔', success: '✅', warning: '⚠️', doc: '📄', annonce: '📢' };
        const icon = icons[type] || icons.info;

        const toast = document.createElement('div');
        toast.className = `lefaxeur-toast ${type}`;
        toast.innerHTML = `
            <div class="lefaxeur-toast-icon">${icon}</div>
            <div class="lefaxeur-toast-body">
                <div class="lefaxeur-toast-title">${type === 'doc' ? 'Nouveau document' : type === 'annonce' ? 'Nouvelle annonce' : 'Notification'}</div>
                <div class="lefaxeur-toast-msg">${message}</div>
            </div>
            <button class="lefaxeur-toast-close" title="Fermer">✕</button>
        `;

        if (actionUrl) {
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('lefaxeur-toast-close')) {
                    window.location.href = actionUrl;
                }
            });
        }

        const closeBtn = toast.querySelector('.lefaxeur-toast-close');
        function removeToast() {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }
        closeBtn.addEventListener('click', removeToast);

        container.appendChild(toast);

        // Auto-dismiss après 6 secondes
        setTimeout(removeToast, 6000);
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
