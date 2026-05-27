/* ═══════════════════════════════════════════
   LIFE RPG V5 — app.js
   Storage key: lifeRPGState_v3 (permanent — never change)
   Changes V3→V4:
   - V3.1: Session orbits at exact 90° positions
   - V3.1: Tooltips on skill orbits
   - V3.1: Dynamic avatar initial from username
   - V4: Recommended habits (pre-loaded, skill-linked)
   - V4: Quest system (daily x3 + weekly x1)
   ═══════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const SKILL_CONFIG = {
    endurance:  { icon: '💪', name: 'Endurance',  color: '#ff6b6b' },
    sagesse:    { icon: '📚', name: 'Sagesse',    color: '#4ecdc4' },
    discipline: { icon: '🏠', name: 'Discipline', color: '#f5c842' },
    serenite:   { icon: '🧘', name: 'Sérénité',   color: '#9f7aea' },
    maitrise:   { icon: '⚡', name: 'Maîtrise',   color: '#3d8ef0' }
};

const SKILL_TOOLTIPS = {
    endurance: 'Sport, cardio, musculation,\nyoga dynamique, vélo, marche...',
    sagesse:   'Lecture, cours en ligne,\npodcasts éducatifs, prise de notes...',
    discipline:'Habitudes quotidiennes,\nroutines, constance...',
    serenite:  'Méditation, respiration,\njournal, marche en nature...',
    maitrise:  'Deep work, code, écriture,\napprentissage concentré...'
};

const SESSION_XP_CURVES = {
    endurance: [
        { min:150, xp:135 }, { min:75, xp:110 },
        { min:45,  xp:80  }, { min:20, xp:50  }, { min:0, xp:0 }
    ],
    serenite: [
        { min:90, xp:110 }, { min:45, xp:90 },
        { min:20, xp:70  }, { min:10, xp:50 }, { min:0, xp:0 }
    ],
    sagesse: [
        { min:120, xp:120 }, { min:60, xp:100 },
        { min:30,  xp:75  }, { min:15, xp:50  }, { min:0, xp:0 }
    ],
    maitrise: [
        { min:120, xp:140 }, { min:75, xp:115 },
        { min:45,  xp:85  }, { min:25, xp:50  }, { min:0, xp:0 }
    ]
};

const SESSION_THRESHOLDS = { endurance:20, serenite:10, sagesse:15, maitrise:25 };
const HABIT_XP    = 15;
const STORAGE_KEY = 'lifeRPGState_v3';

// ─────────────────────────────────────────────
//  V5 CONSTANTS (must be before loadGameState)
// ─────────────────────────────────────────────
const APP_VERSION = 'V8.0a';

const TITLES_BY_SKILL = {
    serenite:   [
        { id:'ser_basic',   level:30,  name:"L'Éveillé du Matin"     },
        { id:'ser_normal',  level:50,  name:"L'Adepte du Vide"       },
        { id:'ser_hard',    level:75,  name:'Le Maître Zen'           },
        { id:'ser_legend',  level:100, name:'Le Transcendant'         },
        { id:'ser_hf1',   hf:'50_serenite_sessions',  name:'Le Chercheur de Paix',        exclusive:false },
        { id:'ser_hf365', hf:'365_serenite_streak',   name:'Le Veilleur Éternel',          exclusive:true  }
    ],
    endurance:  [
        { id:'end_basic',   level:30,  name:"L'Actif"                },
        { id:'end_normal',  level:50,  name:"L'Endurant"             },
        { id:'end_hard',    level:75,  name:'Le Spartiate'            },
        { id:'end_legend',  level:100, name:'Le Demi-Dieu'            },
        { id:'end_hf1',   hf:'100_endurance_sessions', name:'Le Corps en Mouvement',      exclusive:false },
        { id:'end_hf365', hf:'365_endurance_streak',   name:'Le Titan Indestructible',    exclusive:true  }
    ],
    sagesse:    [
        { id:'sag_basic',   level:30,  name:'Le Curieux'              },
        { id:'sag_normal',  level:50,  name:"L'Érudit"               },
        { id:'sag_hard',    level:75,  name:'Le Philosophe'           },
        { id:'sag_legend',  level:100, name:'Le Sage'                 },
        { id:'sag_hf1',   hf:'200_sagesse_sessions',  name:"L'Insatiable",               exclusive:false },
        { id:'sag_hf365', hf:'365_sagesse_streak',    name:'Le Gardien du Savoir',       exclusive:true  }
    ],
    maitrise:   [
        { id:'mai_basic',   level:30,  name:'Le Persévérant'          },
        { id:'mai_normal',  level:50,  name:"L'Expert Naissant"      },
        { id:'mai_hard',    level:75,  name:'Le Ninja Productif'      },
        { id:'mai_legend',  level:100, name:"L'Architecte du Futur"  },
        { id:'mai_hf1',   hf:'75_maitrise_sessions',  name:'Le Bâtisseur',               exclusive:false },
        { id:'mai_hf365', hf:'365_maitrise_streak',   name:"L'Architecte de l'Éternité", exclusive:true  }
    ],
    discipline: [
        { id:'disc_basic',  level:30,  name:'Le Méthodique Débutant'  },
        { id:'disc_normal', level:50,  name:'Le Moine de la Routine'  },
        { id:'disc_hard',   level:75,  name:'Le Samouraï du Quotidien'},
        { id:'disc_legend', level:100, name:"L'Immuable"             },
        { id:'disc_hf1',  hf:'30_perfect_days',      name:"L'Homme de Routine",          exclusive:false },
        { id:'disc_hf365',hf:'365_perfect_streak',   name:'Le Pilier Immuable',          exclusive:true  }
    ]
};

const CAMPAIGN_TITLES = [
    { id:'camp_act1', actId:1, name:"Le Survivant de l'Aube",   rarity:'fer',     color:'#9ca3af' },
    { id:'camp_act2', actId:2, name:'Le Marcheur des Terres',    rarity:'argent',  color:'#e2e8f0' },
    { id:'camp_act3', actId:3, name:'Le Briseur de Chaînes',     rarity:'or',      color:'#f5c842' },
    { id:'camp_act4', actId:4, name:"L'Éveillé de l'Abîme",    rarity:'diamant', color:'#22d3ee' },
    { id:'camp_act5', actId:5, name:'Le Transcendant Cosmique',  rarity:'celeste', color:'var(--gold)' }
];

// ─────────────────────────────────────────────
//  V5.3 — CAMPAIGN CONSTANTS
// ─────────────────────────────────────────────
const RARITY_ORDER = ['fer','bronze','argent','or','platine','emeraude','diamant','legendaire','mythique','celeste'];
const RARITY_CONFIG = {
    fer:        { label:'Fer',        color:'#9ca3af', boost:2,  css:'rarity-fer'        },
    bronze:     { label:'Bronze',     color:'#d97706', boost:5,  css:'rarity-bronze'     },
    argent:     { label:'Argent',     color:'#cbd5e1', boost:9,  css:'rarity-argent'     },
    or:         { label:'Or',         color:'#f5c842', boost:14, css:'rarity-or'         },
    platine:    { label:'Platine',    color:'#bae6fd', boost:20, css:'rarity-platine'    },
    emeraude:   { label:'Émeraude',   color:'#34d399', boost:28, css:'rarity-emeraude'   },
    diamant:    { label:'Diamant',    color:'#22d3ee', boost:38, css:'rarity-diamant'    },
    legendaire: { label:'Légendaire', color:'#f97316', boost:50, css:'rarity-legendaire' },
    mythique:   { label:'Mythique',   color:'#ef4444', boost:65, css:'rarity-mythique'   },
    celeste:    { label:'Céleste',    color:'#f5c842', boost:85, css:'rarity-celeste'    }
};

const WEAPON_POOLS = {
    endurance:  { types:['Épée','Dague','Arc','Hache'],          names:{ fer:['Lame Rouillée','Dague Ébréchée','Arc Noueux','Hache Émoussée'], bronze:['Lame Patinée','Dague de Bronze','Arc Tendu','Hache Grossière'], argent:['Épée Polie','Dague Affilée','Arc Argenté','Hache Tranchante'], or:['Lame Dorée','Dague Solaire','Arc d\'Or','Hache Royale'], platine:['Épée Glacée','Dague du Crépuscule','Arc Stellaire','Hache des Cimes'], emeraude:['Lame Forestière','Dague Venimeuse','Arc Sylvain','Hache des Racines'], diamant:['Tranchant du Néant','Dague de l\'Abîsse','Arc Brisé-Ciel','Hache du Titan'], legendaire:['Fléau de l\'Éternité','Dague du Dernier Souffle','Arc du Jugement','Hache du Conquérant'], mythique:['Déchirure du Monde','Croc de l\'Ombre','Arc de l\'Apocalypse','Hache du Dieu Mort'], celeste:['Fragment d\'Étoile','Larme du Cosmos','Arc de l\'Aurore Finale','Hache du Commencement'] } },
    sagesse:    { types:['Pendentif','Bague','Anneau','Médaillon'], names:{ fer:['Pendentif Terne','Bague Oxydée','Anneau Fissuré','Médaillon Effacé'], bronze:['Pendentif Patiné','Bague de Bronze','Anneau Gravé','Médaillon Ancien'], argent:['Pendentif Argenté','Bague Ciselée','Anneau de Lune','Médaillon Poli'], or:['Pendentif Doré','Bague Solaire','Anneau du Sage','Médaillon Rayonnant'], platine:['Pendentif Glacé','Bague des Étoiles','Anneau Stellaire','Médaillon Cristallin'], emeraude:['Pendentif Sylvain','Bague des Profondeurs','Anneau Verdoyant','Médaillon Forestier'], diamant:['Œil du Savant','Bague du Néant','Anneau de l\'Éveil','Médaillon de l\'Abîsse'], legendaire:['Larme du Philosophe','Bague de l\'Éternité','Anneau du Grand Sage','Médaillon Cosmique'], mythique:['Fragment d\'Omniscience','Bague du Dieu Penseur','Anneau de la Vérité','Œil du Monde'], celeste:['Éclat de Conscience Pure','Bague de l\'Aurore','Anneau du Premier Mot','Médaillon de l\'Infini'] } },
    serenite:   { types:['Gemme','Gemme','Gemme','Gemme'],         names:{ fer:['Caillou Gris','Caillou Gris','Caillou Gris','Caillou Gris'], bronze:['Pierre Ambrée','Pierre Ambrée','Pierre Ambrée','Pierre Ambrée'], argent:['Quartz Blanc','Quartz Blanc','Quartz Blanc','Quartz Blanc'], or:['Citrine Dorée','Citrine Dorée','Citrine Dorée','Citrine Dorée'], platine:['Aigue-Marine','Aigue-Marine','Aigue-Marine','Aigue-Marine'], emeraude:['Émeraude des Forêts','Émeraude des Forêts','Émeraude des Forêts','Émeraude des Forêts'], diamant:['Saphir Noir','Saphir Noir','Saphir Noir','Saphir Noir'], legendaire:['Larme de Lune','Larme de Lune','Larme de Lune','Larme de Lune'], mythique:['Larme de Lune Noire','Larme de Lune Noire','Larme de Lune Noire','Larme de Lune Noire'], celeste:['Fragment d\'Aurore','Fragment d\'Aurore','Fragment d\'Aurore','Fragment d\'Aurore'] } },
    maitrise:   { types:['Grimoire','Sablier','Compas','Plume'],   names:{ fer:['Grimoire Écorné','Sablier Fêlé','Compas Rouillé','Plume Usée'], bronze:['Grimoire Patiné','Sablier de Bronze','Compas Gravé','Plume Bronzée'], argent:['Grimoire Argenté','Sablier Cristallin','Compas Poli','Plume d\'Argent'], or:['Grimoire Doré','Sablier Solaire','Compas Royal','Plume Dorée'], platine:['Grimoire Glacé','Sablier Stellaire','Compas des Étoiles','Plume de Platine'], emeraude:['Grimoire Sylvain','Sablier des Profondeurs','Compas Forestier','Plume Émeraude'], diamant:['Tome du Néant','Sablier de l\'Abîsse','Compas Brisé-Ciel','Plume du Titan'], legendaire:['Codex de l\'Éternité','Sablier du Dernier Instant','Compas du Jugement','Plume du Conquérant'], mythique:['Grimoire du Dieu Mort','Sablier de l\'Apocalypse','Compas de l\'Ombre','Plume du Monde'], celeste:['Fragment du Premier Mot','Sablier de l\'Aurore Finale','Compas de l\'Infini','Plume du Commencement'] } },
    discipline: { types:['Bouclier','Armure','Ceinture','Heaume'], names:{ fer:['Bouclier Rouillé','Armure Cabossée','Ceinture Effilochée','Heaume Ébréché'], bronze:['Bouclier Patiné','Armure de Bronze','Ceinture Grossière','Heaume Gravé'], argent:['Bouclier Poli','Armure Ciselée','Ceinture Argentée','Heaume Clair'], or:['Bouclier Royal','Armure Dorée','Ceinture du Guerrier','Heaume Solaire'], platine:['Bouclier Glacé','Armure Stellaire','Ceinture des Cimes','Heaume Cristallin'], emeraude:['Bouclier Sylvain','Armure des Profondeurs','Ceinture Forestière','Heaume Verdoyant'], diamant:['Rempart du Néant','Armure de l\'Abîsse','Ceinture du Titan','Heaume Brisé-Ciel'], legendaire:['Égide de l\'Éternité','Armure du Conquérant','Ceinture du Jugement','Heaume du Dernier Rempart'], mythique:['Bouclier du Dieu Mort','Armure de l\'Apocalypse','Ceinture de l\'Ombre','Heaume du Monde'], celeste:['Fragment Indestructible','Armure de l\'Aurore Finale','Ceinture du Commencement','Heaume de l\'Infini'] } }
};

const BOSS_DATA = [
    { id:'b01', name:'Sanglier Géant',              act:1, actName:'Les Terres Sauvages', skill:'endurance', xpBase:3500,  timerDays:7,  img:'images/boar_acte_1.webp',   emoji:'🐗', lore:'Une bête ancestrale qui broie les os des imprudents.' },
    { id:'b02', name:'Brigand des Chemins',          act:1, actName:'Les Terres Sauvages', skill:'discipline',xpBase:3500,  timerDays:7,  img:'images/bandit_acte_1.webp',   emoji:'🗡️', lore:'Il rôde aux carrefours, attendant les voyageurs seuls.' },
    { id:'b03', name:'Ours des Cimes',               act:1, actName:'Les Terres Sauvages', skill:'endurance', xpBase:3500,  timerDays:7,  img:'images/ours_acte_1.webp',     emoji:'🐻', lore:'Gardien des hauteurs, personne ne passe sans son accord.' },
    { id:'b04', name:'Loup Alpha',                   act:2, actName:'La Forêt Profonde',   skill:'endurance', xpBase:4500,  timerDays:10, img:'images/loup_acte_2.webp',     emoji:'🐺', lore:'Ses yeux dorés voient à travers le brouillard.' },
    { id:'b05', name:'Reine des Guêpes',             act:2, actName:'La Forêt Profonde',   skill:'serenite',  xpBase:4500,  timerDays:10, img:'images/guêpe_acte_2.webp',   emoji:'🐝', lore:'Son bourdonnement annonce la fin.' },
    { id:'b06', name:'Géant de Pierre',              act:2, actName:'La Forêt Profonde',   skill:'discipline',xpBase:4500,  timerDays:10, img:'images/GOLEM_ACTE_2.webp',   emoji:'🗿', lore:'Né de la roche ancienne, il ne connaît pas la fatigue.' },
    { id:'b07', name:'Chevalier Maudit',             act:3, actName:'Les Terres Brûlées',  skill:'maitrise',  xpBase:5500,  timerDays:14, img:'images/chevalier_acte_3.webp',emoji:'⚔️',lore:"Condamné à se battre pour l'éternité." },
    { id:'b08', name:'Sorcière des Cendres',         act:3, actName:'Les Terres Brûlées',  skill:'sagesse',   xpBase:5500,  timerDays:14, img:'',                          emoji:'🔥', lore:'Elle transforme tout ce qu\'elle touche en cendres.' },
    { id:'b09', name:'Seigneur de Guerre',           act:3, actName:'Les Terres Brûlées',  skill:'endurance', xpBase:5500,  timerDays:14, img:'',                          emoji:'💀', lore:"Son armée n'a jamais connu la défaite." },
    { id:'b10', name:'Effigie Rampante',             act:4, actName:"L'Abîsse",            skill:'serenite',  xpBase:6500,  timerDays:21, img:'',                          emoji:'👁️', lore:'Elle rampe dans l\'ombre et mange les esprits.' },
    { id:'b11', name:'Loup-Garou des Ruines',        act:4, actName:"L'Abîsse",            skill:'endurance', xpBase:6500,  timerDays:21, img:'images/loup_garou_acte_4.webp',emoji:'🌕',lore:'La pleine lune réveille une rage sans fond.' },
    { id:'b12', name:"Troll de l'Abîsse",            act:4, actName:"L'Abîsse",            skill:'discipline',xpBase:6500,  timerDays:21, img:'',                          emoji:'🧌', lore:'Son corps est fait de roche et de ténèbres.' },
    { id:'b13', name:'Kraken des Marais',            act:4, actName:"L'Abîsse",            skill:'serenite',  xpBase:6500,  timerDays:21, img:'',                          emoji:'🦑', lore:'Ses tentacules s\'étendent sur des kilomètres.' },
    { id:'b14', name:'Ignareth le Dragon de Cendre', act:5, actName:'Le Cosmos',           skill:'endurance', xpBase:8000,  timerDays:30, img:'images/ignareth_acte_5.webp',emoji:'🐉', lore:'Son souffle transforme les montagnes en poussière.' },
    { id:'b15', name:"Veyral l'Ange Déchu",          act:5, actName:'Le Cosmos',           skill:'maitrise',  xpBase:8000,  timerDays:30, img:'',                          emoji:'👼', lore:"Il a choisi la chute plutôt que l'obéissance." },
    { id:'b16', name:'Kharoth le Titan Oublié',      act:5, actName:'Le Cosmos',           skill:'discipline',xpBase:8000,  timerDays:30, img:'',                          emoji:'⛰️', lore:'Il dormait depuis la naissance des étoiles.' },
    { id:'b17', name:"L'Innommable",                 act:5, actName:'Le Cosmos',           skill:'all',       xpBase:0,     timerDays:66, img:'images/l_innomable.webp',    emoji:'🌑', lore:"Il n'a pas de nom. Il est la fin.", isFinal:true, conditionBased:true }
];




// ── Recommended habits (pre-loaded, science-based) ──
const RECOMMENDED_HABITS = [
    { name: 'Lever/coucher heures fixes ±30min', category: 'discipline', icon: '🌙' },
    { name: 'Marche 20 min',                     category: 'endurance',  icon: '🚶' },
    { name: 'Boire 1.5L d\'eau',                 category: 'discipline', icon: '💧' },
    { name: 'Lecture 15 min',                    category: 'sagesse',    icon: '📖' },
    { name: 'Lumière naturelle le matin (10min)', category: 'serenite',  icon: '☀️' },
    { name: '5 min sans écran au réveil',         category: 'serenite',  icon: '📵' },
    { name: '1 interaction sociale positive',     category: 'serenite',  icon: '🤝' },
    { name: 'Pas de sucre ajouté le matin',       category: 'discipline', icon: '🚫' },
    { name: 'Légumes/fibres dans un repas',       category: 'discipline', icon: '🥦' }
];

// ── Quest pools ──
const QUEST_POOLS = {
    daily: {
        discipline: [
            { id:'d_disc_1', title:'Démarrage du jour',   desc:'Coche 50% de tes habitudes perso (arrondi supérieur)', type:'habits_personal_pct', target:0.5,  xp:30  },
            { id:'d_disc_2', title:'Hygiène de vie',      desc:'Coche 70% de tes habitudes recommandées (arrondi supérieur)', type:'habits_reco_pct', target:0.7, xp:30 },
            { id:'d_disc_3', title:'Journée parfaite',    desc:'Coche au moins 8 habitudes (recommandées + perso)', type:'habits_total_min', target:8, xp:150, minHabits:8, requiresPersonal:true },
            { id:'d_disc_4', title:'Sans faute',          desc:'Aucune habitude recommandée manquée aujourd\'hui', type:'habits_reco_all', target:1, xp:60 },
            { id:'d_disc_5', title:'Constance absolue',   desc:'Maintiens le streak sur au moins 1 habitude', type:'habit_any_streak', target:1, xp:30 }
        ],
        endurance: [
            { id:'d_end_1', title:'Mise en jambes',  desc:'Log une session Endurance de 20–44 min', type:'session_range', skill:'endurance', minMins:20, maxMins:44, xp:60  },
            { id:'d_end_2', title:'Séance solide',   desc:'Log une session Endurance de 45–74 min', type:'session_range', skill:'endurance', minMins:45, maxMins:74, xp:90  },
            { id:'d_end_3', title:'Effort long',     desc:'Log une session Endurance de 75 min+',   type:'session_range', skill:'endurance', minMins:75, maxMins:9999, xp:120 }
        ],
        sagesse: [
            { id:'d_sag_1', title:'Lecteur du matin', desc:'Log 15–29 min de lecture ou apprentissage', type:'session_range', skill:'sagesse', minMins:15, maxMins:29, xp:60  },
            { id:'d_sag_2', title:'Session de savoir', desc:'Log 30–59 min de lecture ou cours',         type:'session_range', skill:'sagesse', minMins:30, maxMins:59, xp:90  },
            { id:'d_sag_3', title:'Apprentissage profond', desc:'Log 60 min+ de lecture ou cours en ligne', type:'session_range', skill:'sagesse', minMins:60, maxMins:9999, xp:120 }
        ],
        serenite: [
            { id:'d_ser_1', title:'Instant calme',   desc:'Log 10–19 min de méditation ou respiration', type:'session_range', skill:'serenite', minMins:10, maxMins:19, xp:60  },
            { id:'d_ser_2', title:'Pleine présence', desc:'Log 20–44 min de méditation ou journal',     type:'session_range', skill:'serenite', minMins:20, maxMins:44, xp:90  },
            { id:'d_ser_3', title:'Sérénité totale', desc:'Log 45 min+ de méditation ou marche en nature', type:'session_range', skill:'serenite', minMins:45, maxMins:9999, xp:120 }
        ],
        maitrise: [
            { id:'d_mai_1', title:'1 Pomodoro',       desc:'Log 25–44 min de deep work (1 Pomodoro)',  type:'session_range', skill:'maitrise', minMins:25, maxMins:44, xp:60  },
            { id:'d_mai_2', title:'Session de flow',  desc:'Log 45–74 min de deep work concentré',     type:'session_range', skill:'maitrise', minMins:45, maxMins:74, xp:90  },
            { id:'d_mai_3', title:'Maîtrise totale',  desc:'Log 75 min+ de deep work',                 type:'session_range', skill:'maitrise', minMins:75, maxMins:9999, xp:120 }
        ]
    },
    weekly: {
        endurance: [
            { id:'w_end_1', title:'Semaine d\'endurance', desc:'Log 2 sessions Endurance de 45 min minimum cette semaine', type:'week_sessions_min', skill:'endurance', count:2, minMins:45, xp:250 }
        ],
        sagesse: [
            { id:'w_sag_1', title:'Semaine du savoir',  desc:'Log 3 sessions Sagesse cette semaine',  type:'week_sessions_count', skill:'sagesse', count:3, xp:250 }
        ],
        serenite: [
            { id:'w_ser_1', title:'Semaine sereine',    desc:'Log 4 sessions Sérénité cette semaine (fréquence > durée)', type:'week_sessions_count', skill:'serenite', count:4, xp:250 }
        ],
        maitrise: [
            { id:'w_mai_1', title:'Semaine de maîtrise', desc:'Log 2 sessions Maîtrise consécutives cette semaine', type:'week_sessions_min', skill:'maitrise', count:2, minMins:45, xp:250 }
        ],
        discipline: [
            { id:'w_disc_1', title:'Semaine disciplinée', desc:'Complète toutes tes habitudes recommandées 3 jours cette semaine', type:'week_reco_days', count:3, xp:300 }
        ]
    }
};

// Quest XP goes to skill (or discipline for habit quests)
const QUEST_SKILL_MAP = {
    discipline: 'discipline',
    endurance:  'endurance',
    sagesse:    'sagesse',
    serenite:   'serenite',
    maitrise:   'maitrise'
};

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let _nextId = 1;
function nextId() { return _nextId++; }

let _dateOverride = null;
let _debugMode = localStorage.getItem('lifeRPG_debugMode') === 'true';

function getNow() { return _dateOverride ? new Date(_dateOverride) : new Date(); }

// V6.2c: Timezone-safe local date string (YYYY-MM-DD)
// Replaces toISOString().slice(0,10) which returned UTC and caused
// calendar entries to shift by 1 day when checking habits in the evening.
function getLocalDateStr(date) {
    const d = date || getNow();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// V6.2d: purge any data dated in the future relative to the real system clock.
// Called automatically when exiting debug mode, and available manually via Settings.
// Returns a report object { xp, habitsEntries, moods, lastReset } counting deletions.
function cleanFutureData(silent = false) {
    const today = getLocalDateStr(new Date()); // real system date, not getNow()
    const report = { xp: 0, habitsEntries: 0, moods: 0, journal: 0, lastReset: false };

    // 1. xpHistory: drop future-dated entries (date > today)
    if (Array.isArray(gameState.xpHistory)) {
        const before = gameState.xpHistory.length;
        gameState.xpHistory = gameState.xpHistory.filter(e => !e.date || e.date <= today);
        report.xp = before - gameState.xpHistory.length;
    }

    // 2. moods: drop future-dated entries
    if (Array.isArray(gameState.moods)) {
        const before = gameState.moods.length;
        gameState.moods = gameState.moods.filter(m => !m.date || m.date <= today);
        report.moods = before - gameState.moods.length;
    }

    // 3. habit.history: drop future-dated entries per habit, then recompute streak
    if (Array.isArray(gameState.habits)) {
        gameState.habits.forEach(h => {
            if (!Array.isArray(h.history)) return;
            const before = h.history.length;
            h.history = h.history.filter(d => d <= today);
            report.habitsEntries += before - h.history.length;
            // Recompute streak from cleaned history
            h.streak = computeHabitStreak(h);
            // If lastCompleted is in the future, clear it
            if (h.lastCompleted) {
                const lc = getLocalDateStr(new Date(h.lastCompleted));
                if (lc > today) {
                    h.lastCompleted = null;
                    h.completed = false;
                }
            }
        });
    }

    // 4. lastResetDate clamp to today
    if (gameState.lastResetDate && gameState.lastResetDate > today) {
        gameState.lastResetDate = today;
        report.lastReset = true;
    }

    // 5. V7.0: journal entries dated in the future
    if (gameState.journal?.entries) {
        const keys = Object.keys(gameState.journal.entries);
        keys.forEach(k => {
            if (k > today) {
                delete gameState.journal.entries[k];
                report.journal++;
            }
        });
        gameState.journal.xpAwardedDates = (gameState.journal.xpAwardedDates || []).filter(d => d <= today);
        if (typeof computeJournalStreak === 'function')
            gameState.journal.streak = computeJournalStreak();
    }

    // 6. V8.0: tasks — pull future-due tasks back to today, drop future completion dates
    report.tasks = 0;
    if (Array.isArray(gameState.tasks)) {
        gameState.tasks.forEach(t => {
            if (t.dueDate && t.dueDate > today) { t.dueDate = today; report.tasks++; }
            if (t.completedDate && t.completedDate > today) {
                t.completedDate = null;
                t.completed = false;
                report.tasks++;
            }
        });
    }
    if (Array.isArray(gameState.taskCompletionDates)) {
        const before = gameState.taskCompletionDates.length;
        gameState.taskCompletionDates = gameState.taskCompletionDates.filter(d => d <= today);
        report.tasks += before - gameState.taskCompletionDates.length;
        if (typeof computeTaskStreak === 'function')
            gameState.taskStreak = computeTaskStreak();
    }

    saveGameState();
    if (!silent) {
        const total = report.xp + report.habitsEntries + report.moods + report.journal + (report.tasks||0) + (report.lastReset ? 1 : 0);
        if (total === 0) {
            toast('Aucune donnée future à nettoyer ✅', 'info');
        } else {
            toast(
                `Nettoyage : ${report.xp} XP, ${report.habitsEntries} habits, ${report.moods} humeurs, ${report.journal} journal, ${report.tasks||0} tâches`,
                'success'
            );
        }
    }
    return report;
}

function toggleDebugMode() {
    _debugMode = !_debugMode;
    localStorage.setItem('lifeRPG_debugMode', _debugMode);
    if (!_debugMode) {
        // Exiting debug mode — clear date override, purge future-dated data,
        // and reset lastResetDate to the real today so daily reset works.
        _dateOverride = null;
        const report = cleanFutureData(true); // silent
        gameState.lastResetDate = getLocalDateStr(new Date());
        saveGameState();
        const total = report.xp + report.habitsEntries + report.moods;
        const msg = total > 0
            ? `Mode test désactivé — ${total} entrées futures nettoyées ✅`
            : 'Mode test désactivé — retour à la date réelle ✅';
        toast(msg, 'success');
    } else {
        toast('Mode test activé 🛠', 'info');
    }
    renderDebugToggleBtn();
    renderUI();
}

function renderDebugToggleBtn() {
    const btn = document.getElementById('debug-mode-btn');
    if (!btn) return;
    // V6.0b: Hide the FAB if dev mode is not active (user must unlock via Settings)
    btn.style.display = _debugMode ? 'block' : 'none';
    btn.textContent = _debugMode ? '🛠 Test ON' : '🛠 Test OFF';
    btn.style.background = _debugMode
        ? 'rgba(61,142,240,0.25)'
        : 'rgba(255,255,255,0.04)';
    btn.style.color = _debugMode ? '#3d8ef0' : 'var(--text-dim)';
    btn.style.borderColor = _debugMode
        ? 'rgba(61,142,240,0.4)'
        : 'rgba(255,255,255,0.08)';

    // Show/hide debug panel button
    const panelBtn = document.getElementById('debug-panel-btn');
    if (panelBtn) panelBtn.style.display = _debugMode ? 'flex' : 'none';
}

// V6.0b: Dev mode unlock with password
const _DEV_PASSWORD = '029567CLMS';

function openDevModeUnlock() {
    document.getElementById('settings-overlay')?.remove();
    if (_debugMode) {
        // Already active — offer to deactivate
        showModal({
            type: 'danger',
            title: '🛠 Désactiver le mode test ?',
            body: 'Le panneau de test va disparaître de l\'interface.',
            confirmLabel: 'Désactiver',
            onConfirm: () => {
                toggleDebugMode();
            }
        });
        return;
    }
    // Activation requires password
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'devmode-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:340px">
            <div class="modal-title gold">🛠 Activer le mode test</div>
            <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:10px">Réservé aux développeurs et beta-testeurs autorisés.</div>
            <input type="password" id="devmode-pwd" placeholder="Mot de passe"
                style="width:100%;padding:11px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:0.85rem;margin-bottom:12px"
                onkeypress="if(event.key==='Enter') confirmDevModeUnlock()" autofocus>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="document.getElementById('devmode-overlay').remove()">Annuler</button>
                <button class="btn-gold" onclick="confirmDevModeUnlock()">Activer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
    setTimeout(() => document.getElementById('devmode-pwd')?.focus(), 50);
}

function confirmDevModeUnlock() {
    const input = document.getElementById('devmode-pwd');
    if (!input) return;
    if (input.value === _DEV_PASSWORD) {
        document.getElementById('devmode-overlay').remove();
        toggleDebugMode();
    } else {
        input.style.borderColor = 'var(--red)';
        input.value = '';
        input.placeholder = '❌ Mot de passe incorrect';
        toast('Mot de passe incorrect.', 'error');
        setTimeout(() => {
            input.style.borderColor = '';
            input.placeholder = 'Mot de passe';
        }, 2000);
    }
}

let _prevGlobalLevel = 1;

let gameState = {
    username: 'Hero',
    skills: {
        endurance:  { level:1, currentXP:0, totalXP:0 },
        sagesse:    { level:1, currentXP:0, totalXP:0 },
        discipline: { level:1, currentXP:0, totalXP:0 },
        serenite:   { level:1, currentXP:0, totalXP:0 },
        maitrise:   { level:1, currentXP:0, totalXP:0 }
    },
    habits: [],
    sessions: [],
    lastResetDate: getLocalDateStr(new Date()),
    stats: { totalHabitsCompleted:0, perfectDays:0, longestStreak:0 },
    quests: null,   // { date, daily:[...], weekly:{...}, completedIds:[] }
    campaign: null  // V5.3 — initialised by initCampaign()
};

// ─────────────────────────────────────────────
//  XP CURVE
// ─────────────────────────────────────────────
function calculateXPForLevel(level) {
    if (level <= 1) return 0;
    const t1 = {2:60,3:150,4:285,5:488,6:791,7:1287,8:2093,9:3211,10:4927};
    if (level <= 10) return t1[level];
    let xp = t1[10];
    if (level <= 30) { for (let i=11;i<=level;i++) xp+=Math.floor(2000+(i-10)*80); return xp; }
    for (let i=11;i<=30;i++) xp+=Math.floor(2000+(i-10)*80);
    if (level <= 60) { for (let i=31;i<=level;i++) xp+=Math.floor(4500+(i-30)*50); return xp; }
    for (let i=31;i<=60;i++) xp+=Math.floor(4500+(i-30)*50);
    if (level <= 100) { for (let i=61;i<=level;i++) xp+=Math.floor(3200+(i-60)*30); return xp; }
    for (let i=61;i<=100;i++) xp+=Math.floor(3200+(i-60)*30);
    for (let i=101;i<=level;i++) xp+=Math.floor(5000+(i-100)*100);
    return xp;
}

// ─────────────────────────────────────────────
//  XP ENGINE
// ─────────────────────────────────────────────
function gainSkillXP(skillKey, amount, label) {
    const skill = gameState.skills[skillKey];
    if (!skill) return;
    // V5.3: apply weapon boost if equipped and not broken
    const mult = getWeaponBoostMult(skillKey);
    const boosted = Math.floor(amount * mult);
    skill.currentXP += boosted;
    skill.totalXP   += boosted;
    // V5.3: accumulate XP toward active boss
    accumulateBossXP(skillKey, boosted);
    // XP history for profil accordion
    if (!gameState.xpHistory) gameState.xpHistory = [];
    gameState.xpHistory.push({
        date:   getLocalDateStr(getNow()),
        skill:  skillKey,
        amount: boosted,
        label:  label || skillKey
    });
    // Keep only last 90 days
    const cutoff = new Date(getNow());
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = getLocalDateStr(cutoff);
    gameState.xpHistory = gameState.xpHistory.filter(e => e.date >= cutoffStr);
    while (skill.level < 200) {
        const needed = calculateXPForLevel(skill.level+1) - calculateXPForLevel(skill.level);
        if (skill.currentXP < needed) break;
        skill.currentXP -= needed;
        skill.level++;
        showSkillLevelUp(skillKey, skill.level);
        checkTitleUnlocks();
    }
    checkGlobalLevelUp();
}

function removeSkillXP(skillKey, amount) {
    const skill = gameState.skills[skillKey];
    if (!skill) return;
    skill.currentXP -= amount;
    skill.totalXP    = Math.max(0, skill.totalXP - amount);
    while (skill.currentXP < 0 && skill.level > 1) {
        skill.level--;
        const needed = calculateXPForLevel(skill.level+1) - calculateXPForLevel(skill.level);
        skill.currentXP += needed;
    }
    skill.currentXP = Math.max(0, skill.currentXP);
}

function checkGlobalLevelUp() {
    const levels = Object.values(gameState.skills).map(s => s.level);
    const gl = Math.floor(levels.reduce((a,b)=>a+b,0) / levels.length);
    if (gl > _prevGlobalLevel) { showGlobalLevelUp(gl); _prevGlobalLevel = gl; }
}

function getGlobalLevel() {
    const levels = Object.values(gameState.skills).map(s => s.level);
    return Math.floor(levels.reduce((a,b)=>a+b,0) / levels.length);
}

// ─────────────────────────────────────────────
//  SESSION XP HELPERS
// ─────────────────────────────────────────────
function getSessionBaseXP(category, minutes) {
    const curve = SESSION_XP_CURVES[category];
    if (!curve) return 0;
    for (const tier of curve) { if (minutes >= tier.min) return tier.xp; }
    return 0;
}

function calcSessionXP(category, minutes, streak) {
    const base = getSessionBaseXP(category, minutes);
    if (!base) return 0;
    return Math.floor(base * (1 + (streak||0)*5/100));
}

// ─────────────────────────────────────────────
//  PARTIAL CREDIT — rolling 7-day
// ─────────────────────────────────────────────
function processPartialCredit(session, minutes, logDate) {
    const now = new Date(logDate);
    const threshold = SESSION_THRESHOLDS[session.category];
    if (!threshold || minutes >= threshold) return false;
    if (!session.partialCredit) session.partialCredit = [];

    session.partialCredit = session.partialCredit.filter(e => {
        const diff = (now - new Date(e.date)) / (1000*60*60*24);
        return diff < 7;
    });
    session.partialCredit.push({ minutes, date: logDate });

    const total = session.partialCredit.reduce((s,e) => s+e.minutes, 0);
    if (total >= threshold) { session.partialCredit = []; return true; }
    return false;
}

// ─────────────────────────────────────────────
//  ISO WEEK HELPERS
// ─────────────────────────────────────────────
function getISOWeekString(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    const y = new Date(d.getFullYear(),0,1);
    const w = Math.ceil((((d-y)/86400000)+1)/7);
    return `${d.getFullYear()}-W${String(w).padStart(2,'0')}`;
}

function getWeekBoundaries(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMon = day===0 ? -6 : 1-day;
    const mon = new Date(d); mon.setDate(d.getDate()+diffToMon); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999);
    return { mon, sun };
}

function formatWeekLabel(date) {
    const {mon,sun} = getWeekBoundaries(date);
    const fmt = d => d.toLocaleDateString('en-GB',{month:'short',day:'numeric'});
    return `${fmt(mon)} – ${fmt(sun)}`;
}

// ─────────────────────────────────────────────
//  SESSION LOG
// ─────────────────────────────────────────────
function logSession(sessionId, minutes, dateStr) {
    const session = gameState.sessions.find(s => s.id===sessionId);
    if (!session) return;

    // V6.0c fix: streak bonus only applies if a previous week was completed
    // On first week (lastWeekCompleted=null), no streak bonus regardless
    // V6.1 fix: streak bonus = (streak - 1) × 5%, no bonus on first completion
    // Streak 1 = first week ever, no bonus. Streak 2 = +5%. Streak 3 = +10%.
    const currentStreak = session.streak || 0;
    const streakForXP = Math.max(0, currentStreak - 1);

    const baseXP = getSessionBaseXP(session.category, minutes);
    let xpAwarded = 0;
    let isPartial = false;

    if (baseXP === 0) {
        const reached = processPartialCredit(session, minutes, dateStr);
        if (reached) {
            xpAwarded = Math.floor(50 * (1 + streakForXP*5/100));
            gainSkillXP(session.category, xpAwarded, `Session partielle — ${session.name}`);
            isPartial = true;
        }
    } else {
        xpAwarded = calcSessionXP(session.category, minutes, streakForXP);
        gainSkillXP(session.category, xpAwarded, `Session — ${session.name} (${minutes} min)`);
    }

    if (!session.logs) session.logs = [];
    session.logs.push({ id:nextId(), minutes, date:dateStr, xpAwarded, isPartial });
    updateSessionStreak(session, dateStr);

    saveGameState();
    checkQuestProgress();
    renderUI();

    // V6.0d: show weapon boost in toast
    const mult = getWeaponBoostMult(session.category);
    const boosted = Math.floor(xpAwarded * mult);
    const hasBonus = boosted > xpAwarded;
    const bonusText = hasBonus ? ` (+${Math.round((mult-1)*100)}% ⚔️)` : '';
    const xpText = hasBonus ? `+${xpAwarded} → +${boosted}` : `+${xpAwarded}`;

    if (xpAwarded > 0 && !isPartial)
        toast(`${xpText} XP → ${SKILL_CONFIG[session.category].name}!${bonusText}`, 'success');
    else if (isPartial)
        toast(`Seuil atteint! ${xpText} XP${bonusText}`, 'success');
    else
        toast('Session enregistrée — continue!', 'info');
}

function deleteSessionLog(sessionId, logId) {
    const session = gameState.sessions.find(s => s.id===sessionId);
    if (!session) return;
    const log = session.logs.find(l => l.id===logId);
    if (!log) return;
    if (log.xpAwarded > 0) removeSkillXP(session.category, log.xpAwarded);
    session.logs = session.logs.filter(l => l.id!==logId);
    saveGameState(); renderUI();
    toast('Log supprimé.', 'success');
}

function updateSessionStreak(session, logDateStr) {
    const logDate = new Date(logDateStr);
    const currentWeek = getISOWeekString(logDate);
    const {mon,sun} = getWeekBoundaries(logDate);
    const weekMins = (session.logs||[]).reduce((sum,log) => {
        const d = new Date(log.date);
        return (d>=mon && d<=sun) ? sum+log.minutes : sum;
    }, 0);

    if (weekMins >= session.weeklyGoalMinutes) {
        // Déjà comptabilisé cette semaine → rien à faire
        if (session.lastWeekCompleted === currentWeek) return;

        const prevWeek = getISOWeekString(new Date(mon.getTime()-1));
        if (!session.lastWeekCompleted) {
            // Premier objectif atteint
            session.streak = 1;
        } else if (session.lastWeekCompleted === prevWeek) {
            // Semaine précédente complétée → continuation du streak
            session.streak = (session.streak||0) + 1;
        } else {
            // Semaine manquée → repart à 1
            session.streak = 1;
        }
        session.lastWeekCompleted = currentWeek;
    }
}

function checkWeeklySessionReset(now) {
    const currentWeek = getISOWeekString(now);
    const {mon} = getWeekBoundaries(now);
    const prevWeek = getISOWeekString(new Date(mon.getTime()-1));
    gameState.sessions.forEach(s => {
        if (!s.lastWeekCompleted) return;
        if (s.lastWeekCompleted !== currentWeek && s.lastWeekCompleted !== prevWeek)
            s.streak = 0;
    });
}

// ─────────────────────────────────────────────
//  PERSISTENCE
// ─────────────────────────────────────────────
function saveGameState() {
    try {
        const serialized = JSON.stringify(gameState);
        localStorage.setItem(STORAGE_KEY, serialized);
        // V6.0d: Also write to a backup key in case main key gets cleared
        localStorage.setItem(STORAGE_KEY + '_backup', serialized);
        localStorage.setItem(STORAGE_KEY + '_lastSave', new Date().toISOString());
    } catch (e) {
        console.error('Save failed:', e);
        toast('⚠️ Erreur de sauvegarde — exporte tes données !', 'error');
    }
}

function loadGameState() {
    let saved = localStorage.getItem(STORAGE_KEY);
    // V6.0d: Try backup if main key is missing
    if (!saved) {
        saved = localStorage.getItem(STORAGE_KEY + '_backup');
        if (saved) {
            console.warn('Main storage missing — restored from backup');
            toast('🔄 Restauré depuis sauvegarde locale', 'info');
        }
    }
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.error('Parse failed:', e);
            toast('⚠️ Sauvegarde corrompue — restaure ton export.', 'error');
            return;
        }
        if (!gameState.username)  gameState.username = 'Hero';
        if (!gameState.skills)    gameState.skills = { endurance:{level:1,currentXP:0,totalXP:0}, sagesse:{level:1,currentXP:0,totalXP:0}, discipline:{level:1,currentXP:0,totalXP:0}, serenite:{level:1,currentXP:0,totalXP:0}, maitrise:{level:1,currentXP:0,totalXP:0} };
        if (!gameState.stats)     gameState.stats = { totalHabitsCompleted:0, perfectDays:0, longestStreak:0 };
        if (!gameState.sessions)  gameState.sessions = [];
        if (!gameState.habits)    gameState.habits = [];
        if (!gameState.lastResetDate) gameState.lastResetDate = getLocalDateStr(new Date());
        if (!gameState.quests)    gameState.quests = null;
        if (!gameState.xpHistory) gameState.xpHistory = [];
        if (!gameState.titles)    gameState.titles = { unlocked:[], active:null };
        if (!gameState.campaign)  gameState.campaign = null;
        // V7.0: Journal structure
        if (!gameState.journal) gameState.journal = {
            pinHash: null,
            entries: {},          // { 'YYYY-MM-DD': { question, answer, freeText, mood, createdAt, updatedAt } }
            streak: 0,
            longestStreak: 0,
            lastEntryDate: null,
            xpAwardedDates: []    // dates where +20 XP serenite already given
        };
        // V8.0: Tasks (to-do list)
        if (!Array.isArray(gameState.tasks)) gameState.tasks = [];
        if (typeof gameState.taskStreak !== 'number') gameState.taskStreak = 0;
        if (typeof gameState.longestTaskStreak !== 'number') gameState.longestTaskStreak = 0;
        if (!Array.isArray(gameState.taskCompletionDates)) gameState.taskCompletionDates = [];

        // V5: migrate habits — add frequency and history fields
        gameState.habits.forEach(h => {
            if (!h.frequency) h.frequency = 'daily';
            if (!h.history)   h.history = [];
            if (!h.lastWeekReset && h.frequency === 'weekly')
                h.lastWeekReset = getISOWeekString(new Date());
        });

        // V6.2a: Migrate habit.history from xpHistory for pre-V5.3 habits
        // Fixes streak disappearance after computeHabitStreak refactor
        if (gameState.xpHistory && gameState.habits) {
            gameState.habits.forEach(habit => {
                if (habit.history && habit.history.length > 0) return; // already has history
                // Seed from xpHistory entries matching this habit
                const dates = (gameState.xpHistory || [])
                    .filter(e => e.label && e.label.includes('Habitude') && e.label.includes(habit.name))
                    .map(e => e.date)
                    .filter(Boolean);
                if (dates.length > 0) {
                    habit.history = [...new Set(dates)].sort();
                } else if (habit.lastCompleted) {
                    // Fallback: at least seed with lastCompleted date
                    try {
                        const d = getLocalDateStr(new Date(habit.lastCompleted));
                        habit.history = [d];
                    } catch(e) {}
                }
            });
        }

        gameState.habits.forEach(h => {
            if (!h.history) h.history = []; // ['2026-05-05', ...] for calendar
        });

        gameState.habits.forEach(h => {
            if (!h.category) h.category = h.isRecommended ? (h.recommendedCategory || 'discipline') : 'discipline';
            h.xpReward = HABIT_XP;
            if (!h.streak)        h.streak = 0;
            if (!h.lastCompleted) h.lastCompleted = null;
        });

        gameState.sessions.forEach(s => {
            if (!s.logs)          s.logs = [];
            if (!s.partialCredit) s.partialCredit = [];
            if (!s.streak)        s.streak = 0;
        });

        const allIds = [
            ...gameState.habits.map(h=>h.id),
            ...gameState.sessions.map(s=>s.id),
            ...gameState.sessions.flatMap(s=>(s.logs||[]).map(l=>l.id))
        ].filter(Boolean);
        _nextId = allIds.length ? Math.max(...allIds)+1 : 1;
    }

    // V4: seed recommended habits if none exist yet
    seedRecommendedHabits();

    const levels = Object.values(gameState.skills).map(s=>s.level);
    _prevGlobalLevel = Math.floor(levels.reduce((a,b)=>a+b,0)/levels.length);

    const now = getNow();
    _checkDailyResetWithDate(now);
    checkWeeklySessionReset(now);
    checkWeeklyHabitsReset(now);
    generateDailyQuests(now);
    checkTitleUnlocks();
    initCampaign();

    // V5.3: midnight watcher — resets habits even if app stays open overnight
    if (!window._midnightWatcher) {
        window._midnightWatcher = setInterval(() => {
            const n = getNow();
            if (gameState.lastResetDate !== getLocalDateStr(n)) {
                _checkDailyResetWithDate(n);
                checkWeeklySessionReset(n);
                checkWeeklyHabitsReset(n);
                generateDailyQuests(n);
                renderUI();
            }
        }, 60000);
    }
}

// ─────────────────────────────────────────────
//  RECOMMENDED HABITS SEEDING
// ─────────────────────────────────────────────
function seedRecommendedHabits() {
    const existingRecoNames = gameState.habits
        .filter(h => h.isRecommended)
        .map(h => h.name.toLowerCase());

    RECOMMENDED_HABITS.forEach(rh => {
        if (!existingRecoNames.includes(rh.name.toLowerCase())) {
            gameState.habits.push({
                id: nextId(),
                name: rh.name,
                completed: false,
                xpReward: HABIT_XP,
                streak: 0,
                lastCompleted: null,
                category: rh.category,
                isRecommended: true,
                recommendedCategory: rh.category,
                icon: rh.icon,
                // V6.2c: missing fields that broke streak & calendar for recommended habits
                frequency: 'daily',
                history: [],
                lastWeekReset: null
            });
        }
    });
}

// ─────────────────────────────────────────────
//  DAILY RESET
// ─────────────────────────────────────────────
function _checkDailyResetWithDate(now) {
    // V5.3: ISO date string — timezone-safe, no browser quirks
    const todayStr = getLocalDateStr(now);
    if (gameState.lastResetDate === todayStr) return;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate()-1);
    const yesterdayStr = getLocalDateStr(yesterday);

    // V6.1: 1-day grace period for daily habits — streak preserved if missed only 1 day
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate()-2);
    const twoDaysAgoStr = getLocalDateStr(twoDaysAgo);

    const completedCount = gameState.habits.filter(h => h.completed).length;
    const isPerfectDay   = completedCount >= 8;

    gameState.habits.forEach(habit => {
        if (habit.frequency === 'weekly') {
            // V6.2c: do NOT uncheck weekly habits at daily reset.
            // They reset only on Monday via checkWeeklyHabitsReset().
            return;
        }
        // V6.2: compute streak from history — handles grace period automatically
        // No more manual date comparison needed
        habit.streak = computeHabitStreak(habit);
        habit.completed = false;
    });

    // Perfect Day streak (single streak, 8+ habits)
    if (!gameState.stats.perfectStreak)        gameState.stats.perfectStreak = 0;
    if (!gameState.stats.longestPerfectStreak) gameState.stats.longestPerfectStreak = 0;

    if (isPerfectDay) {
        gameState.stats.perfectDays++;
        gameState.stats.perfectStreak++;
        if (gameState.stats.perfectStreak > gameState.stats.longestPerfectStreak)
            gameState.stats.longestPerfectStreak = gameState.stats.perfectStreak;
    } else {
        gameState.stats.perfectStreak = 0;
    }

    gameState.lastResetDate = todayStr; // ISO format YYYY-MM-DD
    // V8.0: carry over pending tasks from previous days to today
    if (typeof carryOverPendingTasks === 'function') {
        _taskCarryOverTodayDone = null; // force re-run on new day
        carryOverPendingTasks();
    }
    // V8.0: refresh task streak (in case grace expired)
    if (typeof refreshTaskStreak === 'function') refreshTaskStreak();
    saveGameState();
}

// ─────────────────────────────────────────────
//  QUEST SYSTEM
// ─────────────────────────────────────────────

// Weighted random pick for weekly quest skill
// Lowest skill → 40%, 2nd lowest → 20%, rest → ~13% each
function pickWeeklySkill() {
    const skills = ['endurance','sagesse','serenite','maitrise','discipline'];
    const levels = skills.map(k => ({ key: k, level: gameState.skills[k].level }));
    levels.sort((a,b) => a.level - b.level);

    const weights = [40, 20, 13, 14, 13]; // must sum to 100
    const rand = Math.random() * 100;
    let cum = 0;
    for (let i = 0; i < levels.length; i++) {
        cum += weights[i];
        if (rand < cum) return levels[i].key;
    }
    return levels[0].key;
}

// Seed-based random using date string (same quests all day)
function seededRand(seed, max) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return Math.abs(h) % max;
}

// V6.2e: count days in current ISO week where ALL daily recommended habits
// were present in their history. Used by the 'Semaine disciplinée' quest.
function countRecoCompleteDaysThisWeek(now) {
    const recoDaily = gameState.habits.filter(h =>
        h.isRecommended && (h.frequency || 'daily') === 'daily'
    );
    if (recoDaily.length === 0) return 0;

    // Build set of history dates per habit
    const sets = recoDaily.map(h => new Set(h.history || []));

    // Monday of current ISO week
    const ref = new Date(now);
    ref.setHours(0, 0, 0, 0);
    const dow = (ref.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(ref);
    monday.setDate(monday.getDate() - dow);

    let count = 0;
    const d = new Date(monday);
    for (let i = 0; i < 7; i++) {
        if (d > now) break; // don't count future days
        const dStr = getLocalDateStr(d);
        const allDone = sets.every(s => s.has(dStr));
        if (allDone) count++;
        d.setDate(d.getDate() + 1);
    }
    return count;
}

function generateDailyQuests(now) {
    const todayStr = getLocalDateStr(now);
    const currentWeek = getISOWeekString(now);

    if (!gameState.quests || gameState.quests.date !== todayStr) {
        const completedIds = gameState.quests ? (gameState.quests.completedIds || []) : [];

        // Pick 3 daily quests: 1 discipline + 1 random session skill + 1 varied
        const discPool = QUEST_POOLS.daily.discipline;
        const sessionSkills = ['endurance','sagesse','serenite','maitrise'];
        const skill1 = sessionSkills[seededRand(todayStr+'s1', sessionSkills.length)];
        const skill2 = sessionSkills[seededRand(todayStr+'s2', sessionSkills.length)] !== skill1
            ? sessionSkills[seededRand(todayStr+'s2', sessionSkills.length)]
            : sessionSkills[(seededRand(todayStr+'s2', sessionSkills.length)+1) % sessionSkills.length];

        // V6.2b: helper — pick quest for skill, avoiding long session (45+ min) if yesterday had one
        const pickDailyQuest = (skill, seedKey) => {
            const pool = QUEST_POOLS.daily[skill];
            const LONG_MINS = 45;
            // Check if yesterday had a long session quest for this skill
            const yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1);
            const yStr = getLocalDateStr(yesterday);
            const prevQuests = gameState.quests?.date === yStr ? (gameState.quests.daily || []) : [];
            const hadLongYesterday = prevQuests.some(q =>
                q && q.skill === skill && q.type === 'session_range' && q.minMins >= LONG_MINS
            );
            // Filter out long session quests if yesterday had one
            const eligible = hadLongYesterday
                ? pool.filter(q => !(q.type === 'session_range' && q.minMins >= LONG_MINS))
                : pool;
            const safePool = eligible.length > 0 ? eligible : pool;
            return safePool[seededRand(seedKey, safePool.length)];
        };

        const daily = [
            discPool[seededRand(todayStr+'d', discPool.length)],
            pickDailyQuest(skill1, todayStr+'q1'),
            pickDailyQuest(skill2, todayStr+'q2')
        ];

        // V6.1: Multi-weekly quests — 3/4/5 distribution (25/50/25%), 1 max per skill
        let weeklyArr = gameState.quests && gameState.quests.weekStr === currentWeek
            ? gameState.quests.weeklyArr
            : null;

        // Backward compat: convert old single weekly to array
        if (!weeklyArr && gameState.quests && gameState.quests.weekStr === currentWeek && gameState.quests.weekly) {
            weeklyArr = [gameState.quests.weekly];
        }

        if (!weeklyArr) {
            // Seeded random for week — same week always gives same quests
            const r = seededRand(currentWeek + '_count', 100);
            const count = r < 25 ? 3 : (r < 75 ? 4 : 5); // 25%/50%/25%

            // Pick N unique skills
            const allSkills = ['endurance','sagesse','serenite','maitrise','discipline'];
            const shuffled = [...allSkills];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = seededRand(currentWeek + '_shuf' + i, i + 1);
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selectedSkills = shuffled.slice(0, count);

            weeklyArr = selectedSkills.map((sk, idx) => {
                const pool = QUEST_POOLS.weekly[sk];
                return pool[seededRand(currentWeek + '_w' + idx, pool.length)];
            });
        }

        gameState.quests = {
            date: todayStr,
            weekStr: currentWeek,
            daily,
            weeklyArr,
            // Keep `weekly` for backward compat (first quest of array)
            weekly: weeklyArr[0] || null,
            completedIds: completedIds.filter(id => {
                return id.startsWith('w_');
            })
        };
        saveGameState();
    }
}

// Check if a quest is complete based on current game state
function isQuestComplete(quest) {
    const now = getNow();
    const todayStr = getLocalDateStr(now);
    const {mon, sun} = getWeekBoundaries(now);

    if (!quest) return false;

    switch(quest.type) {
        case 'habits_personal_pct': {
            const personal = gameState.habits.filter(h => !h.isRecommended);
            if (personal.length === 0) return false;
            const needed = Math.ceil(personal.length * quest.target);
            const done = personal.filter(h => h.completed).length;
            return done >= needed;
        }
        case 'habits_reco_pct': {
            const reco = gameState.habits.filter(h => h.isRecommended);
            if (reco.length === 0) return false;
            const needed = Math.ceil(reco.length * quest.target);
            const done = reco.filter(h => h.completed).length;
            return done >= needed;
        }
        case 'habits_total_min': {
            const personalCount = gameState.habits.filter(h => !h.isRecommended).length;
            if (quest.requiresPersonal && personalCount === 0) return false;
            if (gameState.habits.length < quest.minHabits) return false;
            const done = gameState.habits.filter(h => h.completed).length;
            return done >= quest.target;
        }
        case 'habits_reco_all': {
            const reco = gameState.habits.filter(h => h.isRecommended);
            if (reco.length === 0) return false;
            return reco.every(h => h.completed);
        }
        case 'habit_any_streak': {
            return gameState.habits.some(h => (h.streak||0) >= quest.target);
        }
        case 'session_range': {
            // V6.0d fix: cumulate ALL session minutes for the day
            const todayMins = gameState.sessions
                .filter(s => s.category === quest.skill)
                .flatMap(s => (s.logs||[]).filter(l => l.date === todayStr))
                .reduce((sum, l) => sum + l.minutes, 0);
            return todayMins >= quest.minMins;
        }
        case 'week_sessions_min': {
            const validSessions = gameState.sessions.filter(s => s.category === quest.skill);
            let count = 0;
            validSessions.forEach(s => {
                (s.logs||[]).forEach(l => {
                    const d = new Date(l.date);
                    if (d >= mon && d <= sun && l.minutes >= quest.minMins) count++;
                });
            });
            return count >= quest.count;
        }
        case 'week_sessions_count': {
            const validSessions = gameState.sessions.filter(s => s.category === quest.skill);
            let count = 0;
            validSessions.forEach(s => {
                (s.logs||[]).forEach(l => {
                    const d = new Date(l.date);
                    if (d >= mon && d <= sun) count++;
                });
            });
            return count >= quest.count;
        }
        case 'week_reco_days': {
            // V6.2e: count days this ISO week where ALL daily reco habits were
            // in their history. Uses habit.history (proper per-day tracking).
            const recoDaily = gameState.habits.filter(h =>
                h.isRecommended && (h.frequency || 'daily') === 'daily'
            );
            if (recoDaily.length === 0) return false;
            return countRecoCompleteDaysThisWeek(getNow()) >= quest.count;
        }
        default: return false;
    }
}

// Get quest progress text
function getQuestProgress(quest) {
    const now = getNow();
    const {mon, sun} = getWeekBoundaries(now);

    switch(quest.type) {
        case 'habits_personal_pct': {
            const personal = gameState.habits.filter(h => !h.isRecommended);
            if (personal.length === 0) return { text: 'Aucune habitude perso', pct: 0, blocked: true };
            const needed = Math.ceil(personal.length * quest.target);
            const done = personal.filter(h => h.completed).length;
            return { text: `${done} / ${needed}`, pct: Math.min(100, (done/needed)*100) };
        }
        case 'habits_reco_pct': {
            const reco = gameState.habits.filter(h => h.isRecommended);
            const needed = Math.ceil(reco.length * quest.target);
            const done = reco.filter(h => h.completed).length;
            return { text: `${done} / ${needed}`, pct: Math.min(100, (done/needed)*100) };
        }
        case 'habits_total_min': {
            const personalCount = gameState.habits.filter(h => !h.isRecommended).length;
            if (quest.requiresPersonal && personalCount === 0) {
                return { text: 'Ajoute au moins 1 habitude perso', pct: 0, blocked: true };
            }
            if (gameState.habits.length < quest.minHabits) {
                return { text: `Requiert ${quest.minHabits}+ habitudes au total`, pct: 0, blocked: true };
            }
            const done = gameState.habits.filter(h => h.completed).length;
            return { text: `${done} / ${quest.target}`, pct: Math.min(100, (done/quest.target)*100) };
        }
        case 'habits_reco_all': {
            const reco = gameState.habits.filter(h => h.isRecommended);
            const done = reco.filter(h => h.completed).length;
            return { text: `${done} / ${reco.length}`, pct: Math.min(100, (done/Math.max(1,reco.length))*100) };
        }
        case 'habit_any_streak': {
            const maxStreak = Math.max(0, ...gameState.habits.map(h => h.streak||0));
            return { text: maxStreak > 0 ? `Streak max : ${maxStreak}j` : 'Aucun streak actif', pct: maxStreak > 0 ? 100 : 0 };
        }
        case 'session_range': {
            // V6.0d fix: cumulate ALL session minutes for the day
            const todayStr = getLocalDateStr(now);
            const todayMins = gameState.sessions
                .filter(s => s.category === quest.skill)
                .flatMap(s => (s.logs||[]).filter(l => l.date === todayStr))
                .reduce((sum, l) => sum + l.minutes, 0);
            const pct = todayMins >= quest.minMins ? 100 : Math.min(99, (todayMins/quest.minMins)*100);
            return { text: todayMins > 0 ? `${todayMins} / ${quest.minMins} min` : 'Pas encore loggé', pct };
        }
        case 'week_sessions_min': {
            let count = 0;
            gameState.sessions.filter(s => s.category === quest.skill).forEach(s => {
                (s.logs||[]).forEach(l => {
                    const d = new Date(l.date);
                    if (d >= mon && d <= sun && l.minutes >= quest.minMins) count++;
                });
            });
            return { text: `${count} / ${quest.count} sessions`, pct: Math.min(100,(count/quest.count)*100) };
        }
        case 'week_sessions_count': {
            let count = 0;
            gameState.sessions.filter(s => s.category === quest.skill).forEach(s => {
                (s.logs||[]).forEach(l => {
                    const d = new Date(l.date);
                    if (d >= mon && d <= sun) count++;
                });
            });
            return { text: `${count} / ${quest.count} sessions`, pct: Math.min(100,(count/quest.count)*100) };
        }
        case 'week_reco_days': {
            // V6.2e: show days completed / target, not "today's habits"
            const recoDaily = gameState.habits.filter(h =>
                h.isRecommended && (h.frequency || 'daily') === 'daily'
            );
            if (recoDaily.length === 0)
                return { text: 'Aucune habitude reco', pct: 0 };
            const done = countRecoCompleteDaysThisWeek(getNow());
            return {
                text: `${done}/${quest.count} jours complets`,
                pct: Math.min(100, (done / quest.count) * 100)
            };
        }
        default: return { text: '', pct: 0 };
    }
}

function checkQuestProgress() {
    if (!gameState.quests) return;
    const weeklyQuests = gameState.quests.weeklyArr || (gameState.quests.weekly ? [gameState.quests.weekly] : []);
    const allQuests = [...(gameState.quests.daily||[]), ...weeklyQuests].filter(Boolean);
    allQuests.forEach(quest => {
        if (!quest) return;
        const alreadyDone = (gameState.quests.completedIds||[]).includes(quest.id);
        if (!alreadyDone && isQuestComplete(quest)) {
            // Award XP
            const skillKey = quest.skill || 'discipline';
            gainSkillXP(skillKey, quest.xp, `Quête — ${quest.title}`);
            if (!gameState.quests.completedIds) gameState.quests.completedIds = [];
            gameState.quests.completedIds.push(quest.id);
            saveGameState();
            const cfg = SKILL_CONFIG[skillKey];
            // V6.0d: show weapon boost if applicable
            const mult = getWeaponBoostMult(skillKey);
            const boosted = Math.floor(quest.xp * mult);
            if (boosted > quest.xp) {
                const pct = Math.round((mult-1)*100);
                toast(`🗡️ Quête accomplie! +${quest.xp} → +${boosted} XP → ${cfg.name} (+${pct}% ⚔️)`, 'success');
            } else {
                toast(`🗡️ Quête accomplie! +${quest.xp} XP → ${cfg.name}`, 'success');
            }
        }
    });
}

// Get quest skill key
function getQuestSkill(quest) {
    return quest.skill || 'discipline';
}

// ─────────────────────────────────────────────
//  HABIT ACTIONS
// ─────────────────────────────────────────────
function addHabit(frequencyOverride) {
    const input = document.getElementById('habit-input');
    const name  = input.value.trim();
    if (!name) { toast('Entre un nom d\'habitude.'); return; }

    const frequency = frequencyOverride || 'daily';

    let recoveredStreak = 0;
    if (gameState._deletedHabits) {
        const today = getLocalDateStr(getNow());
        const match = gameState._deletedHabits.find(d =>
            d.name.toLowerCase() === name.toLowerCase() && d.deletedDate === today
        );
        if (match) recoveredStreak = match.streak;
    }

    const habit = {
        id: nextId(), name,
        completed: false,
        xpReward: HABIT_XP,
        streak: recoveredStreak,
        lastCompleted: recoveredStreak > 0 ? new Date(getNow().setDate(getNow().getDate()-1)).toISOString() : null,
        category: 'discipline',
        isRecommended: false,
        frequency: frequency,
        history: []
    };
    if (frequency === 'weekly') {
        habit.lastWeekReset = getISOWeekString(getNow());
    }
    gameState.habits.push(habit);

    input.value = '';
    saveGameState(); renderUI();

    setTimeout(() => {
        const list = document.getElementById('habits-list');
        if (list && list.lastElementChild)
            list.lastElementChild.scrollIntoView({behavior:'smooth',block:'nearest'});
    }, 100);

    const freqLbl = frequency === 'weekly' ? ' (hebdomadaire)' : '';
    const msg = recoveredStreak > 0
        ? `"${name}"${freqLbl} ajoutée — 🔥 streak de ${recoveredStreak} récupéré!`
        : `"${name}"${freqLbl} ajoutée!`;
    toast(msg, 'success');
}

function openAddHabitModal() {
    const input = document.getElementById('habit-input');
    const name = input ? input.value.trim() : '';
    if (!name) { toast('Entre un nom d\'habitude.'); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:340px;">
            <div class="modal-title gold">📋 Fréquence de l'habitude</div>
            <div style="font-size:0.82rem;color:var(--text);margin-bottom:14px;">
                "<strong style="color:var(--gold)">${name}</strong>"
            </div>
            <div class="freq-choice-row">
                <button class="freq-choice-btn" onclick="confirmAddHabit('daily',this)">
                    <span class="freq-choice-icon">📆</span>
                    <span class="freq-choice-name">Quotidienne</span>
                    <span class="freq-choice-desc">Reset chaque jour à minuit</span>
                </button>
                <button class="freq-choice-btn" onclick="confirmAddHabit('weekly',this)">
                    <span class="freq-choice-icon">🗓️</span>
                    <span class="freq-choice-name">Hebdomadaire</span>
                    <span class="freq-choice-desc">Reset chaque lundi</span>
                </button>
            </div>
            <div class="modal-actions" style="margin-top:14px;">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

function confirmAddHabit(frequency, btn) {
    btn.closest('.modal-overlay').remove();
    addHabit(frequency);
}

// V6.2: Compute streak from habit.history — robust, handles grace period
// V6.2e: today not yet checked is NOT a miss (day isn't over). Grace applies
// only to past days. Streak breaks only on 2 fully-passed consecutive misses.
// Rules:
//   - Today checked → counts towards streak.
//   - Today empty → does NOT consume grace (day still in progress).
//   - Yesterday empty → consumes 1 grace.
//   - 2 consecutive past misses → streak broken.
function computeHabitStreak(habit) {
    // V6.2a: fallback to stored streak if history empty (old data before V5.3)
    if (!habit.history || habit.history.length === 0) return habit.streak || 0;

    const historySet = new Set(habit.history);
    const now = getNow();
    const todayStr = getLocalDateStr(now);

    // Compute yesterday & 2-days-ago for early-exit check
    const y1 = new Date(now); y1.setDate(y1.getDate() - 1);
    const y2 = new Date(now); y2.setDate(y2.getDate() - 2);
    const yesterdayStr  = getLocalDateStr(y1);
    const twoDaysAgoStr = getLocalDateStr(y2);

    // Early exit: if none of today / yesterday / 2-days-ago, streak is dead
    if (!historySet.has(todayStr) &&
        !historySet.has(yesterdayStr) &&
        !historySet.has(twoDaysAgoStr)) return 0;

    let streak = 0;
    let graceUsed = false;
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);

    // Today handling: if checked, count it. If empty, skip without burning grace.
    const todayInHistory = historySet.has(getLocalDateStr(d));
    if (todayInHistory) streak++;
    d.setDate(d.getDate() - 1);

    // Walk backwards through past days
    for (let i = 0; i < 1000; i++) {
        const dStr = getLocalDateStr(d);
        if (historySet.has(dStr)) {
            streak++;
            graceUsed = false;
        } else if (!graceUsed) {
            graceUsed = true;
        } else {
            break;
        }
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

function toggleHabit(habitId) {
    const habit = gameState.habits.find(h => h.id===habitId);
    if (!habit) return;

    const wasCompleted = habit.completed;
    habit.completed = !habit.completed;
    const skillKey = habit.category || 'discipline';

    if (habit.completed && !wasCompleted) {
        habit.lastCompleted = getNow().toISOString();
        if (!habit.history) habit.history = [];
        const todayKey = getLocalDateStr(getNow());
        if (!habit.history.includes(todayKey)) habit.history.push(todayKey);
        if (habit.frequency === 'weekly' && !habit.lastWeekReset)
            habit.lastWeekReset = getISOWeekString(getNow());

        // V6.2: compute streak from history (robust, handles grace)
        habit.streak = computeHabitStreak(habit);
        const streakBonus = (habit.streak||0) * 5;
        const xp = Math.floor(HABIT_XP * (1 + streakBonus/100));

        gainSkillXP(skillKey, xp, `Habitude — ${habit.name}`);
        gameState.stats.totalHabitsCompleted++;
        triggerHabitCelebration(habitId);

        const mult = getWeaponBoostMult(skillKey);
        const boosted = Math.floor(xp * mult);
        const hasBonus = boosted > xp;
        const bonusText = hasBonus ? ` (+${Math.round((mult-1)*100)}% ⚔️)` : '';
        const xpText = hasBonus ? `+${xp} → +${boosted}` : `+${xp}`;
        toast(`✅ ${xpText} XP → ${SKILL_CONFIG[skillKey].name}${bonusText}`, 'success');

    } else if (!habit.completed && wasCompleted) {
        // Remove today from history on uncheck
        const todayKey = getLocalDateStr(getNow());
        if (habit.history) habit.history = habit.history.filter(d => d !== todayKey);
        habit.streak = computeHabitStreak(habit);
        const streakBonus = (habit.streak||0) * 5;
        const xp = Math.floor(HABIT_XP * (1 + streakBonus/100));
        removeSkillXP(skillKey, xp);
        gameState.stats.totalHabitsCompleted = Math.max(0, gameState.stats.totalHabitsCompleted-1);
        habit.lastCompleted = null;
    }

    saveGameState();
    checkQuestProgress();
    renderUI();
}

// V6.0c: Check habit for yesterday (J-1 only)
function toggleHabitYesterday(habitId) {
    const habit = gameState.habits.find(h => h.id===habitId);
    if (!habit) return;

    const yesterday = new Date(getNow());
    yesterday.setDate(yesterday.getDate()-1);
    const yesterdayStr = getLocalDateStr(yesterday);

    if ((habit.history||[]).includes(yesterdayStr)) {
        toast('Déjà validé pour hier.', 'info'); return;
    }

    // V6.2c: push history first, then recompute streak so the J-1 click
    // properly restores a streak that the grace-period logic was about to drop.
    if (!habit.history) habit.history = [];
    habit.history.push(yesterdayStr);
    habit.streak = computeHabitStreak(habit);
    habit.lastCompleted = yesterday.toISOString();

    // Award XP using the freshly-recomputed streak
    const skillKey = habit.category || 'discipline';
    const streakBonus = (habit.streak||0) * 5;
    const xp = Math.floor(HABIT_XP * (1 + streakBonus/100));

    // V6.0d fix: use gainSkillXP to apply weapon boost
    gainSkillXP(skillKey, xp, `Habitude — ${habit.name} (hier)`);

    saveGameState();
    checkQuestProgress();
    renderUI();

    // Show boost in toast
    const mult = getWeaponBoostMult(skillKey);
    const boosted = Math.floor(xp * mult);
    const hasBonus = boosted > xp;
    const bonusText = hasBonus ? ` (+${Math.round((mult-1)*100)}% ⚔️)` : '';
    const xpText = hasBonus ? `+${xp} → +${boosted}` : `+${xp}`;
    toast(`✅ "${habit.name}" validé pour hier — ${xpText} XP${bonusText}`, 'success');
}

function confirmDeleteHabit(habitId) {
    const habit = gameState.habits.find(h => h.id===habitId);
    if (!habit) return;
    showModal({
        type: 'danger',
        title: 'Supprimer l\'habitude?',
        body: `"${habit.name}" sera définitivement supprimée.`,
        confirmLabel: 'Supprimer',
        onConfirm: () => {
            if (habit.completed) {
                const streakBonus = (habit.streak||0) * 5;
                const xp = Math.floor(HABIT_XP * (1 + streakBonus/100));
                const skillKey = habit.category || 'discipline';
                removeSkillXP(skillKey, xp);
                gameState.stats.totalHabitsCompleted = Math.max(0, gameState.stats.totalHabitsCompleted-1);
            }
            if (!gameState._deletedHabits) gameState._deletedHabits = [];
            gameState._deletedHabits.push({
                name: habit.name,
                streak: habit.streak||0,
                deletedDate: getLocalDateStr(getNow())
            });
            const today = getLocalDateStr(getNow());
            gameState._deletedHabits = gameState._deletedHabits.filter(d => d.deletedDate === today);

            gameState.habits = gameState.habits.filter(h => h.id!==habitId);
            saveGameState(); renderUI();
            toast('Habitude supprimée.', 'success');
        }
    });
}

function openEditHabitModal(habitId) {
    const habit = gameState.habits.find(h => h.id===habitId);
    if (!habit) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box edit">
            <div class="modal-title blue">✏️ Modifier l'habitude</div>
            ${habit.streak>0 ? `<div class="modal-streak-warn">🔥 ${habit.streak} jours de streak — préservé.</div>` : ''}
            <div class="modal-field">
                <label>Nom</label>
                <input type="text" id="eh-name" value="${habit.name}" />
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="eh-cancel">Annuler</button>
                <button class="btn-blue"   id="eh-save">Sauvegarder</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const nameInput = document.getElementById('eh-name');
    nameInput.focus();
    document.getElementById('eh-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

    const save = () => {
        const newName = nameInput.value.trim();
        if (!newName) { toast('Le nom ne peut pas être vide.'); return; }
        habit.name = newName;
        overlay.remove();
        saveGameState(); renderUI();
        toast('Mise à jour!', 'success');
    };

    document.getElementById('eh-save').onclick = save;
    nameInput.addEventListener('keypress', e => { if(e.key==='Enter') save(); });
}

function confirmReset() {
    showModal({
        type: 'danger',
        title: '⚠️ Tout réinitialiser?',
        body: 'Tout l\'XP, les niveaux, habitudes et sessions seront définitivement effacés.',
        confirmLabel: 'Réinitialiser',
        onConfirm: () => {
            localStorage.removeItem(STORAGE_KEY);
            _nextId = 1; _prevGlobalLevel = 1;
            gameState = {
                username: gameState.username || 'Hero',
                skills: { endurance:{level:1,currentXP:0,totalXP:0}, sagesse:{level:1,currentXP:0,totalXP:0}, discipline:{level:1,currentXP:0,totalXP:0}, serenite:{level:1,currentXP:0,totalXP:0}, maitrise:{level:1,currentXP:0,totalXP:0} },
                habits: [], sessions: [],
                lastResetDate: getLocalDateStr(new Date()),
                stats: { totalHabitsCompleted:0, perfectDays:0, longestStreak:0 },
                quests: null
            };
            seedRecommendedHabits();
            saveGameState(); renderUI();
            toast('Progression réinitialisée.', 'success');
        }
    });
}

// ─────────────────────────────────────────────
//  SESSION ACTIONS
// ─────────────────────────────────────────────
function openNewSessionModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box create">
            <div class="modal-title green">➕ Nouvelle Session</div>
            <div class="modal-field">
                <label>Nom</label>
                <input type="text" id="ns-name" placeholder="ex: Sport, Lecture..." />
            </div>
            <div class="modal-field">
                <label>Compétence</label>
                <select id="ns-cat">
                    <option value="">Choisir une compétence...</option>
                    ${Object.entries(SKILL_CONFIG).filter(([k])=>k!=='discipline')
                        .map(([k,v])=>`<option value="${k}">${v.icon} ${v.name}</option>`).join('')}
                </select>
            </div>
            <div class="modal-field">
                <label>Objectif hebdomadaire (minutes)</label>
                <input type="number" id="ns-goal" min="1" max="9999" placeholder="ex: 150" />
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="ns-cancel">Annuler</button>
                <button class="btn-green"  id="ns-save">Créer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    document.getElementById('ns-name').focus();
    document.getElementById('ns-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

    document.getElementById('ns-save').onclick = () => {
        const name = document.getElementById('ns-name').value.trim();
        const cat  = document.getElementById('ns-cat').value;
        const goal = parseInt(document.getElementById('ns-goal').value, 10);
        if (!name)        { toast('Entre un nom.'); return; }
        if (!cat)         { toast('Choisis une compétence.'); return; }
        if (!goal||goal<1){ toast('Définis un objectif hebdomadaire.'); return; }
        gameState.sessions.push({ id:nextId(), name, category:cat, weeklyGoalMinutes:goal,
            streak:0, lastWeekCompleted:null, logs:[], partialCredit:[] });
        overlay.remove();
        saveGameState(); renderUI();
        toast(`"${name}" créée!`, 'success');
    };
}

function openLogSessionModal(sessionId) {
    const session = gameState.sessions.find(s => s.id===sessionId);
    if (!session) return;

    const today = getLocalDateStr(getNow());
    const cfg   = SKILL_CONFIG[session.category];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box create">
            <div class="modal-title green">${cfg.icon} Log — ${session.name}</div>
            ${session.streak>0 ? `<div class="modal-streak-warn">🔥 ${session.streak} semaines de streak (+${session.streak*5}% XP)</div>` : ''}
            <div class="modal-field">
                <label>Durée (minutes)</label>
                <input type="number" id="log-mins" min="1" max="9999" placeholder="ex: 45" />
            </div>
            <div class="modal-field">
                <label>Date</label>
                <input type="date" id="log-date" value="${today}" max="${today}" />
            </div>
            <div class="xp-preview-box" id="xp-preview">Entre la durée pour prévisualiser l'XP</div>
            <div class="modal-actions">
                <button class="btn-cancel" id="log-cancel">Annuler</button>
                <button class="btn-green"  id="log-ok">Enregistrer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const minsEl    = document.getElementById('log-mins');
    const previewEl = document.getElementById('xp-preview');
    minsEl.focus();

    minsEl.addEventListener('input', () => {
        const m = parseInt(minsEl.value, 10);
        if (!m||m<1) { previewEl.textContent = 'Entre la durée pour prévisualiser l\'XP'; return; }
        const base = getSessionBaseXP(session.category, m);
        if (!base) {
            previewEl.textContent = `< ${SESSION_THRESHOLDS[session.category]}min seuil — crédit partiel`;
        } else {
            const xp = calcSessionXP(session.category, m, session.streak||0);
            previewEl.textContent = `+${xp} XP → ${cfg.name}`;
        }
    });

    document.getElementById('log-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

    document.getElementById('log-ok').onclick = () => {
        const mins    = parseInt(document.getElementById('log-mins').value, 10);
        const dateStr = document.getElementById('log-date').value;
        if (!mins||mins<1) { toast('Entre une durée valide.'); return; }
        if (!dateStr)       { toast('Sélectionne une date.'); return; }
        overlay.remove();
        logSession(sessionId, mins, dateStr);
    };
}

function openEditSessionModal(sessionId) {
    const session = gameState.sessions.find(s => s.id===sessionId);
    if (!session) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box edit">
            <div class="modal-title blue">✏️ Modifier la Session</div>
            ${session.streak>0 ? `<div class="modal-streak-warn">🔥 ${session.streak} semaines de streak — préservé.</div>` : ''}
            <div class="modal-field">
                <label>Nom</label>
                <input type="text" id="es-name" value="${session.name}" />
            </div>
            <div class="modal-field">
                <label>Compétence</label>
                <select id="es-cat">
                    ${Object.entries(SKILL_CONFIG).filter(([k])=>k!=='discipline')
                        .map(([k,v])=>`<option value="${k}" ${session.category===k?'selected':''}>${v.icon} ${v.name}</option>`).join('')}
                </select>
            </div>
            <div class="modal-field">
                <label>Objectif hebdomadaire (minutes)</label>
                <input type="number" id="es-goal" value="${session.weeklyGoalMinutes}" min="1" max="9999" />
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="es-cancel">Annuler</button>
                <button class="btn-blue"   id="es-save">Sauvegarder</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    document.getElementById('es-name').focus();
    document.getElementById('es-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

    document.getElementById('es-save').onclick = () => {
        const name = document.getElementById('es-name').value.trim();
        const cat  = document.getElementById('es-cat').value;
        const goal = parseInt(document.getElementById('es-goal').value, 10);
        if (!name)         { toast('Le nom ne peut pas être vide.'); return; }
        if (!goal||goal<1) { toast('Définis un objectif valide.'); return; }
        session.name = name; session.category = cat; session.weeklyGoalMinutes = goal;
        overlay.remove();
        saveGameState(); renderUI();
        toast(`"${name}" mise à jour!`, 'success');
    };
}

function confirmDeleteSession(sessionId) {
    const session = gameState.sessions.find(s => s.id===sessionId);
    if (!session) return;
    showModal({
        type: 'danger',
        title: 'Supprimer la session?',
        body: `"${session.name}" et tous ses logs seront définitivement supprimés.`,
        confirmLabel: 'Supprimer',
        onConfirm: () => {
            gameState.sessions = gameState.sessions.filter(s => s.id!==sessionId);
            saveGameState(); renderUI();
            toast('Session supprimée.', 'success');
        }
    });
}

// ─────────────────────────────────────────────
//  USERNAME
// ─────────────────────────────────────────────
function startEditUsername(el) {
    const current = gameState.username || 'Hero';
    const input = document.createElement('input');
    input.className = 'avatar-username-input';
    input.value = current;
    el.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
        const val = input.value.trim() || 'Hero';
        gameState.username = val;
        saveGameState();
        renderUI();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keypress', e => { if(e.key==='Enter') { input.blur(); } });
    input.addEventListener('keydown',  e => { if(e.key==='Escape') { input.value=current; input.blur(); } });
}

// ─────────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────────
function toast(message, type='error') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3100);
}

// V6.0c: Queue system for level-up notifications
// Skills first, global last, 2s between each
const _levelUpQueue = [];
let _levelUpQueueRunning = false;
let _pendingGlobalLevelUp = null; // V6.0c: buffer global until all skills done

function _processLevelUpQueue() {
    if (_levelUpQueueRunning) return;
    if (_levelUpQueue.length === 0) {
        // All skills done — now show global if pending
        if (_pendingGlobalLevelUp !== null) {
            const level = _pendingGlobalLevelUp;
            _pendingGlobalLevelUp = null;
            _levelUpQueueRunning = true;
            _showGlobalLevelUpNow(level);
            setTimeout(() => { _levelUpQueueRunning = false; }, 2200);
        }
        return;
    }
    _levelUpQueueRunning = true;
    const next = _levelUpQueue.shift();
    next();
    setTimeout(() => {
        _levelUpQueueRunning = false;
        _processLevelUpQueue();
    }, 2000); // 2s between each
}

function showSkillLevelUp(skillKey, level) {
    _levelUpQueue.push(() => {
        const cfg = SKILL_CONFIG[skillKey];
        const el  = document.createElement('div');
        el.className = 'level-up-notif skill';
        el.innerHTML = `<span class="notif-icon">${cfg.icon}</span><div class="notif-title">${cfg.name} — Niveau ${level}</div>`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1800);
    });
    _processLevelUpQueue();
}

function showGlobalLevelUp(level) {
    // V6.0c: buffer global level-up — always shows AFTER all skill level-ups
    _pendingGlobalLevelUp = level;
    // If queue is already empty, start processing immediately (delayed)
    setTimeout(() => _processLevelUpQueue(), 100);
}

function _showGlobalLevelUpNow(level) {
    const flash = document.createElement('div');
    flash.className = 'global-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 2000);

    const el = document.createElement('div');
    el.className = 'level-up-notif global';
    el.innerHTML = `<span class="notif-icon">🌟</span><div class="notif-title">NIVEAU GLOBAL ${level}!</div><div class="notif-sub">Tu deviens légendaire.</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
}

// ─────────────────────────────────────────────
//  MODAL HELPER
// ─────────────────────────────────────────────
function showModal({ type='danger', title, body, confirmLabel='Confirmer', onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box ${type}">
            <div class="modal-title ${type==='danger'?'danger':'gold'}">${title}</div>
            <div class="modal-body">${body}</div>
            <div class="modal-actions">
                <button class="btn-cancel"         id="m-cancel">Annuler</button>
                <button class="btn-confirm-delete" id="m-confirm">${confirmLabel}</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('m-cancel').onclick  = () => overlay.remove();
    document.getElementById('m-confirm').onclick = () => { overlay.remove(); onConfirm(); };
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

// ─────────────────────────────────────────────
//  RENDER — SKILL ORBIT CIRCLES
// ─────────────────────────────────────────────
function buildOrbitSVG(skillKey, skill) {
    const cfg     = SKILL_CONFIG[skillKey];
    const R       = 22;
    const C       = 2 * Math.PI * R;
    const needed  = calculateXPForLevel(skill.level+1) - calculateXPForLevel(skill.level);
    const pct     = Math.min(1, skill.currentXP / needed);
    const dash    = C * pct;
    const offset  = C - dash;

    return `
        <svg viewBox="0 0 52 52" style="transform:rotate(90deg)">
            <circle class="orbit-track" cx="26" cy="26" r="${R}" />
            <circle class="orbit-fill"
                cx="26" cy="26" r="${R}"
                stroke="${cfg.color}"
                stroke-dasharray="${C}"
                stroke-dashoffset="${offset.toFixed(2)}"
            />
        </svg>
        <span class="orbit-icon">${cfg.icon}</span>
        <span class="orbit-level">Lv${skill.level}</span>
        <div class="orbit-tooltip">${SKILL_TOOLTIPS[skillKey]||''}</div>
    `;
}

function buildDisciplineSoloRing(skill) {
    const R      = 58;
    const C      = 2 * Math.PI * R;
    const needed = calculateXPForLevel(skill.level+1) - calculateXPForLevel(skill.level);
    const pct    = Math.min(1, skill.currentXP / needed);
    const dash   = C * pct;
    const offset = C - dash;

    return `
        <svg viewBox="0 0 130 130" style="transform:rotate(90deg)">
            <circle class="orbit-track" cx="65" cy="65" r="${R}" />
            <circle class="orbit-fill"
                cx="65" cy="65" r="${R}"
                stroke="${SKILL_CONFIG.discipline.color}"
                stroke-dasharray="${C}"
                stroke-dashoffset="${offset.toFixed(2)}"
                stroke-width="6"
            />
        </svg>
    `;
}

// ─────────────────────────────────────────────
//  TOOLTIP TAP/CLICK (mobile friendly)
// ─────────────────────────────────────────────
function toggleOrbitTooltip(orbitEl) {
    const tooltip = orbitEl.querySelector('.orbit-tooltip');
    if (!tooltip) return;
    // Close all other tooltips first
    document.querySelectorAll('.orbit-tooltip.visible').forEach(t => {
        if (t !== tooltip) t.classList.remove('visible');
    });
    tooltip.classList.toggle('visible');
    // Auto-close after 3s
    if (tooltip.classList.contains('visible')) {
        setTimeout(() => tooltip.classList.remove('visible'), 3000);
    }
}
// Close tooltips when clicking elsewhere
document.addEventListener('click', e => {
    if (!e.target.closest('.skill-orbit')) {
        document.querySelectorAll('.orbit-tooltip.visible')
            .forEach(t => t.classList.remove('visible'));
    }
});

// ─────────────────────────────────────────────
//  DYNAMIC AVATAR (V3.1) — initiale du pseudo
// ─────────────────────────────────────────────
function supermanSVG() {
    const initial = (gameState.username || 'H')[0].toUpperCase();
    return `<svg class="superman-s" viewBox="0 0 54 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Shield outer (yellow border) -->
        <path d="M27 1 L53 14 L53 33 Q53 52 27 59 Q1 52 1 33 L1 14 Z"
            fill="#f5c842"/>
        <!-- Shield inner (dark blue) -->
        <path d="M27 5 L49 16 L49 33 Q49 49 27 55 Q5 49 5 33 L5 16 Z"
            fill="#1a2a5e"/>
        <!-- Red diamond background -->
        <path d="M27 8 L47 18 L47 33 Q47 47 27 53 Q7 47 7 33 L7 18 Z"
            fill="#cc1111"/>
        <!-- Yellow inner border -->
        <path d="M27 11 L44 20 L44 33 Q44 44 27 50 Q10 44 10 33 L10 20 Z"
            fill="#f5c842"/>
        <!-- Red letter background -->
        <path d="M27 14 L41 22 L41 33 Q41 42 27 47 Q13 42 13 33 L13 22 Z"
            fill="#cc1111"/>
        <!-- Dynamic initial -->
        <text x="27" y="38"
            font-family="'Cinzel', 'Georgia', serif"
            font-size="20"
            font-weight="900"
            text-anchor="middle"
            fill="#f5c842"
            stroke="#000"
            stroke-width="0.5"
            paint-order="stroke"
        >${initial}</text>
    </svg>`;
}

// ─────────────────────────────────────────────
//  TAB NAVIGATION
// ─────────────────────────────────────────────
function switchTab(tabName) {
    // V5.3: remap saved 'quetes' → 'campagne'
    if (tabName === 'quetes') tabName = 'campagne';
    // V7.0b: flush any pending journal autosave before leaving
    if (typeof flushJournalAutosave === 'function') flushJournalAutosave();
    // V7.0: re-lock journal when leaving profil
    const wasProfil = document.querySelector('.page.active')?.dataset.page === 'profil';
    if (wasProfil && tabName !== 'profil' && gameState.journal?.pinHash) {
        _journalUnlocked = false;
    }
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.dataset.page === tabName);
    });
    localStorage.setItem('lifeRPG_tab_v3', tabName);
    renderUI();
}

// ─────────────────────────────────────────────
//  DEBUG PANEL
// ─────────────────────────────────────────────
function toggleDebugPanel() {
    if (!_debugMode) return;
    const panel = document.getElementById('debug-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open'))
        document.getElementById('debug-date').value = getLocalDateStr(getNow());
}

function debugNextDay() {
    if (!_debugMode) return;
    const b = getNow(); b.setDate(b.getDate()+1);
    _dateOverride = b.toISOString();
    document.getElementById('debug-date').value = getLocalDateStr(b);
    _checkDailyResetWithDate(b); checkWeeklySessionReset(b); checkWeeklyHabitsReset(b);
    generateDailyQuests(b);
    renderUI();
    toast(`📅 ${b.toDateString()}`, 'info');
}

function debugNextWeek() {
    if (!_debugMode) return;
    const b = getNow(); b.setDate(b.getDate()+7);
    _dateOverride = b.toISOString();
    document.getElementById('debug-date').value = getLocalDateStr(b);
    _checkDailyResetWithDate(b); checkWeeklySessionReset(b); checkWeeklyHabitsReset(b);
    generateDailyQuests(b);
    renderUI();
    toast(`📅 +7 jours: ${b.toDateString()}`, 'info');
}

function debugApplyDate() {
    if (!_debugMode) return;
    const val = document.getElementById('debug-date').value;
    if (!val) { toast('Sélectionne une date.'); return; }
    _dateOverride = new Date(val).toISOString();
    const d = new Date(val);
    _checkDailyResetWithDate(d); checkWeeklySessionReset(d); checkWeeklyHabitsReset(d);
    generateDailyQuests(d);
    renderUI();
    toast(`📅 ${d.toDateString()}`, 'info');
}

function debugCheckAll() {
    // V6.2d: aligned with real toggleHabit behavior
    //  - push today into history (so calendar & streak work)
    //  - use proper "Habitude — name" label (so profile XP history groups it)
    //  - recompute streak via computeHabitStreak
    const todayKey = getLocalDateStr(getNow());
    gameState.habits.forEach(h => {
        if (h.completed) return;
        h.completed = true;
        h.lastCompleted = getNow().toISOString();
        if (!h.history) h.history = [];
        if (!h.history.includes(todayKey)) h.history.push(todayKey);
        if (h.frequency === 'weekly' && !h.lastWeekReset)
            h.lastWeekReset = getISOWeekString(getNow());
        h.streak = computeHabitStreak(h);
        const xp = Math.floor(HABIT_XP * (1 + (h.streak||0) * 5 / 100));
        const skillKey = h.category || 'discipline';
        gainSkillXP(skillKey, xp, `Habitude — ${h.name}`);
        gameState.stats.totalHabitsCompleted++;
    });
    saveGameState(); checkQuestProgress(); renderUI();
    toast('Toutes les habitudes cochées!', 'success');
}

function debugUncheckAll() {
    // V6.2d: also remove today from history so streak & calendar stay consistent
    const todayKey = getLocalDateStr(getNow());
    gameState.habits.forEach(h => {
        if (!h.completed) return;
        const xp = Math.floor(HABIT_XP * (1 + (h.streak||0) * 5 / 100));
        const skillKey = h.category || 'discipline';
        removeSkillXP(skillKey, xp);
        gameState.stats.totalHabitsCompleted = Math.max(0, gameState.stats.totalHabitsCompleted - 1);
        h.completed = false;
        h.lastCompleted = null;
        if (h.history) h.history = h.history.filter(d => d !== todayKey);
        h.streak = computeHabitStreak(h);
    });
    saveGameState(); renderUI(); toast('Tout décoché.', 'success');
}

// ─────────────────────────────────────────────
//  RENDER — MAIN
// ─────────────────────────────────────────────
function renderUI() {
    updateTopBar();
    // V6.0b fix: render title display on every UI update (was lost on reload)
    if (typeof renderTitleDisplay === 'function') renderTitleDisplay();
    // V6.0b fix: update mood FAB on every render so it resets at midnight
    if (typeof updateMoodFab === 'function') updateMoodFab();
    // V7.0b: badge on Journal sub-tab when today's entry is missing
    if (typeof updateJournalDot === 'function') updateJournalDot();
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'habits';
    if (activeTab === 'habits') {
        // V8.0: dispatch to active subtab
        const activeSub = document.querySelector('.habits-subtab.active')?.dataset.subtab || 'habits';
        if (activeSub === 'tasks') renderTasksPage();
        else renderHabitsPage();
    }
    if (activeTab === 'sessions') renderSessionsPage();
    if (activeTab === 'campagne') renderCampagnePage();
    if (activeTab === 'profil') {
        // V7.0: dispatch to active subtab
        const activeSub = document.querySelector('.prof-subtab.active')?.dataset.subtab || 'profil';
        if (activeSub === 'journal') renderJournalPage();
        else renderProfilPage();
    }
    // V8.0: keep tasks dot updated
    if (typeof updateHabitsTasksDot === 'function') updateHabitsTasksDot();
}

function updateTopBar() {
    const el = document.getElementById('top-username');
    if (el) el.textContent = gameState.username || 'Hero';
    // Global level always visible in top bar
    const glEl = document.getElementById('top-global-level');
    if (glEl) glEl.textContent = `Niv. ${getGlobalLevel()}`;
}

// ─── HABITS PAGE ───
function renderHabitsPage() {
    const avatarStage = document.getElementById('habits-avatar-stage');
    if (avatarStage) {
        // 5 orbital circles — same positions as profil
        const HABITS_POSITIONS = {
            sagesse:    { left:'130.0px', top:'35.0px'  },
            endurance:  { left:'47.7px',  top:'82.5px'  },
            serenite:   { left:'212.3px', top:'82.5px'  },
            maitrise:   { left:'212.3px', top:'177.5px' },
            discipline: { left:'47.7px',  top:'177.5px' }
        };
        const orbits = Object.keys(SKILL_CONFIG).map(key => {
            const pos = HABITS_POSITIONS[key];
            return `<div class="skill-orbit" style="left:${pos.left};top:${pos.top}" onclick="toggleOrbitTooltip(this)">${buildOrbitSVG(key, gameState.skills[key])}</div>`;
        }).join('');
        avatarStage.innerHTML = `
            ${orbits}
            <div class="avatar-center" onclick="startEditUsername(document.getElementById('habit-username'))">
                ${supermanSVG()}
            </div>`;
    }

    const unEl = document.getElementById('habit-username');
    if (unEl) unEl.textContent = gameState.username || 'Hero';

    const dlEl = document.getElementById('discipline-level-label');
    if (dlEl) dlEl.textContent = '';

    const perfectEl = document.getElementById('pill-perfect');
    const streakEl  = document.getElementById('pill-streak');
    const doneTodayCount = gameState.habits.filter(h => h.completed).length;
    const progressTo8 = `${doneTodayCount}/8`;
    const allDone8  = doneTodayCount >= 8;
    if (perfectEl) {
        const ps = gameState.stats.perfectStreak || 0;
        // V6.0c fix: HTML already has 🔥 icon — don't add it again in JS
        perfectEl.textContent = ps > 0 ? `${ps}j` : progressTo8;
    }
    if (streakEl) {
        const lps = gameState.stats.longestPerfectStreak || 0;
        streakEl.textContent = lps;
    }

    const list = document.getElementById('habits-list');
    if (!list) return;
    list.innerHTML = '';

    // Separate recommended and personal habits
    const recoHabits     = gameState.habits.filter(h => h.isRecommended);
    const personalHabits = gameState.habits.filter(h => !h.isRecommended);

    const renderHabitItem = (habit) => {
        // V6.2: always compute streak from history for accurate display
        const currentStreak = computeHabitStreak(habit);
        const streakBonus = currentStreak * 5;
        const xp          = Math.floor(HABIT_XP * (1 + streakBonus/100));
        // V6.0d: weapon boost display
        const skillKey    = habit.category || 'discipline';
        const weaponMult  = getWeaponBoostMult(skillKey);
        const weaponPct   = Math.round((weaponMult - 1) * 100);
        const xpFinal     = Math.floor(xp * weaponMult);
        const weaponHtml  = weaponPct > 0
            ? `<span class="habit-weapon-boost"> · +${weaponPct}% ⚔️</span>` : '';
        const streakHtml  = currentStreak > 0
            ? `<span class="habit-streak"> · 🔥${currentStreak}j (+${streakBonus}%)</span>` : '';
        const skillCfg    = SKILL_CONFIG[habit.category || 'discipline'];
        const recoTag     = habit.isRecommended
            ? `<span class="habit-reco-tag" style="color:${skillCfg.color}">${skillCfg.icon}</span>` : '';

        const weeklyBadge = habit.frequency === 'weekly'
            ? `<span class="habit-weekly-badge">hebdo</span>` : '';
        const calBtn = `<button class="btn-cal" title="Voir le calendrier"
            onclick="openHabitCalendar(${habit.id})">📅</button>`;
        const actionsHtml = habit.isRecommended
            ? `<div class="habit-actions">${calBtn}</div>`
            : `<div class="habit-actions">
                ${calBtn}
                <button class="btn-ghost" onclick="openEditHabitModal(${habit.id})">✏️</button>
                <button class="btn-danger" onclick="confirmDeleteHabit(${habit.id})">🗑</button>
               </div>`;

        // V6.0c: J-1 button — only for uncompleted daily habits not yet done yesterday
        const yesterdayStr = (() => {
            const y = new Date(getNow()); y.setDate(y.getDate()-1);
            return getLocalDateStr(y);
        })();
        const alreadyDoneYesterday = (habit.history||[]).includes(yesterdayStr);
        const canCheckYesterday = !habit.completed && !alreadyDoneYesterday && habit.frequency !== 'weekly';
        const yesterdayBtn = canCheckYesterday
            ? `<button class="btn-yesterday" title="Valider pour hier" onclick="toggleHabitYesterday(${habit.id})">↩ hier</button>`
            : '';

        const el = document.createElement('div');
        el.className = `habit-item ${habit.completed ? 'completed' : ''}`;
        el.innerHTML = `
            <div class="checkbox-wrap">
                <input type="checkbox" class="habit-checkbox" id="hc-${habit.id}"
                    ${habit.completed ? 'checked' : ''}
                    onchange="toggleHabit(${habit.id})" />
                <label for="hc-${habit.id}" class="checkmark">✓</label>
            </div>
            <div class="habit-body">
                <div class="habit-name">${habit.icon ? habit.icon + ' ' : ''}${habit.name} ${recoTag}${weeklyBadge}</div>
                <div class="habit-meta">+${xpFinal} XP → ${skillCfg.name}${streakHtml}${weaponHtml}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                ${yesterdayBtn}
                ${actionsHtml}
            </div>`;
        list.appendChild(el);
    };

    const dailyPersonal  = personalHabits.filter(h => h.frequency !== 'weekly');
    const weeklyPersonal = personalHabits.filter(h => h.frequency === 'weekly');

    if (gameState.habits.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="ei">🏠</span><p>Aucune habitude. Ajoute ta première habitude ci-dessus.</p></div>`;
        return;
    }

    if (recoHabits.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'habit-section-label';
        secLabel.textContent = '⭐ Recommandées — Quotidiennes';
        list.appendChild(secLabel);
        recoHabits.forEach(renderHabitItem);
    }

    if (dailyPersonal.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'habit-section-label';
        secLabel.textContent = '✏️ Personnelles — Quotidiennes';
        list.appendChild(secLabel);
        dailyPersonal.forEach(renderHabitItem);
    }

    if (weeklyPersonal.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'habit-section-label';
        secLabel.textContent = '📅 Personnelles — Hebdomadaires';
        list.appendChild(secLabel);
        weeklyPersonal.forEach(renderHabitItem);
    }
}

// ─── SESSIONS PAGE ───
function renderSessionsPage() {
    const stage = document.getElementById('sessions-avatar-stage');
    if (stage) {
        // V3.1: exact 90° positions — 12h top, 3h right, 6h bottom, 9h left
        const sessionSkills = ['sagesse','endurance','serenite','maitrise'];
        // Positions px — centre stage=130px, rayon=95px, angles 12h/3h/6h/9h
        const positions = [
            { left:'130px', top:'35px'  },   // 12h — sagesse
            { left:'225px', top:'130px' },   // 3h  — endurance
            { left:'130px', top:'225px' },   // 6h  — serenite
            { left:'35px',  top:'130px' }    // 9h  — maitrise
        ];
        const orbits = sessionSkills.map((key, i) => {
            const skill = gameState.skills[key];
            return `<div class="skill-orbit" style="left:${positions[i].left};top:${positions[i].top}">${buildOrbitSVG(key, skill)}</div>`;
        }).join('');

        stage.innerHTML = `${orbits}<div class="avatar-center">${supermanSVG()}</div>`;
    }

    const list = document.getElementById('sessions-list');
    if (!list) return;
    list.innerHTML = '';

    if (gameState.sessions.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="ei">⚡</span><p>Aucune session. Crée ta première session pour commencer à tracker tes efforts.</p></div>`;
        return;
    }

    const now = getNow();
    const {mon,sun} = getWeekBoundaries(now);

    gameState.sessions.forEach(session => {
        const cfg     = SKILL_CONFIG[session.category];
        const weekMins = (session.logs||[]).reduce((sum,log) => {
            const d = new Date(log.date);
            return (d>=mon && d<=sun) ? sum+log.minutes : sum;
        }, 0);
        const pct      = Math.min(100, (weekMins/session.weeklyGoalMinutes)*100);
        const complete = weekMins >= session.weeklyGoalMinutes;

        const recentLogs = [...(session.logs||[])]
            .sort((a,b) => new Date(b.date)-new Date(a.date))
            .slice(0,3);

        const logsHtml = recentLogs.length > 0 ? `
            <div class="recent-logs">
                <div class="recent-logs-title">Logs récents</div>
                ${recentLogs.map(log => `
                    <div class="log-row">
                        <span class="log-date">${log.date}</span>
                        <span class="log-mins">${log.minutes} min</span>
                        <span class="log-xp">${log.xpAwarded > 0 ? `+${log.xpAwarded} XP` : '—'}</span>
                        <button class="log-del" onclick="deleteSessionLog(${session.id},${log.id})">✕</button>
                    </div>`).join('')}
            </div>` : '';

        const el = document.createElement('div');
        el.className = 'session-card';
        el.innerHTML = `
            <div class="session-card-top">
                <div class="session-card-info">
                    <span class="session-icon">${cfg.icon}</span>
                    <div>
                        <div class="session-name">${session.name}</div>
                        <div class="session-streak-lbl ${session.streak===0?'none':''}">
                            ${session.streak>0 ? `🔥 ${session.streak}sem streak (+${session.streak*5}% XP)` : 'Pas encore de streak'}
                        </div>
                    </div>
                </div>
                <div class="session-card-btns">
                    <button class="btn-green"  onclick="openLogSessionModal(${session.id})">Log</button>
                    <button class="btn-ghost"  onclick="openEditSessionModal(${session.id})">✏️</button>
                    <button class="btn-danger" onclick="confirmDeleteSession(${session.id})">🗑</button>
                </div>
            </div>
            <div class="progress-wrap">
                <div class="progress-meta">
                    <span>${weekMins} / ${session.weeklyGoalMinutes} min cette semaine</span>
                    <span class="${complete?'done':''}">${complete?'✅ Objectif atteint!':Math.round(pct)+'%'}</span>
                </div>
                <div class="prog-bg">
                    <div class="prog-fill ${complete?'complete':''}" style="width:${pct}%"></div>
                </div>
                <div class="week-label">${formatWeekLabel(now)}</div>
            </div>
            ${logsHtml}`;
        list.appendChild(el);
    });
}

// ─── QUÊTES PAGE ───
function renderQuetesPage() {
    const page = document.querySelector('.page[data-page="quetes"]');
    if (!page) return;

    const now = getNow();
    generateDailyQuests(now);

    if (!gameState.quests) {
        page.innerHTML = `<div class="empty-state" style="padding-top:40px"><span class="ei">🗡️</span><p>Chargement des quêtes...</p></div>`;
        return;
    }

    const completedIds = gameState.quests.completedIds || [];
    const { mon } = getWeekBoundaries(now);
    const daysLeft = Math.ceil((new Date(mon).setDate(mon.getDate() + 7) - now) / 86400000);

    const renderQuestCard = (quest, isWeekly = false) => {
        if (!quest) return '';
        const done    = completedIds.includes(quest.id);
        const prog    = getQuestProgress(quest);
        const skillKey = getQuestSkill(quest);
        const skillCfg = SKILL_CONFIG[skillKey];
        const blocked  = prog.blocked;

        const diffClass = isWeekly ? 'weekly' : (quest.xp >= 120 ? 'hard' : quest.xp >= 80 ? 'medium' : 'easy');

        let progressHtml = '';
        if (!done && !blocked) {
            progressHtml = `
                <div class="quest-prog-row">
                    <div class="quest-prog-bg"><div class="quest-prog-fill" style="width:${Math.round(prog.pct)}%;background:${skillCfg.color}"></div></div>
                    <span class="quest-prog-label">${prog.text}</span>
                </div>`;
        }

        return `
            <div class="quest-card ${done?'quest-done':''} ${blocked?'quest-blocked':''}">
                <div class="quest-card-left">
                    <div class="quest-skill-icon" style="background:${skillCfg.color}22;border-color:${skillCfg.color}44">${skillCfg.icon}</div>
                </div>
                <div class="quest-card-body">
                    <div class="quest-title">${done ? '✅ ' : ''}${quest.title}${blocked ? ' 🔒' : ''}</div>
                    <div class="quest-desc">${blocked ? prog.text : quest.desc}</div>
                    ${progressHtml}
                    <div class="quest-footer">
                        <span class="quest-xp-pill quest-${diffClass}" style="border-color:${skillCfg.color}55;color:${skillCfg.color}">+${quest.xp} XP → ${skillCfg.name}</span>
                        ${isWeekly ? `<span class="quest-days-left">${daysLeft}j restants</span>` : ''}
                    </div>
                </div>
            </div>`;
    };

    const todayFmt = now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});

    page.innerHTML = `
        <div style="padding-top:14px;">
            <div class="quetes-header">
                <div class="quetes-title">🗡️ Quêtes</div>
                <div class="quetes-sub">${formatWeekLabel(now)}</div>
            </div>

            <div class="quetes-section-label">
                Quotidiennes
                <span class="quetes-reset-badge">reset à minuit</span>
            </div>
            <div class="quests-list">
                ${(gameState.quests.daily||[]).map(q => renderQuestCard(q, false)).join('')}
            </div>

            <div class="quetes-section-label" style="margin-top:8px;">
                Hebdomadaire
                <span class="quetes-reset-badge">reset lundi</span>
            </div>
            <div class="quests-list">
                ${(gameState.quests.weeklyArr||[gameState.quests.weekly]).filter(Boolean).map(q=>renderQuestCard(q, true)).join('')}
            </div>
        </div>`;
}

// ─── PROFIL PAGE ───
let _openSkillAccordion = null; // track which skill accordion is open

function renderProfilPage() {
    const nameEl  = document.getElementById('profil-username');
    const levelEl = document.getElementById('profil-level');
    if (nameEl)  nameEl.textContent  = gameState.username || 'Hero';
    if (levelEl) levelEl.textContent = `Niveau Global ${getGlobalLevel()}`;

    // Small avatar
    const smallAvatar = document.getElementById('profil-avatar-small');
    if (smallAvatar) smallAvatar.innerHTML = supermanSVG();

    // Global XP bar
    const gl = getGlobalLevel();
    const glNeeded  = calculateXPForLevel(gl+1) - calculateXPForLevel(gl);
    const glCurrent = Math.floor(Object.values(gameState.skills).reduce((s,sk) => s + sk.currentXP, 0) / 5);
    const glPct     = Math.min(100, (glCurrent / glNeeded) * 100);
    const glLabel   = document.getElementById('global-level-label');
    const glVal     = document.getElementById('global-xp-val');
    const glFill    = document.getElementById('global-xp-fill');
    if (glLabel) glLabel.textContent = `Niveau Global · ${gl} / 100`;
    if (glVal)   glVal.textContent   = `${glCurrent.toLocaleString()} / ${glNeeded.toLocaleString()} XP`;
    if (glFill)  glFill.style.width  = `${glPct}%`;

    const barsEl = document.getElementById('profil-skill-bars');
    if (!barsEl) return;
    barsEl.innerHTML = '';

    const now      = getNow();
    const todayStr = getLocalDateStr(now);

    // Cutoff = 7 jours glissants — calcul robuste
    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const cutoff = getLocalDateStr(cutoffDate);

    // "Actif aujourd'hui" = habitude cochée OU session loggée aujourd'hui
    const activeWeekSkills = new Set();
    gameState.habits.forEach(h => {
        if (h.completed) activeWeekSkills.add(h.category || 'discipline');
    });
    gameState.sessions.forEach(s => {
        if ((s.logs||[]).some(l => l.date === todayStr && l.xpAwarded > 0))
            activeWeekSkills.add(s.category);
    });

    Object.entries(gameState.skills).forEach(([key, skill]) => {
        const cfg     = SKILL_CONFIG[key];
        const needed  = calculateXPForLevel(skill.level+1) - calculateXPForLevel(skill.level);
        const pct     = Math.min(100, (skill.currentXP/needed)*100);
        const lvlDisp = skill.level > 100 ? `100 ★${skill.level-100}` : skill.level;
        const isActive = activeWeekSkills.has(key);
        const isOpen   = _openSkillAccordion === key;

        // XP history for this skill, last 7 days, grouped by type
        const history = (gameState.xpHistory||[]).filter(e => e.skill === key && e.date >= cutoff);
        // V6.0c fix: use includes() + fallback for entries with no/different labels
        const habitEntries   = history.filter(e => e.label && (e.label.includes('Habitude') || e.label.includes('Habit')));
        const sessionEntries = history.filter(e => e.label && (e.label.includes('Session') || e.label.includes('partielle')));
        const questEntries   = history.filter(e => e.label && (e.label.includes('Quête') || e.label.includes('Quete') || e.label.includes('Quest')));
        // Entries with no recognized label (older versions) → show as misc
        const otherEntries   = history.filter(e => !e.label || (!e.label.includes('Habitude') && !e.label.includes('Session') && !e.label.includes('Quête') && !e.label.includes('partielle') && !e.label.includes('Note')));

        const renderHistoryGroup = (entries, groupTitle) => {
            if (entries.length === 0) return '';
            const rows = entries.slice(-10).reverse().map(e => {
                // V6.0d fix: smart label display
                let displayLabel = e.label || '';
                if (displayLabel.includes(' — ')) {
                    // "Habitude — Méditation" → "Méditation"
                    displayLabel = displayLabel.split(' — ').slice(1).join(' — ');
                } else if (['endurance','sagesse','discipline','serenite','maitrise'].includes(displayLabel)) {
                    // Bare skill name (older entries) → show type only
                    displayLabel = '(ancien)';
                }
                return `
                <div class="acc-hist-row">
                    <span class="acc-hist-date">${e.date}</span>
                    <span class="acc-hist-label">${displayLabel}</span>
                    <span class="acc-hist-xp" style="color:${cfg.color}">+${e.amount} XP</span>
                </div>`;
            }).join('');
            return `<div class="acc-hist-group"><div class="acc-hist-group-title">${groupTitle}</div>${rows}</div>`;
        };

        const accordionHtml = isOpen ? `
            <div class="skill-accordion">
                <div class="acc-description">${SKILL_TOOLTIPS[key]||''}</div>
                <div class="acc-graph-section">
                    <div class="acc-graph-title">Évolution XP</div>
                    ${buildSkillGraph(key)}
                </div>
                <div class="acc-history">
                    <div class="acc-history-title">Gains XP — 7 derniers jours</div>
                    ${history.length === 0
                        ? '<div class="acc-empty">Aucun gain cette semaine</div>'
                        : renderHistoryGroup(habitEntries,'🏠 Habitudes') +
                          renderHistoryGroup(sessionEntries,'⚡ Sessions') +
                          renderHistoryGroup(questEntries,'🗡️ Quêtes') +
                          renderHistoryGroup(otherEntries,'📊 Autres')
                    }
                </div>
            </div>` : '';

        const row = document.createElement('div');
        row.className = `skill-bar-row ${isOpen ? 'open' : ''} ${isActive ? 'active-week' : ''}`;
        row.innerHTML = `
            <div class="skill-bar-header" onclick="toggleSkillAccordion('${key}')">
                <div class="skill-bar-name">
                    <span>${cfg.icon}</span>
                    <span style="color:${cfg.color}">${cfg.name}</span>

                </div>
                <div class="skill-bar-right">
                    <div class="skill-bar-lvl">Lv ${lvlDisp}</div>
                    <span class="acc-chevron">${isOpen ? '▲' : '▼'}</span>
                </div>
            </div>
            <div class="skill-bar-track">
                <div class="skill-bar-prog" style="width:${pct}%;background:linear-gradient(90deg,${cfg.color},${cfg.color}99);${isActive?'box-shadow:0 0 8px '+cfg.color+'66':''};${isOpen?'border-radius:4px 4px 0 0':''}"></div>
            </div>
            <div class="skill-bar-xp">${skill.currentXP.toLocaleString()} / ${needed.toLocaleString()} XP</div>
            ${accordionHtml}`;
        barsEl.appendChild(row);
    });

    // V6.0a: Mood section
    const moodEl = document.getElementById('profil-mood-section');
    if (moodEl) moodEl.innerHTML = buildMoodSection();

    // Titles section
    const titlesEl = document.getElementById('profil-titles-section');
    if (titlesEl) {
        const unlocked = gameState.titles?.unlocked || [];
        if (unlocked.length === 0) {
            titlesEl.innerHTML = `<div class="titles-section"><div class="titles-empty">Aucun titre débloqué pour l'instant.<br>Continue à progresser pour en gagner.</div></div>`;
        } else {
            const active = gameState.titles?.active;
            let html = '<div class="titles-section"><div class="titles-grid">';
            unlocked.forEach(id => {
                const name = getTitleNameById(id);
                const isAct = id === active;
                html += `<div class="title-badge ${isAct?'active':''}"
                    onclick="setActiveTitle('${id}')"
                    style="${isAct?'border-color:var(--gold);background:rgba(245,200,66,0.1)':''}">
                    <span class="title-badge-name">${name}</span>
                    ${isAct ? '<span class="title-badge-active">✓ Actif</span>' : ''}
                </div>`;
            });
            html += '</div></div>';
            titlesEl.innerHTML = html;
        }
    }
}

function toggleSkillAccordion(key) {
    _openSkillAccordion = (_openSkillAccordion === key) ? null : key;
    renderProfilPage();
    // Scroll to the opened accordion
    if (_openSkillAccordion) {
        setTimeout(() => {
            const bars = document.getElementById('profil-skill-bars');
            if (bars) {
                const rows = bars.querySelectorAll('.skill-bar-row');
                const keys = Object.keys(SKILL_CONFIG);
                const idx  = keys.indexOf(key);
                if (rows[idx]) rows[idx].scrollIntoView({behavior:'smooth', block:'nearest'});
            }
        }, 50);
    }
}


// ─────────────────────────────────────────────
//  TITLE UNLOCK CELEBRATION
// ─────────────────────────────────────────────
function showTitleUnlockCelebration(titleName) {
    // Flash overlay
    const flash = document.createElement('div');
    flash.className = 'global-flash';
    flash.style.background = 'radial-gradient(ellipse at center, rgba(245,200,66,0.35) 0%, transparent 70%)';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 3000);

    // Fireworks particles
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'firework-particle';
        const colors = ['#ff6b6b','#f5c842','#00e87a','#4ecdc4','#3d8ef0','#9f7aea'];
        p.style.cssText = `
            position:fixed;
            left:${20 + Math.random()*60}%;
            top:${10 + Math.random()*50}%;
            width:${4+Math.random()*6}px;
            height:${4+Math.random()*6}px;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            border-radius:50%;
            z-index:6000;
            pointer-events:none;
            animation:fireworkPop ${0.6+Math.random()*0.8}s ease-out forwards;
            animation-delay:${Math.random()*0.4}s;
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1600);
    }

    // Big notification
    const el = document.createElement('div');
    el.className = 'title-unlock-notif';
    el.innerHTML = `
        <div class="tu-icon">🏅</div>
        <div class="tu-label">TITRE DÉBLOQUÉ</div>
        <div class="tu-name">${titleName}</div>
        <div class="tu-sub">Équipé automatiquement</div>
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

// ─────────────────────────────────────────────
//  INIT — moved to end of file (V6.0a)
//  (was here, but caused TDZ errors — let/const
//   defined later in file weren't accessible yet)
// ─────────────────────────────────────────────


/* ═══════════════════════════════════════════
   LIFE RPG V5 — Additions to app.js
   - V5.0: Settings modal with version + reset
   - V5.1: Calendar component (habits + skills)
   - V5.1: Weekly habits (frequency: daily|weekly)
   - V5.2: Title system (level-based + achievements)
   ═══════════════════════════════════════════ */


// ─────────────────────────────────────────────
//  V5.0 — SETTINGS MODAL
// ─────────────────────────────────────────────
// V6.2d: confirmation modal before cleaning future-dated data
function confirmCleanFutureData() {
    document.getElementById('settings-overlay')?.remove();
    const today = getLocalDateStr(new Date());
    // Preview the damage
    const xpFut    = (gameState.xpHistory || []).filter(e => e.date && e.date > today).length;
    const moodsFut = (gameState.moods || []).filter(m => m.date && m.date > today).length;
    let habitsFut = 0;
    (gameState.habits || []).forEach(h => {
        if (Array.isArray(h.history))
            habitsFut += h.history.filter(d => d > today).length;
    });
    // V7.0: journal
    let journalFut = 0;
    if (gameState.journal?.entries) {
        journalFut = Object.keys(gameState.journal.entries).filter(d => d > today).length;
    }
    // V8.0: tasks
    let tasksFut = 0;
    (gameState.tasks || []).forEach(t => {
        if (t.dueDate && t.dueDate > today) tasksFut++;
        if (t.completedDate && t.completedDate > today) tasksFut++;
    });
    if (Array.isArray(gameState.taskCompletionDates)) {
        tasksFut += gameState.taskCompletionDates.filter(d => d > today).length;
    }
    const lastResetFut = gameState.lastResetDate && gameState.lastResetDate > today;
    const totalEntries = xpFut + moodsFut + habitsFut + journalFut + tasksFut;

    if (totalEntries === 0 && !lastResetFut) {
        toast('Aucune donnée future à nettoyer ✅', 'info');
        return;
    }

    showModal({
        type: 'danger',
        title: '🧹 Nettoyer les données futures ?',
        body: `Aujourd'hui : <strong>${today}</strong><br><br>
            Entrées à supprimer :<br>
            • Historique XP : <strong>${xpFut}</strong><br>
            • Humeurs : <strong>${moodsFut}</strong><br>
            • Coches d'habitudes : <strong>${habitsFut}</strong><br>
            • Entrées journal : <strong>${journalFut}</strong><br>
            • Tâches : <strong>${tasksFut}</strong><br>
            ${lastResetFut ? '• Date du dernier reset (sera ramenée à aujourd\'hui)<br>' : ''}
            <br>Les streaks seront recalculés. <strong>Action irréversible</strong> — pense à exporter d'abord si tu veux garder ces données.`,
        confirmLabel: 'Nettoyer',
        onConfirm: () => {
            cleanFutureData(false);
            renderUI();
        }
    });
}

function openSettingsModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'settings-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="border-color:rgba(245,200,66,0.2);">
            <div class="modal-title gold">⚙️ Paramètres</div>
            <div class="settings-version">Ascend <span style="color:var(--gold)">${APP_VERSION}</span></div>
            <div class="settings-divider"></div>
            <div class="settings-row" onclick="openTitleSelector()" style="cursor:pointer;">
                <span class="settings-row-icon">🏅</span>
                <div class="settings-row-body">
                    <div class="settings-row-title">Changer de titre</div>
                    <div class="settings-row-sub">Titre actif : ${getActiveTitleName()}</div>
                </div>
                <span style="color:var(--text-dim);">›</span>
            </div>
            <div class="settings-divider"></div>
            <div class="settings-row" onclick="exportGameData()" style="cursor:pointer;">
                <span class="settings-row-icon">💾</span>
                <div class="settings-row-body">
                    <div class="settings-row-title">Exporter mes données</div>
                    <div class="settings-row-sub">Sauvegarde JSON locale</div>
                </div>
                <span style="color:var(--text-dim);">›</span>
            </div>
            <div class="settings-row" onclick="document.getElementById('import-file-input').click()" style="cursor:pointer;">
                <span class="settings-row-icon">📥</span>
                <div class="settings-row-body">
                    <div class="settings-row-title">Importer une sauvegarde</div>
                    <div class="settings-row-sub">Restaurer depuis un fichier JSON</div>
                </div>
                <span style="color:var(--text-dim);">›</span>
            </div>
            <input type="file" id="import-file-input" accept=".json,application/json" style="display:none" onchange="importGameData(event)">
            ${getLastBackupInfo()}
            <div class="settings-divider"></div>
            <div class="settings-row" onclick="confirmCleanFutureData()" style="cursor:pointer;">
                <span class="settings-row-icon">🧹</span>
                <div class="settings-row-body">
                    <div class="settings-row-title">Nettoyer données futures</div>
                    <div class="settings-row-sub">Supprime les entrées datées après aujourd'hui (artefacts mode test)</div>
                </div>
                <span style="color:var(--text-dim);">›</span>
            </div>
            <div class="settings-divider"></div>
            <div class="settings-row" onclick="openDevModeUnlock()" style="cursor:pointer;">
                <span class="settings-row-icon">🛠</span>
                <div class="settings-row-body">
                    <div class="settings-row-title">Mode test (développeur)</div>
                    <div class="settings-row-sub">${_debugMode ? '✅ Activé — clique pour désactiver' : 'Réservé aux beta-testeurs'}</div>
                </div>
                <span style="color:var(--text-dim);">›</span>
            </div>
            <div class="settings-divider"></div>
            <button class="btn-confirm-delete" style="width:100%;margin-top:8px;"
                onclick="document.getElementById('settings-overlay').remove();confirmReset();">
                🗑 Réinitialiser la progression
            </button>
            <div class="modal-actions" style="margin-top:10px;">
                <button class="btn-cancel" onclick="document.getElementById('settings-overlay').remove()">Fermer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

// ─────────────────────────────────────────────
//  V6.0a — EXPORT / IMPORT JSON
// ─────────────────────────────────────────────
function exportGameData() {
    try {
        const dump = {
            version: APP_VERSION,
            exportDate: new Date().toISOString(),
            storageKey: 'lifeRPGState_v3',
            data: gameState
        };
        const json = JSON.stringify(dump, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = getLocalDateStr(new Date());
        a.href = url;
        a.download = `Ascend_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
        // Track last backup
        gameState._lastBackup = new Date().toISOString();
        saveGameState();
        toast('💾 Sauvegarde téléchargée !', 'success');
        // Refresh settings modal to show new backup date
        const overlay = document.getElementById('settings-overlay');
        if (overlay) { overlay.remove(); openSettingsModal(); }
    } catch (e) {
        console.error('Export failed:', e);
        toast('❌ Erreur lors de l\'export.', 'error');
    }
}

function importGameData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            // Accept both raw gameState OR wrapped export format
            const newState = parsed.data || parsed;
            // Basic validation
            if (!newState.skills || !newState.habits) {
                toast('❌ Fichier invalide — pas une sauvegarde Ascend.', 'error');
                return;
            }
            const exportedFrom = parsed.version ? ` (depuis ${parsed.version})` : '';
            const exportDate = parsed.exportDate ? new Date(parsed.exportDate).toLocaleDateString('fr-FR') : 'date inconnue';
            showModal({
                type: 'danger',
                title: '⚠️ Confirmer l\'import',
                body: `Cette action remplacera TOUTE ta progression actuelle par la sauvegarde${exportedFrom} du ${exportDate}. Action irréversible.`,
                confirmLabel: 'Remplacer',
                onConfirm: () => {
                    try {
                        gameState = newState;
                        // Re-init missing fields
                        if (!gameState.titles)    gameState.titles = { unlocked:[], active:null };
                        if (!gameState.xpHistory) gameState.xpHistory = [];
                        if (!gameState.quests)    gameState.quests = null;
                        if (!gameState.campaign)  initCampaign();
                        saveGameState();
                        const overlay = document.getElementById('settings-overlay');
                        if (overlay) overlay.remove();
                        renderUI();
                        toast('✅ Sauvegarde restaurée avec succès !', 'success');
                    } catch (err) {
                        console.error('Import apply failed:', err);
                        toast('❌ Erreur lors de la restauration.', 'error');
                    }
                }
            });
        } catch (err) {
            console.error('Import parse failed:', err);
            toast('❌ Fichier JSON invalide.', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // reset input
}

function getLastBackupInfo() {
    const last = gameState._lastBackup;
    if (!last) {
        return `<div class="backup-warning">⚠️ Aucune sauvegarde — exporte régulièrement pour ne rien perdre.</div>`;
    }
    const lastDate = new Date(last);
    const daysSince = Math.floor((Date.now() - lastDate) / 86400000);
    if (daysSince > 30) {
        return `<div class="backup-warning">⚠️ Dernière sauvegarde il y a ${daysSince} jours — pense à exporter !</div>`;
    }
    if (daysSince > 7) {
        return `<div class="backup-info-row">📅 Dernière sauvegarde : ${lastDate.toLocaleDateString('fr-FR')} (${daysSince}j)</div>`;
    }
    return `<div class="backup-info-row" style="color:var(--green)">✅ Dernière sauvegarde : ${lastDate.toLocaleDateString('fr-FR')} (${daysSince === 0 ? 'aujourd\'hui' : daysSince + 'j'})</div>`;
}

function getActiveTitleName() {
    const activeId = gameState.titles?.active;
    if (!activeId) return '— — —';
    for (const skill of Object.keys(TITLES_BY_SKILL)) {
        const t = TITLES_BY_SKILL[skill].find(t => t.id === activeId);
        if (t) return t.name;
    }
    const ct = CAMPAIGN_TITLES.find(t => t.id === activeId);
    if (ct) return ct.name;
    return '— — —';
}

// ─────────────────────────────────────────────
//  V5.2 — TITLE SYSTEM
// ─────────────────────────────────────────────

// Check and unlock new titles based on current state
function checkTitleUnlocks() {
    if (!gameState.titles) gameState.titles = { unlocked:[], active:null };
    let newUnlock = false;

    // Level-based titles
    Object.entries(TITLES_BY_SKILL).forEach(([skill, titles]) => {
        const skillLevel = gameState.skills[skill]?.level || 0;
        titles.filter(t => t.level).forEach(t => {
            if (skillLevel >= t.level && !gameState.titles.unlocked.includes(t.id)) {
                gameState.titles.unlocked.push(t.id);
                newUnlock = true;
                toast(`🏅 Nouveau titre : "${t.name}"`, 'success');
                // Auto-equip first title unlocked
                if (!gameState.titles.active) {
                    gameState.titles.active = t.id;
                    renderTitleDisplay();
                }
            }
        });
    });

    // Achievement-based titles
    checkAchievementTitles();

    if (newUnlock) { saveGameState(); renderProfilPage(); }
}

function checkAchievementTitles() {
    if (!gameState.titles) gameState.titles = { unlocked:[], active:null };

    const checks = [
        // Sérénité
        { id:'ser_hf1',   condition: () => countSessionsAboveThreshold('serenite', 10) >= 50 },
        { id:'ser_hf365', condition: () => (gameState.stats.longestPerfectStreak||0) >= 365 }, // approx
        // Endurance
        { id:'end_hf1',   condition: () => countSessionsAboveThreshold('endurance', 20) >= 100 },
        { id:'end_hf365', condition: () => getHabitMaxStreak('Marche 20 min') >= 365 },
        // Sagesse
        { id:'sag_hf1',   condition: () => countSessionsAboveThreshold('sagesse', 15) >= 200 },
        { id:'sag_hf365', condition: () => getHabitMaxStreak('Lecture 15 min') >= 365 },
        // Maîtrise
        { id:'mai_hf1',   condition: () => countSessionsAboveThreshold('maitrise', 25) >= 75 },
        { id:'mai_hf365', condition: () => getPersonalHabitMaxStreak() >= 365 },
        // Discipline
        { id:'disc_hf1',  condition: () => (gameState.stats.perfectDays||0) >= 30 },
        { id:'disc_hf365',condition: () => (gameState.stats.longestPerfectStreak||0) >= 365 },
    ];

    checks.forEach(({ id, condition }) => {
        if (!gameState.titles.unlocked.includes(id) && condition()) {
            gameState.titles.unlocked.push(id);
            const titleName = getTitleNameById(id);
            showTitleUnlockCelebration(titleName);
            if (!gameState.titles.active) gameState.titles.active = id;
        }
    });
}

function countSessionsAboveThreshold(skill, minMins) {
    return gameState.sessions
        .filter(s => s.category === skill)
        .reduce((sum, s) => sum + (s.logs||[]).filter(l => l.minutes >= minMins).length, 0);
}

function getHabitMaxStreak(habitName) {
    const h = gameState.habits.find(h => h.name.toLowerCase() === habitName.toLowerCase());
    return h ? (h.streak||0) : 0;
}

function getPersonalHabitMaxStreak() {
    const personal = gameState.habits.filter(h => !h.isRecommended);
    return personal.length > 0 ? Math.max(...personal.map(h => h.streak||0)) : 0;
}

function getTitleNameById(id) {
    for (const skill of Object.keys(TITLES_BY_SKILL)) {
        const t = TITLES_BY_SKILL[skill].find(t => t.id === id);
        if (t) return t.name;
    }
    const ct = CAMPAIGN_TITLES.find(t => t.id === id);
    return ct ? ct.name : id;
}

function setActiveTitle(titleId) {
    if (!gameState.titles) gameState.titles = { unlocked:[], active:null };
    gameState.titles.active = titleId;
    saveGameState();
    renderTitleDisplay();
    renderProfilPage();
    toast('Titre équipé !', 'success');
}

function renderTitleDisplay() {
    const name = getActiveTitleName();
    const els = ['habit-title','profil-active-title'];
    els.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = name !== '— — —' ? name : '— — —';
    });
}

function openTitleSelector() {
    // Close settings first
    document.getElementById('settings-overlay')?.remove();
    if (!gameState.titles?.unlocked?.length) {
        toast('Aucun titre débloqué pour l\'instant.', 'info'); return;
    }

    const allTitles = [];
    Object.entries(TITLES_BY_SKILL).forEach(([skill, titles]) => {
        titles.forEach(t => {
            if (gameState.titles.unlocked.includes(t.id))
                allTitles.push({ ...t, skillKey: skill });
        });
    });
    CAMPAIGN_TITLES.forEach(t => {
        if (gameState.titles.unlocked.includes(t.id))
            allTitles.push({ ...t, skillKey: 'campaign' });
    });

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-title gold">🏅 Choisir un titre</div>
            <div class="titles-selector-list">
                ${allTitles.map(t => {
                    const cfg = t.skillKey !== 'campaign' ? SKILL_CONFIG[t.skillKey] : null;
                    const color = cfg ? cfg.color : (t.color || 'var(--gold)');
                    const isActive = gameState.titles.active === t.id;
                    return `<div class="title-selector-row ${isActive?'active':''}"
                        onclick="setActiveTitle('${t.id}');document.querySelector('.modal-overlay:last-child').remove()">
                        <span class="title-selector-name" style="color:${color}">${t.name}</span>
                        ${isActive ? '<span style="color:var(--green);font-size:0.8rem;">✓ Actif</span>' : ''}
                    </div>`;
                }).join('')}
            </div>
            <div class="modal-actions" style="margin-top:12px;">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

// ─────────────────────────────────────────────
//  V5.1 — CALENDAR COMPONENT
// ─────────────────────────────────────────────
let _calendarState = {
    year: 2026, month: 0,          // current displayed month
    highlightDates: new Set(),      // 'YYYY-MM-DD' strings
    highlightColor: '#f5c842',
    title: 'Calendrier'
};

function openHabitCalendar(habitId) {
    const habit = gameState.habits.find(h => h.id === habitId);
    if (!habit) return;
    const cfg = SKILL_CONFIG[habit.category || 'discipline'];

    // V6.0c fix: build dates from multiple sources
    const dates = new Set(habit.history || []);

    // Also include lastCompleted date if not already in history
    if (habit.lastCompleted) {
        try {
            const lc = getLocalDateStr(new Date(habit.lastCompleted));
            dates.add(lc);
        } catch(e) {}
    }

    // Fallback: scan xpHistory for entries matching this habit name
    if (dates.size === 0 && habit.name) {
        const label = `Habitude — ${habit.name}`;
        (gameState.xpHistory || []).forEach(e => {
            if (e.skill === (habit.category||'discipline') && e.label && e.label.includes(habit.name)) {
                dates.add(e.date);
            }
        });
    }

    const now = getNow();
    openCalendarModal(
        `📅 ${habit.name}`,
        dates,
        cfg.color,
        now.getFullYear(),
        now.getMonth()
    );
}

function openSkillCalendar(skillKey) {
    const cfg = SKILL_CONFIG[skillKey];
    const dates = new Set(
        (gameState.xpHistory||[])
            .filter(e => e.skill === skillKey)
            .map(e => e.date)
    );
    const now = getNow();
    openCalendarModal(
        `📅 ${cfg.icon} ${cfg.name}`,
        dates,
        cfg.color,
        now.getFullYear(),
        now.getMonth()
    );
}

function openCalendarModal(title, highlightDates, color, year, month) {
    _calendarState = { year, month, highlightDates, highlightColor: color, title };
    const modal = document.getElementById('calendar-modal');
    if (!modal) return;
    document.getElementById('calendar-modal-title').textContent = title;
    modal.style.display = 'flex';
    renderCalendarGrid();
}

function closeCalendarModal() {
    const modal = document.getElementById('calendar-modal');
    if (modal) modal.style.display = 'none';
}

function calendarPrevMonth() {
    _calendarState.month--;
    if (_calendarState.month < 0) {
        _calendarState.month = 11;
        _calendarState.year--;
    }
    // Don't go before Jan 2026
    if (_calendarState.year < 2026 || (_calendarState.year === 2026 && _calendarState.month < 0)) {
        _calendarState.year = 2026; _calendarState.month = 0;
    }
    renderCalendarGrid();
}

function calendarNextMonth() {
    const now = getNow();
    _calendarState.month++;
    if (_calendarState.month > 11) {
        _calendarState.month = 0;
        _calendarState.year++;
    }
    // Don't go beyond current month
    if (_calendarState.year > now.getFullYear() ||
        (_calendarState.year === now.getFullYear() && _calendarState.month > now.getMonth())) {
        _calendarState.year = now.getFullYear();
        _calendarState.month = now.getMonth();
    }
    renderCalendarGrid();
}

function renderCalendarGrid() {
    const { year, month, highlightDates, highlightColor } = _calendarState;
    const monthNames = ['Janvier','Février','Mars','Avril','Mai','Juin',
                        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const dayNames   = ['L','M','M','J','V','S','D'];

    document.getElementById('cal-month-label').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month+1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
    const totalDays = lastDay.getDate();
    const now = getNow();
    const todayStr = getLocalDateStr(now);

    let html = '<div class="cal-day-names">';
    dayNames.forEach(d => html += `<div class="cal-day-name">${d}</div>`);
    html += '</div><div class="cal-days">';

    // Empty cells before first day
    for (let i = 0; i < startDow; i++)
        html += '<div class="cal-day empty"></div>';

    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isHighlight = highlightDates.has(dateStr);
        const isToday     = dateStr === todayStr;
        const isFuture    = dateStr > todayStr;

        let cls = 'cal-day';
        if (isHighlight) cls += ' highlighted';
        if (isToday)     cls += ' today';
        if (isFuture)    cls += ' future';

        const bgStyle = isHighlight
            ? `background:${highlightColor}33;border-color:${highlightColor};color:${highlightColor};font-weight:700;`
            : '';
        html += `<div class="${cls}" style="${bgStyle}">${d}</div>`;
    }

    html += '</div>';
    document.getElementById('calendar-grid').innerHTML = html;
}

// ─────────────────────────────────────────────
//  V5.1 — WEEKLY HABITS
// ─────────────────────────────────────────────

// Add weekly habit toggle — weekly habits reset on Monday
function checkWeeklyHabitsReset(now) {
    const currentWeek = getISOWeekString(now);
    gameState.habits.forEach(h => {
        if (h.frequency !== 'weekly') return;
        if (!h.lastWeekReset) h.lastWeekReset = currentWeek;
        if (h.lastWeekReset !== currentWeek) {
            // New week — check if was completed
            if (h.completed) {
                h.streak = (h.streak||0) + 1;
            } else {
                h.streak = 0;
            }
            h.completed = false;
            h.lastWeekReset = currentWeek;
        }
    });
}

function openNewHabitModal(prefill) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box create">
            <div class="modal-title green">➕ Nouvelle Habitude</div>
            <div class="modal-field">
                <label>Nom</label>
                <input type="text" id="nh-name" placeholder="ex: Piano 30 min..."
                    value="${(prefill||'').replace(/"/g,'&quot;')}" />
            </div>
            <div class="modal-field">
                <label>Fréquence</label>
                <select id="nh-freq">
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="nh-cancel">Annuler</button>
                <button class="btn-green" id="nh-save">Créer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('nh-name').focus();
    document.getElementById('nh-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

    document.getElementById('nh-save').onclick = () => {
        const name = document.getElementById('nh-name').value.trim();
        const freq = document.getElementById('nh-freq').value;
        if (!name) { toast('Entre un nom.'); return; }

        let recoveredStreak = 0;
        if (gameState._deletedHabits) {
            const today = getLocalDateStr(getNow());
            const match = gameState._deletedHabits.find(d =>
                d.name.toLowerCase() === name.toLowerCase() && d.deletedDate === today
            );
            if (match) recoveredStreak = match.streak;
        }

        gameState.habits.push({
            id: nextId(), name,
            completed: false,
            xpReward: HABIT_XP,
            streak: recoveredStreak,
            lastCompleted: recoveredStreak > 0
                ? new Date(getNow().setDate(getNow().getDate()-1)).toISOString() : null,
            category: 'discipline',
            isRecommended: false,
            frequency: freq,
            lastWeekReset: freq === 'weekly' ? getISOWeekString(getNow()) : null,
            history: []
        });

        overlay.remove();
        saveGameState(); renderUI();
        const msg = recoveredStreak > 0
            ? `"${name}" ajoutée — 🔥 streak de ${recoveredStreak} récupéré!`
            : `"${name}" ajoutée!`;
        toast(msg, 'success');
    };
}


/* ═══════════════════════════════════════════
   LIFE RPG V5.3 — CAMPAIGN ENGINE
   ═══════════════════════════════════════════ */

// V5.4: Weapon boost applies ONLY to the skill the weapon is equipped on
function getWeaponBoostMult(skillKey) {
    const c = gameState.campaign;
    if (!c || !c.weapons) return 1;
    const w = c.weapons[skillKey];
    if (!w) return 1;
    const boost = RARITY_CONFIG[w.rarity]?.boost || 0;
    return w.broken ? 1 + boost / 200 : 1 + boost / 100;
}

// Display the boost % for a single equipped weapon
function getWeaponBoostDisplay(skillKey) {
    const c = gameState.campaign;
    if (!c || !c.weapons) return null;
    const w = c.weapons[skillKey];
    if (!w) return null;
    const boost = RARITY_CONFIG[w.rarity]?.boost || 0;
    return w.broken ? boost / 2 : boost;
}

// ── Campaign state init ──
function initCampaign() {
    if (!gameState.campaign) {
        gameState.campaign = {
            currentBossId: null, bossStartDate: null, bossXPAccumulated: 0,
            bossDefeated: [], difficulty: 'normal',
            weapons: { endurance:null, sagesse:null, discipline:null, serenite:null, maitrise:null },
            weaponHistory: [], brokenWeapons: [],
            repairDeadline: { endurance:null, sagesse:null, discipline:null, serenite:null, maitrise:null },
            restUntil: null
        };
        saveGameState();
    }
    const c = gameState.campaign;
    if (!c.weapons) c.weapons = { endurance:null, sagesse:null, discipline:null, serenite:null, maitrise:null };
    if (!c.weaponHistory)  c.weaponHistory = [];
    if (!c.brokenWeapons)  c.brokenWeapons = [];
    if (!c.repairDeadline) c.repairDeadline = { endurance:null, sagesse:null, discipline:null, serenite:null, maitrise:null };
    if (!c.bossDefeated)   c.bossDefeated = [];
    if (!c.difficulty)     c.difficulty = 'normal';
    if (c.bossXPAccumulated === undefined) c.bossXPAccumulated = 0;
}

// ── Boss XP accumulation ──
function accumulateBossXP(skillKey, xpAmount) {
    const c = gameState.campaign;
    if (!c || !c.currentBossId) return;
    const boss = BOSS_DATA.find(b => b.id === c.currentBossId);
    if (!boss) return;
    // V6.0b: L'Innommable is condition-based, no HP accumulation
    if (boss.conditionBased) {
        checkInnommableVictory();
        return;
    }
    let xp = xpAmount;
    if (boss.skill === skillKey || boss.skill === 'all') xp = Math.floor(xp * 1.2);
    c.bossXPAccumulated = (c.bossXPAccumulated || 0) + xp;
    if (c.bossXPAccumulated >= getBossTotalHP(boss)) defeatBoss(boss);
}

function getBossTotalHP(boss) {
    const diff = { facile:0.6, normal:1.0, difficile:1.6, legendaire:2.5 };
    return Math.floor(boss.xpBase * (diff[gameState.campaign?.difficulty||'normal'] || 1));
}

// V5.4: Boss timer aligned on Monday cycles
// Boss expires on the Monday of the SECOND week after start (8-14 days)
// Start Monday   → end in 14 days
// Start Tuesday  → end in 13 days
// ...
// Start Sunday   → end in 8 days
function getBossEndDate(startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysSinceMonday = (day === 0) ? 6 : (day - 1);
    const daysUntilEnd = 14 - daysSinceMonday;
    const end = new Date(start);
    end.setDate(end.getDate() + daysUntilEnd);
    return end;
}

// V5.4: Next Monday at 00:00 — used for rest period after victory
function getNextMonday(fromDate) {
    const d = new Date(fromDate);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // If today is Monday, next Monday is in 7 days
    const daysUntilMonday = (day === 1) ? 7 : (day === 0 ? 1 : (8 - day));
    d.setDate(d.getDate() + daysUntilMonday);
    return d;
}

// ── Boss unlock check ──
function isBossUnlocked(bossId) {
    const c = gameState.campaign;
    if (!c) return false;
    const idx = BOSS_DATA.findIndex(b => b.id === bossId);
    if (idx === 0) return true;
    return c.bossDefeated.includes(BOSS_DATA[idx-1].id);
}

function getCurrentAvailableBoss() {
    const c = gameState.campaign;
    if (!c) return null;
    if (c.currentBossId) return BOSS_DATA.find(b => b.id === c.currentBossId) || null;
    return BOSS_DATA.find(b => !c.bossDefeated.includes(b.id)) || null;
}

// ── Boss actions ──
function startBossFight(bossId) {
    const c = gameState.campaign;
    if (!c) return;
    if (c.restUntil && new Date(c.restUntil) > getNow()) { toast('Repos en cours — reviens lundi.','info'); return; }
    if (!isBossUnlocked(bossId)) { toast('Boss verrouillé.','error'); return; }
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (!boss) return;
    c.currentBossId = bossId;
    c.bossStartDate = getNow().toISOString();
    c.bossXPAccumulated = 0;
    saveGameState();
    renderUI();
    const isRefight = c.bossDefeated.includes(bossId);
    // V5.4: actual days based on Monday cycle
    const endDate = getBossEndDate(c.bossStartDate);
    const days = Math.round((endDate - new Date(c.bossStartDate)) / 86400000);
    toast(`⚔️ ${isRefight ? 'Re-affrontement' : 'Combat lancé'} — ${days} jours pour vaincre ${boss.name} !`, 'success');
}

// V5.4: Trigger a refight of an already defeated boss
function startBossRefight(bossId) {
    const c = gameState.campaign;
    if (!c) return;
    if (!c.bossDefeated.includes(bossId)) { toast('Boss pas encore vaincu.','error'); return; }
    if (c.restUntil && new Date(c.restUntil) > getNow()) { toast('Repos en cours — reviens lundi.','info'); return; }
    if (c.currentBossId) { toast('Termine ton combat actuel d\'abord.','error'); return; }
    const boss = BOSS_DATA.find(b => b.id === bossId);
    if (!boss) return;
    c.currentBossId = bossId;
    c.bossStartDate = getNow().toISOString();
    c.bossXPAccumulated = 0;
    c._isRefight = true;
    saveGameState();
    renderUI();
    const endDate = getBossEndDate(c.bossStartDate);
    const days = Math.round((endDate - new Date(c.bossStartDate)) / 86400000);
    toast(`⚔️ Re-affrontement lancé — ${days} jours, ${boss.name} !`, 'success');
}

function defeatBoss(boss) {
    const c = gameState.campaign;
    if (!c) return;
    const isRefight = c._isRefight === true;
    const start = new Date(c.bossStartDate);
    const daysTaken = (getNow() - start) / 86400000;
    const bonusDrop = daysTaken <= 3;
    if (!c.bossDefeated.includes(boss.id)) {
        c.bossDefeated.push(boss.id);
    }
    c.currentBossId = null; c.bossStartDate = null; c.bossXPAccumulated = 0;
    c._isRefight = false;
    // V5.4: rest until next Monday — next boss spawns weekly
    c.restUntil = getNextMonday(getNow()).toISOString();
    // V6.2 fix: reset display boss cache so next boss appears without reload
    _displayBossId = null;
    if (!isRefight) {
        checkCampaignTitleUnlocks();
    }
    saveGameState();
    rollAndShowLoot(boss, bonusDrop);
    renderUI();
}

function checkBossTimerExpired() {
    const c = gameState.campaign;
    if (!c || !c.currentBossId || !c.bossStartDate) return;
    const boss = BOSS_DATA.find(b => b.id === c.currentBossId);
    if (!boss) return;
    // V5.4: timer based on Monday-aligned end date
    const endDate = getBossEndDate(c.bossStartDate);
    if (getNow() >= endDate) abandonBoss();
}

function abandonBoss() {
    const c = gameState.campaign;
    if (!c || !c.currentBossId) return;
    const boss = BOSS_DATA.find(b => b.id === c.currentBossId);
    if (!boss) return;
    const sk = boss.skill === 'all' ? 'endurance' : boss.skill;
    if (c.weapons[sk]) {
        c.weapons[sk].broken = true;
        const dl = new Date(getNow()); dl.setDate(dl.getDate()+7);
        c.repairDeadline[sk] = dl.toISOString();
        toast(`💔 ${c.weapons[sk].name} brisée — 7 jours pour réparer.`, 'error');
    }
    c.currentBossId = null; c.bossStartDate = null; c.bossXPAccumulated = 0;
    saveGameState(); renderUI();
}

function confirmAbandonBoss() {
    const c = gameState.campaign;
    if (!c || !c.currentBossId) return;
    const boss = BOSS_DATA.find(b => b.id === c.currentBossId);
    if (!boss) return;
    showModal({ type:'danger', title:'⚠️ Abandonner ?', body:`Ton arme ${SKILL_CONFIG[boss.skill==='all'?'endurance':boss.skill]?.name} sera brisée pendant 7 jours.`, confirmLabel:'Abandonner', onConfirm: abandonBoss });
}

function checkCampaignTitleUnlocks() {
    if (!gameState.titles) gameState.titles = { unlocked:[], active:null };
    CAMPAIGN_TITLES.forEach(ct => {
        const actBosses = BOSS_DATA.filter(b => b.act === ct.actId);
        if (actBosses.every(b => gameState.campaign.bossDefeated.includes(b.id)) && !gameState.titles.unlocked.includes(ct.id)) {
            gameState.titles.unlocked.push(ct.id);
            if (!gameState.titles.active) gameState.titles.active = ct.id;
            showTitleUnlockCelebration(ct.name);
            saveGameState();
        }
    });
}

// ── Difficulty cycle ──
const DIFF_ORDER = ['facile','normal','difficile','legendaire'];
const DIFF_COLORS = { facile:'#4ecdc4', normal:'#3d8ef0', difficile:'#f97316', legendaire:'#f5c842' };
const DIFF_LABELS = { facile:'Facile', normal:'Normal', difficile:'Difficile', legendaire:'Légendaire' };

function cycleDifficulty() {
    // V6.1: cycleDifficulty is now a context-aware modal opener
    openDifficultyModal();
}

// V6.2: Open difficulty selection modal
// Rules: before combat = any difficulty. During combat = descend only.
function openDifficultyModal() {
    const c = gameState.campaign;
    if (!c) return;

    const avail = getCurrentAvailableBoss();
    const displayBoss = _displayBossId ? BOSS_DATA.find(b => b.id === _displayBossId) : avail;
    if (!displayBoss) return;

    const isDefeated = c.bossDefeated.includes(displayBoss.id);
    const isFighting = c.currentBossId === displayBoss.id;
    const inCombat = isFighting && !isDefeated;
    const currentDiff = c.difficulty || 'normal';
    const currentIdx = DIFF_ORDER.indexOf(currentDiff);
    const xpAcc = inCombat ? (c.bossXPAccumulated||0) : 0;

    // Before combat → all options. During combat → only lower.
    const options = inCombat
        ? DIFF_ORDER.filter((_, i) => i <= currentIdx)
        : DIFF_ORDER;

    const optionsHtml = options.map(diff => {
        const isCurrent = diff === currentDiff;
        const tmpDiff = c.difficulty;
        c.difficulty = diff;
        const hp = getBossTotalHP(displayBoss);
        c.difficulty = tmpDiff;
        const wouldKill = inCombat && xpAcc >= hp;
        const subtext = isCurrent
            ? '(actuel)'
            : wouldKill
                ? `⚡ Victoire instantanée ! ${xpAcc} XP ≥ ${hp} PV`
                : `${hp.toLocaleString()} PV`;
        return `<button class="diff-choice-btn ${isCurrent?'current':''}"
            style="--diff-color:${DIFF_COLORS[diff]}"
            ${isCurrent?'disabled':''}
            onclick="confirmDifficultyChange('${diff}')">
            <span class="diff-choice-label" style="color:${DIFF_COLORS[diff]}">${DIFF_LABELS[diff]}</span>
            <span class="diff-choice-sub">${subtext}</span>
        </button>`;
    }).join('');

    const titleText = inCombat ? '⚖️ Baisser la difficulté' : '⚖️ Choisir la difficulté';
    const subtitleText = inCombat
        ? 'Combat en cours — tu peux uniquement baisser la difficulté.'
        : 'Choisis avant de combattre. Pendant le combat, tu pourras uniquement descendre.';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'diff-modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:340px;border-color:rgba(245,200,66,0.2)">
            <div class="modal-title gold">${titleText}</div>
            <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:14px;line-height:1.4">${subtitleText}</div>
            <div class="diff-choice-grid">${optionsHtml}</div>
            <div class="modal-actions" style="margin-top:14px">
                <button class="btn-cancel" onclick="document.getElementById('diff-modal-overlay').remove()">Annuler</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

function confirmDifficultyChange(newDiff) {
    const c = gameState.campaign;
    if (!c) return;

    const avail = getCurrentAvailableBoss();
    const displayBoss = _displayBossId ? BOSS_DATA.find(b => b.id === _displayBossId) : avail;
    if (!displayBoss || displayBoss.id !== 'b01') return;

    document.getElementById('diff-modal-overlay')?.remove();

    const isFighting = c.currentBossId === displayBoss.id;
    const xpAcc = isFighting ? (c.bossXPAccumulated||0) : 0;

    // Apply new difficulty
    c.difficulty = newDiff;
    const newHP = getBossTotalHP(displayBoss);

    // If accumulated XP already exceeds new HP → instant victory
    if (isFighting && xpAcc >= newHP) {
        showModal({
            type: 'danger',
            title: '⚡ Victoire instantanée',
            body: `Tu as déjà ${xpAcc} XP accumulés, soit plus que les ${newHP} PV de cette difficulté.<br><br>Réduire ici va abattre le boss <strong>immédiatement</strong>. Le loot final sera basé sur la difficulté <strong>${DIFF_LABELS[newDiff]}</strong>. Confirmer ?`,
            confirmLabel: 'Abattre le boss',
            onConfirm: () => {
                defeatBoss(displayBoss);
            }
        });
    } else {
        saveGameState();
        renderCampagneContent();
        toast(`Difficulté → ${DIFF_LABELS[newDiff]}`, 'success');
    }
}

// ── Loot system ──
function rollAndShowLoot(boss, bonusDrop) {
    const c = gameState.campaign;
    const bossRIdx = Math.min(RARITY_ORDER.length-1, boss.act); // acte = rareté de base
    const shift = (DIFF_ORDER.indexOf(c.difficulty||'normal') - 1) + (bonusDrop ? 1 : 0);
    const weights = RARITY_ORDER.map((_,i) => {
        if (i < Math.max(0, bossRIdx-2)) return 0;
        const d = i - bossRIdx;
        if (d===0) return 50; if (d===1) return 25; if (d===-1) return 15;
        if (d===2) return 8;  if (d===-2) return 2;  return 0;
    });
    const shifted = (() => {
        const s = new Array(weights.length).fill(0);
        weights.forEach((w,i) => { s[Math.min(weights.length-1, Math.max(0, i+shift))] += w; });
        return s;
    })();
    const total = shifted.reduce((a,b)=>a+b,0);
    let r = Math.random()*total;
    let rarityKey = RARITY_ORDER[0];
    for (let i=0; i<RARITY_ORDER.length; i++) { r -= shifted[i]; if (r <= 0) { rarityKey = RARITY_ORDER[i]; break; } }
    // V6.2: Intelligent skill selection — 80% on missing weapons, 20% on equipped
    const sk = (() => {
        if (boss.skill !== 'all') return boss.skill;
        const allSkills = ['endurance','sagesse','discipline','serenite','maitrise'];
        const missingSkills = allSkills.filter(s => !c.weapons[s]);
        const equippedSkills = allSkills.filter(s => !!c.weapons[s]);

        // If all equipped → lowest level skill
        if (missingSkills.length === 0) {
            return allSkills.reduce((a,b) => gameState.skills[a].level<=gameState.skills[b].level?a:b);
        }
        // 80% on missing, 20% on equipped
        const rng = Math.random();
        if (rng < 0.8 || equippedSkills.length === 0) {
            return missingSkills[Math.floor(Math.random() * missingSkills.length)];
        } else {
            return equippedSkills[Math.floor(Math.random() * equippedSkills.length)];
        }
    })();
    const pool = WEAPON_POOLS[sk];
    const ti = Math.floor(Math.random()*pool.types.length);
    const newWeapon = { id:nextId()+'', name:pool.names[rarityKey][ti], type:pool.types[ti], rarity:rarityKey, skill:sk, boostPct:RARITY_CONFIG[rarityKey].boost, broken:false, obtainedDate:getLocalDateStr(getNow()) };
    const cur = c.weapons[sk];
    const isUpgrade = !cur || RARITY_ORDER.indexOf(rarityKey) > RARITY_ORDER.indexOf(cur.rarity);
    if (isUpgrade) c.weapons[sk] = newWeapon;
    if (!c.weaponHistory) c.weaponHistory = [];
    c.weaponHistory.push(newWeapon.name);
    saveGameState();
    showLootModal(boss, newWeapon, isUpgrade, bonusDrop);
}

function showLootModal(boss, weapon, isUpgrade, bonusDrop) {
    const rc = RARITY_CONFIG[weapon.rarity];
    const overlay = document.createElement('div');
    overlay.className = 'loot-modal-overlay';
    overlay.innerHTML = `<div class="loot-modal-box">
        <div class="loot-modal-title">LOOT OBTENU</div>
        <div class="loot-modal-boss">${boss.name} vaincu !</div>
        ${bonusDrop ? '<div style="color:var(--gold);font-size:0.72rem;margin-bottom:8px">⚡ Victoire rapide — bonus rareté !</div>' : ''}
        <div class="loot-item-display">
            <div style="font-size:3rem;margin-bottom:8px">⚔️</div>
            <div class="loot-item-name ${rc.css}">${weapon.name}</div>
            <div class="loot-item-rarity ${rc.css}">${rc.label} · ${SKILL_CONFIG[weapon.skill]?.name}</div>
            <div class="loot-item-boost">+${weapon.boostPct}% XP ${SKILL_CONFIG[weapon.skill]?.name}</div>
            <div style="font-size:0.72rem;margin-top:4px;color:${isUpgrade?'var(--green)':'var(--text-dim)'}">${isUpgrade?'✅ Nouvelle arme équipée !':'Déjà mieux — conservée en historique.'}</div>
        </div>
        <button class="btn-gold" style="width:100%;margin-top:8px" onclick="this.closest('.loot-modal-overlay').remove();renderUI()">Continuer</button>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay){overlay.remove();renderUI();} });
}

// ── Weapon repairs ──
function checkWeaponRepairs() {
    const c = gameState.campaign;
    if (!c || !c.weapons) return;
    const now = getNow();
    Object.keys(c.weapons).forEach(sk => {
        const w = c.weapons[sk];
        if (!w || !w.broken) return;
        const dl = c.repairDeadline[sk];
        if (dl && new Date(dl) < now) {
            c.brokenWeapons.push({...w, lostDate:getLocalDateStr(now)});
            c.weapons[sk] = null; c.repairDeadline[sk] = null;
            toast(`💀 ${w.name} détruite — délai dépassé.`, 'error');
            saveGameState();
        }
    });
}

// ── Subtab state ──
let _campSubtab = 'boss';
function switchCampSubtab(name) {
    _campSubtab = name;
    document.querySelectorAll('.camp-subtab').forEach(b => b.classList.toggle('active', b.dataset.subtab === name));
    renderCampagneContent();
}

// ── Render campagne ──
function renderCampagnePage() {
    // V5.4: Defensive - ensure campaign state exists before rendering
    if (!gameState.campaign) {
        initCampaign();
    }
    try {
        checkBossTimerExpired();
        checkWeaponRepairs();
        renderCampagneContent();
    } catch (e) {
        console.error('Erreur render campagne:', e);
        const el = document.getElementById('camp-content');
        if (el) el.innerHTML = '<p style="color:var(--text-dim);padding:20px 0;text-align:center">Erreur de chargement — recharge la page.</p>';
    }
}

function renderCampagneContent() {
    const el = document.getElementById('camp-content');
    if (!el) return;
    if (!gameState.campaign) initCampaign();
    if (_campSubtab === 'boss')   el.innerHTML = buildBossTab();
    if (_campSubtab === 'quetes') el.innerHTML = buildQuetesTabCamp();
    if (_campSubtab === 'equip')  el.innerHTML = buildEquipTab();
}

// ── Boss tab ──
let _displayBossId = null;
function selectDisplayBoss(bossId) { _displayBossId = bossId; renderCampagneContent(); }

function buildBossTab() {
    const c = gameState.campaign;
    if (!c) return '<p>Erreur campagne.</p>';
    const avail = getCurrentAvailableBoss();
    const displayBoss = _displayBossId ? BOSS_DATA.find(b=>b.id===_displayBossId) : avail;
    if (!displayBoss) return `<div class="empty-state" style="padding-top:60px"><span class="ei">🏆</span><p>Campagne terminée !</p></div>`;
    const boss = displayBoss;
    const isFighting = c.currentBossId === boss.id;
    const isDefeated = c.bossDefeated.includes(boss.id);
    const isResting  = c.restUntil && new Date(c.restUntil) > getNow();
    const diff = c.difficulty || 'normal';
    const totalHP = getBossTotalHP(boss);
    const curHP = Math.max(0, totalHP - (isFighting ? (c.bossXPAccumulated||0) : 0));
    const hpPct = isFighting ? Math.min(100, ((c.bossXPAccumulated||0)/totalHP)*100) : 0;
    const skillCfg = boss.skill==='all' ? {icon:'⭐',name:'Toutes compétences',color:'#f5c842'} : SKILL_CONFIG[boss.skill];
    const bgs = {1:'radial-gradient(ellipse at 50% 30%,#2a1a08 0%,#0d0806 100%)',2:'radial-gradient(ellipse at 50% 30%,#091a09 0%,#040904 100%)',3:'radial-gradient(ellipse at 50% 30%,#1a0808 0%,#090404 100%)',4:'radial-gradient(ellipse at 50% 30%,#08080f 0%,#040407 100%)',5:'radial-gradient(ellipse at 50% 30%,#050510 0%,#030308 100%)'};
    const imgHtml = boss.img ? `<img class="boss-hero-img" src="${boss.img}" alt="${boss.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : '';
    const phStyle = boss.img ? 'display:none' : '';
    // Timer
    let timerHtml = '';
    if (isFighting && c.bossStartDate) {
        // V5.4: end date based on Monday cycle, not boss.timerDays
        const endDate = getBossEndDate(c.bossStartDate);
        const startDate = new Date(c.bossStartDate);
        startDate.setHours(0,0,0,0);
        const totalDays = Math.round((endDate - startDate) / 86400000);
        const remMs = endDate - getNow();
        const rem = Math.max(0, remMs / 86400000);
        const days = Math.floor(rem);
        const hours = Math.floor((rem - days) * 24);
        timerHtml = `<div class="boss-timer-row"><span class="boss-timer-label">Temps restant :</span><span class="boss-timer-val">${days}j ${hours}h</span><span class="boss-timer-max">/ ${totalDays} jours</span></div>`;
    }
    // Status
    let statusHtml = '';
    if (isResting) {
        const restEnd = new Date(c.restUntil);
        const day = restEnd.getDay();
        const dayNames = ['dim','lun','mar','mer','jeu','ven','sam'];
        const restDay = dayNames[day];
        const restDate = `${restEnd.getDate()}/${restEnd.getMonth()+1}`;
        const hoursLeft = Math.ceil((restEnd-getNow())/3600000);
        const dayslabel = hoursLeft > 24 ? `${Math.ceil(hoursLeft/24)}j` : `${hoursLeft}h`;
        statusHtml = `<div class="boss-status-banner rest">😴 Repos — prochain boss <strong>lundi ${restDate}</strong> (dans ${dayslabel})</div>`;
    }
    // Actions
    let actHtml = '';
    if (!isFighting && !isDefeated && !isResting && isBossUnlocked(boss.id)) {
        actHtml = `<div class="boss-btns"><button class="btn-boss-fight" onclick="startBossFight('${boss.id}')">⚔️ Affronter</button></div>`;
    } else if (isFighting) {
        actHtml = `<div class="boss-btns"><button class="btn-boss-fight fighting">⚔️ En combat — continue !</button><button class="btn-boss-abandon" onclick="confirmAbandonBoss()">🏳️</button></div>`;
    } else if (isDefeated) {
        if (isResting) {
            actHtml = `<div class="boss-status-banner victory">✅ Boss vaincu — repos en cours</div>`;
        } else if (c.currentBossId) {
            actHtml = `<div class="boss-status-banner victory">✅ Boss vaincu</div><div style="font-size:0.7rem;color:var(--text-dim);text-align:center;font-style:italic">Termine ton combat actuel pour pouvoir re-affronter</div>`;
        } else {
            actHtml = `<div class="boss-status-banner victory">✅ Boss vaincu</div>
                <div class="boss-btns"><button class="btn-boss-fight" onclick="startBossRefight('${boss.id}')">🔁 Re-affronter pour meilleur loot</button></div>`;
        }
    } else if (!isBossUnlocked(boss.id)) {
        actHtml = `<div class="boss-status-banner rest">🔒 Vaincs d'abord le boss précédent</div>`;
    }
    // Loot preview
    const bri = Math.min(RARITY_ORDER.length-1, boss.act);
    const shift = (DIFF_ORDER.indexOf(c.difficulty||'normal') - 1);
    const rawWeights = RARITY_ORDER.map((_,i) => {
        if (i < Math.max(0, bri-2)) return 0;
        const d = i - bri;
        if (d===0) return 50; if (d===1) return 25; if (d===-1) return 15;
        if (d===2) return 8;  if (d===-2) return 2;  return 0;
    });
    const shiftedW = (() => {
        const s = new Array(rawWeights.length).fill(0);
        rawWeights.forEach((w,i) => { s[Math.min(rawWeights.length-1, Math.max(0, i+shift))] += w; });
        return s;
    })();
    const totalW = shiftedW.reduce((a,b)=>a+b,0);
    const lootPills = RARITY_ORDER.map((r, rIdx) => {
        const dropPct = totalW > 0 ? Math.round((shiftedW[rIdx]||0)/totalW*100) : 0;
        if (dropPct === 0) return '';
        const rc = RARITY_CONFIG[r];
        return `<span class="loot-pill" style="color:${rc.color};border-color:${rc.color}44;background:${rc.color}11">
            <span class="loot-pill-drop">${dropPct}%</span>
            <span class="loot-pill-name">${rc.label}</span>
            <span class="loot-pill-boost">+${rc.boost}% XP</span>
        </span>`;
    }).filter(Boolean).join('');
    // Boss chips
    const actBosses = BOSS_DATA.filter(b=>b.act===boss.act);
    const chipsHtml = actBosses.map(b => {
        const done=c.bossDefeated.includes(b.id), active=b.id===boss.id, locked=!isBossUnlocked(b.id)&&!done;
        const cls='boss-chip'+(active?' active':done?' done':locked?' locked':'');
        const st=done?'✅':(active&&isFighting)?'⚔️':locked?'🔒':'●';
        return `<div class="${cls}" onclick="selectDisplayBoss('${b.id}')">${b.emoji} ${b.name} <span style="font-size:0.6rem">${st}</span></div>`;
    }).join('');
    const defeatedCount = actBosses.filter(b=>c.bossDefeated.includes(b.id)).length;
    return `
        <div class="boss-hero-zone">
            ${imgHtml}
            <div class="boss-hero-placeholder" style="${phStyle};${bgs[boss.act]}">${boss.emoji}</div>
            <div class="boss-fade-top"></div><div class="boss-fade-left"></div><div class="boss-fade-right"></div><div class="boss-fade-bottom"></div>
            <div class="boss-act-badge">Acte ${boss.act}</div>
            <div class="boss-diff-badge" onclick="cycleDifficulty()" style="color:${DIFF_COLORS[diff]};border-color:${DIFF_COLORS[diff]}44">${DIFF_LABELS[diff]}</div>
            <div class="boss-name-overlay">
                <div class="boss-name">${boss.name}</div>
                <span class="boss-skill-tag" style="color:${skillCfg.color};border-color:${skillCfg.color}44">${skillCfg.icon} ${skillCfg.name}</span>
            </div>
        </div>
        <div style="padding-top:12px">
            ${statusHtml}
            <div class="boss-info-block">
                ${!isFighting&&!isDefeated?`<p style="font-size:0.78rem;color:var(--text-dim);font-style:italic;margin-bottom:10px">"${boss.lore}"</p>`:''}
                ${boss.conditionBased ? buildInnommableConditions(boss, isFighting) : `
                <div class="boss-hp-row"><span class="boss-hp-label">Points de Vie</span><span class="boss-hp-val">${curHP.toLocaleString()} / ${totalHP.toLocaleString()} PV</span></div>
                <div class="boss-hp-bar-bg"><div class="boss-hp-bar-fill" style="width:${hpPct}%"></div></div>`}
                ${timerHtml}
            </div>
            ${actHtml}
            ${boss.conditionBased ? '' : `<div class="loot-preview-block">
                <div class="loot-preview-title">Loot potentiel · ${SKILL_CONFIG[boss.skill==='all'?'endurance':boss.skill]?.name||'Toutes'}</div>
                <div class="loot-pills">${lootPills}</div>
            </div>`}
            <div class="boss-list-header"><span><strong>Acte ${boss.act}</strong> — ${boss.actName}</span><span>${defeatedCount} / ${actBosses.length} vaincus</span></div>
            <div class="boss-chips-wrap"><div class="boss-chips-scroll">${chipsHtml}</div></div>
        </div>`;
}

// V6.0b: Build conditions display for L'Innommable
function buildInnommableConditions(boss, isFighting) {
    const progress = getInnommableProgress();
    const completedCount = progress.filter(p => p.complete).length;
    const totalCount = progress.length;

    const headerHtml = `<div class="innomm-header">
        <div class="innomm-title">⚔️ Conditions de victoire</div>
        <div class="innomm-count">${completedCount} / ${totalCount}</div>
    </div>`;

    if (!isFighting) {
        // Show conditions as preview before fighting
        const conditionsList = progress.map(p => `
            <div class="innomm-condition preview">
                <span class="innomm-cond-icon">○</span>
                <div class="innomm-cond-body">
                    <div class="innomm-cond-label">${p.label}</div>
                    <div class="innomm-cond-desc">${p.description}</div>
                </div>
                <div class="innomm-cond-target">${p.target}</div>
            </div>`).join('');
        return headerHtml + conditionsList +
            `<div class="innomm-warning">⚠️ Tu dois remplir TOUTES ces conditions pour vaincre L'Innommable. Récompense : titre <strong>"L'Immuable"</strong></div>`;
    }

    // Active fight: show progress
    const conditionsList = progress.map(p => {
        const pct = Math.min(100, (p.current / p.target) * 100);
        const icon = p.complete ? '✅' : '🔄';
        return `
            <div class="innomm-condition ${p.complete ? 'done' : ''}">
                <span class="innomm-cond-icon">${icon}</span>
                <div class="innomm-cond-body">
                    <div class="innomm-cond-label">${p.label}</div>
                    <div class="innomm-cond-progress">
                        <div class="innomm-cond-bar"><div class="innomm-cond-fill" style="width:${pct}%"></div></div>
                        <div class="innomm-cond-num">${p.current} / ${p.target}</div>
                    </div>
                </div>
            </div>`;
    }).join('');
    return headerHtml + conditionsList;
}

// ── Quêtes tab (camp) ──
function buildQuetesTabCamp() {
    const now = getNow();
    generateDailyQuests(now);
    if (!gameState.quests) return '<div class="camp-quetes-wrap"><p style="color:var(--text-dim);padding:20px 0">Chargement...</p></div>';
    const completedIds = gameState.quests.completedIds || [];
    const { mon } = getWeekBoundaries(now);
    const daysLeft = Math.ceil((new Date(mon.getTime()+7*86400000)-now)/86400000);
    const c = gameState.campaign;
    const activeBoss = c?.currentBossId ? BOSS_DATA.find(b=>b.id===c.currentBossId) : null;
    const renderCard = (quest, isWeekly=false) => {
        if (!quest) return '';
        const done=completedIds.includes(quest.id);
        const prog=getQuestProgress(quest);
        const sk=getQuestSkill(quest);
        const scfg=SKILL_CONFIG[sk];
        const diffClass=isWeekly?'weekly':(quest.xp>=120?'hard':quest.xp>=80?'medium':'easy');
        const progHtml=(!done&&!prog.blocked)?`<div class="quest-prog-row"><div class="quest-prog-bg"><div class="quest-prog-fill" style="width:${Math.round(prog.pct)}%;background:${scfg.color}"></div></div><span class="quest-prog-label">${prog.text}</span></div>`:'';
        const bossTag=activeBoss&&quest.skill===activeBoss.skill?`<span class="camp-q-boss-badge">⚔️ Boss</span>`:'';
        return `<div class="quest-card ${done?'quest-done':''} ${prog.blocked?'quest-blocked':''}">
            <div class="quest-card-left"><div class="quest-skill-icon" style="background:${scfg.color}22;border-color:${scfg.color}44">${scfg.icon}</div></div>
            <div class="quest-card-body">
                <div class="quest-title">${done?'✅ ':''}${quest.title}${prog.blocked?' 🔒':''} ${bossTag}</div>
                <div class="quest-desc">${prog.blocked?prog.text:quest.desc}</div>
                ${progHtml}
                <div class="quest-footer">
                    <span class="quest-xp-pill quest-${diffClass}" style="border-color:${scfg.color}55;color:${scfg.color}">+${quest.xp} XP → ${scfg.name}</span>
                    ${isWeekly?`<span class="quest-days-left">${daysLeft}j restants</span>`:''}
                </div>
            </div>
        </div>`;
    };
    return `<div class="camp-quetes-wrap">
        <div class="camp-q-section-label">Quotidiennes ${activeBoss?`<span class="camp-q-boss-badge">60% orientées ${activeBoss.name}</span>`:''}</div>
        <div class="quests-list">${(gameState.quests.daily||[]).map(q=>renderCard(q)).join('')}</div>
        <div class="camp-q-section-label" style="margin-top:8px">Hebdomadaires <span style="margin-left:auto;font-size:0.65rem;color:var(--text-dim)">${(gameState.quests.weeklyArr||[gameState.quests.weekly]).filter(Boolean).length} cette semaine · reset lundi</span></div>
        <div class="quests-list">${(gameState.quests.weeklyArr||[gameState.quests.weekly]).filter(Boolean).map(q=>renderCard(q,true)).join('')}</div>
    </div>`;
}

// ── Équipement tab ──
function buildEquipTab() {
    const c = gameState.campaign;
    if (!c) return '';
    const skills = ['endurance','sagesse','serenite','maitrise','discipline'];
    return `<div class="equip-wrap"><div class="equip-info-banner">⚔️ Chaque arme booste UNIQUEMENT la compétence sur laquelle elle est équipée</div>${skills.map(sk => {
        const cfg=SKILL_CONFIG[sk], skill=gameState.skills[sk], w=c.weapons[sk];
        const broken=w?.broken;
        let weaponHtml='';
        if (!w) {
            weaponHtml=`<div class="weapon-card empty"><div class="weapon-icon-box" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.2)">🗡️</div><div class="weapon-info"><div class="weapon-name" style="color:rgba(255,255,255,0.2)">Aucune arme</div><div class="weapon-meta">Vaincs un boss pour lootter</div></div><div class="weapon-boost zero">—</div></div>`;
        } else {
            const rc=RARITY_CONFIG[w.rarity], boost=getWeaponBoostDisplay(sk);
            let repairHtml='';
            if (broken) {
                const dl=c.repairDeadline[sk];
                if (dl) {
                    const repStart=new Date(dl); repStart.setDate(repStart.getDate()-7);
                    let cur=0, needed=150;
                    if (sk==='endurance') { needed=150; gameState.sessions.filter(s=>s.category===sk).forEach(s=>(s.logs||[]).forEach(l=>{if(new Date(l.date)>=repStart)cur+=l.minutes;})); }
                    else { needed=4; gameState.sessions.filter(s=>s.category===sk).forEach(s=>cur+=(s.logs||[]).filter(l=>new Date(l.date)>=repStart).length); }
                    const pct=Math.min(100,(cur/needed)*100);
                    if (cur>=needed&&w.broken){w.broken=false;c.repairDeadline[sk]=null;toast(`🔧 ${w.name} réparée !`,'success');saveGameState();}
                    repairHtml=`<div class="repair-progress"><div class="repair-bar-bg"><div class="repair-bar-fill" style="width:${pct}%"></div></div><div class="repair-label">${cur}/${needed}</div></div>`;
                }
            }
            weaponHtml=`<div class="weapon-card ${broken?'broken':'equipped'}"><div class="weapon-icon-box" style="background:${rc.color}18;border-color:${rc.color}66;color:${rc.color}">⚔️</div><div class="weapon-info"><div class="weapon-name ${rc.css}">${w.name}</div><div class="weapon-meta">${rc.label} · ${w.type}</div>${broken?'<div class="weapon-broken-tag">🔴 Cassée — réparation en cours</div>':''}${repairHtml}</div><div class="weapon-boost ${broken?'half':''}">+${boost.toFixed(0)}%</div></div>`;
        }
        return `<div class="equip-skill-section"><div class="equip-skill-header"><span style="font-size:1.1rem">${cfg.icon}</span><span class="equip-skill-name" style="color:${cfg.color}">${cfg.name}</span><span class="equip-skill-lv">Lv ${skill.level}</span></div>${weaponHtml}</div>`;
    }).join('')}</div>`;
}

/* ═══════════════════════════════════════════
   V6.0a — MOOD TRACKING
   ═══════════════════════════════════════════ */

const MOOD_OPTIONS = [
    { value:1, emoji:'',  label:'Vraiment pas', color:'#dc2626' },  // rouge profond
    { value:2, emoji:'',  label:'Pas top',      color:'#f97316' },  // orange
    { value:3, emoji:'',  label:'Moyen',        color:'#facc15' },  // jaune
    { value:4, emoji:'',  label:'Bien',         color:'#84cc16' },  // vert clair
    { value:5, emoji:'',  label:'Excellent',    color:'#16a34a' }   // vert vif
];

function getMoodForToday() {
    if (!gameState.moods) gameState.moods = [];
    const today = getLocalDateStr(getNow());
    return gameState.moods.find(m => m.date === today) || null;
}

function setMood(value) {
    if (!gameState.moods) gameState.moods = [];
    const today = getLocalDateStr(getNow());
    const existing = gameState.moods.find(m => m.date === today);
    if (existing) {
        existing.value = value;
        existing.timestamp = new Date().toISOString();
    } else {
        gameState.moods.push({ date: today, value, timestamp: new Date().toISOString() });
        // First mood of day: small bonus to Sérénité
        gainSkillXP('serenite', 5, 'Note humeur');
    }
    saveGameState();
    updateMoodFab();
    const mood = MOOD_OPTIONS.find(m => m.value === value);
    toast(`Humeur enregistrée — ${mood.label}`, 'success');
}

function openMoodPanel() {
    const today = getMoodForToday();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'mood-overlay';
    const buttonsHtml = MOOD_OPTIONS.map(m => `
        <button class="mood-choice ${today?.value === m.value ? 'selected' : ''}"
            style="--mood-color:${m.color}"
            onclick="setMood(${m.value});document.getElementById('mood-overlay').remove();">
            <span class="mood-circle" style="background:${m.color}"></span>
            <span class="mood-label">${m.label}</span>
        </button>`).join('');
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:340px;text-align:center;">
            <div class="modal-title gold">💭 Comment tu te sens ?</div>
            ${today ? `<div style="font-size:0.72rem;color:var(--text-dim);margin-bottom:10px;font-style:italic;">Tu as déjà noté aujourd'hui — tu peux modifier.</div>` : `<div style="font-size:0.72rem;color:var(--text-dim);margin-bottom:10px;">+5 XP Sérénité pour ta première note du jour</div>`}
            <div class="mood-choice-grid">${buttonsHtml}</div>
            <div class="modal-actions" style="margin-top:14px;">
                <button class="btn-cancel" onclick="document.getElementById('mood-overlay').remove()">Fermer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });
}

function updateMoodFab() {
    const fab = document.getElementById('mood-fab');
    const icon = document.getElementById('mood-fab-icon');
    const pulse = document.getElementById('mood-fab-pulse');
    if (!fab || !icon || !pulse) return;
    const today = getMoodForToday();
    if (today) {
        const mood = MOOD_OPTIONS.find(m => m.value === today.value);
        // V6.0d: colored circle instead of emoji
        icon.innerHTML = mood ? `<span class="mood-fab-circle" style="background:${mood.color}"></span>` : '💭';
        fab.classList.add('mood-set');
        pulse.style.display = 'none';
    } else {
        icon.textContent = '➕';
        fab.classList.remove('mood-set');
        pulse.style.display = 'block';
    }
}

function getMoodHistory(days = 30) {
    if (!gameState.moods) return [];
    const now = getNow();
    const history = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        const mood = gameState.moods.find(m => m.date === dateStr);
        history.push({ date: dateStr, value: mood?.value || null });
    }
    return history;
}

function getMoodAverageOld(days = 30) {
    // Replaced by V6.0b version (uses ISO string comparison correctly)
    return null;
}

// ─────────────────────────────────────────────
//  V6.0a — MOOD UI in Profil
// ─────────────────────────────────────────────
function buildMoodSection() {
    const periodKey = _graphPeriod.mood || '30d';
    const period = GRAPH_PERIODS.find(p => p.key === periodKey) || GRAPH_PERIODS[1];
    const history = getMoodHistory(period.days);
    const avg = getMoodAverage(period.days);

    if (!avg) {
        return `<div class="mood-empty-state">
            <span class="mood-empty-icon">💭</span>
            <p>Pas encore de note d'humeur. Tape sur le bouton flottant en bas à droite pour commencer !</p>
        </div>`;
    }

    // Period selector
    const periodBtns = GRAPH_PERIODS.map(p => {
        const active = p.key === periodKey;
        return `<button class="graph-period-btn ${active?'active':''}" onclick="setGraphPeriod('mood','${p.key}')">${p.label}</button>`;
    }).join('');

    // Mood line graph
    const max = 5, min = 1;
    const W = 300, H = 80, padding = 8;
    const innerW = W - 2*padding;
    const innerH = H - 2*padding;

    // Aggregate moods by bucket type
    let buckets = [];
    if (period.bucket === 'day') {
        buckets = history.map(d => ({ value: d.value, date: d.date }));
    } else if (period.bucket === 'week') {
        const now = getNow();
        for (let i = period.buckets - 1; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);
            const startStr = getLocalDateStr(weekStart);
            const endStr = getLocalDateStr(weekEnd);
            const moods = (gameState.moods||[]).filter(m => m.date >= startStr && m.date <= endStr);
            const avg = moods.length ? moods.reduce((s,m) => s + m.value, 0) / moods.length : null;
            buckets.push({ value: avg, date: startStr });
        }
    } else if (period.bucket === 'month') {
        const now = getNow();
        for (let i = period.buckets - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const startStr = getLocalDateStr(monthStart);
            const endStr = getLocalDateStr(monthEnd);
            const moods = (gameState.moods||[]).filter(m => m.date >= startStr && m.date <= endStr);
            const avg = moods.length ? moods.reduce((s,m) => s + m.value, 0) / moods.length : null;
            buckets.push({ value: avg, date: startStr });
        }
    }

    const pts = buckets.map((b, i) => {
        const x = buckets.length === 1 ? W/2 : padding + (i / (buckets.length - 1)) * innerW;
        if (b.value === null) return null;
        const y = H - padding - ((b.value - min) / (max - min)) * innerH;
        return { x, y, value: b.value, date: b.date };
    });

    let pathD = '';
    let segmentStart = true;
    pts.forEach(p => {
        if (!p) { segmentStart = true; return; }
        pathD += (segmentStart ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`);
        segmentStart = false;
    });

    const dotsHtml = pts.filter(p => p).map(p => {
        const moodVal = Math.round(p.value);
        const mood = MOOD_OPTIONS.find(m => m.value === moodVal) || MOOD_OPTIONS[2];
        return `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="${mood.color}"/>`;
    }).join('');

    // Calendar — only show for day-bucket periods (7d, 30d)
    let calHtml = '';
    if (period.bucket === 'day') {
        const cols = period.days <= 7 ? 7 : 15;
        const calCells = history.map(d => {
            if (d.value === null) {
                return `<div class="mood-cal-cell empty" title="${d.date}"></div>`;
            }
            const mood = MOOD_OPTIONS.find(m => m.value === d.value);
            return `<div class="mood-cal-cell" style="background:${mood.color};opacity:${0.5 + (d.value/5)*0.5}" title="${d.date}: ${mood.label}"></div>`;
        }).join('');
        calHtml = `<div class="mood-cal-wrap">
            <div class="mood-graph-label">Calendrier ${period.label}</div>
            <div class="mood-cal-grid" style="grid-template-columns:repeat(${cols},1fr)">${calCells}</div>
        </div>`;
    }

    const avgMood = MOOD_OPTIONS.reduce((closest, m) =>
        Math.abs(m.value - avg.avg) < Math.abs(closest.value - avg.avg) ? m : closest
    , MOOD_OPTIONS[2]);

    return `<div class="mood-section-wrap">
        <div class="graph-period-row">${periodBtns}</div>
        <div class="mood-stats-row">
            <div class="mood-stat">
                <div class="mood-stat-icon"><span class="mood-stat-circle" style="background:${avgMood.color}"></span></div>
                <div class="mood-stat-body">
                    <div class="mood-stat-val">${avg.avg.toFixed(1)} / 5</div>
                    <div class="mood-stat-lbl">Moyenne ${period.label}</div>
                </div>
            </div>
            <div class="mood-stat">
                <div class="mood-stat-icon">📊</div>
                <div class="mood-stat-body">
                    <div class="mood-stat-val">${avg.count}</div>
                    <div class="mood-stat-lbl">Notes sur ${period.label}</div>
                </div>
            </div>
        </div>
        <div class="mood-graph-wrap">
            <div class="mood-graph-label">Évolution ${period.label}</div>
            <svg viewBox="0 0 ${W} ${H}" class="mood-graph-svg" preserveAspectRatio="none">
                <line x1="${padding}" y1="${padding}" x2="${W-padding}" y2="${padding}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
                <line x1="${padding}" y1="${H/2}" x2="${W-padding}" y2="${H/2}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
                <line x1="${padding}" y1="${H-padding}" x2="${W-padding}" y2="${H-padding}" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
                <path d="${pathD}" stroke="var(--gold)" stroke-width="1.5" fill="none" opacity="0.7"/>
                ${dotsHtml}
            </svg>
        </div>
        ${calHtml}
    </div>`;
}

// Update getMoodAverage to take days param consistently
function getMoodAverage(days = 30) {
    if (!gameState.moods) return null;
    const now = getNow();
    const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateStr(cutoff);
    const recent = gameState.moods.filter(m => m.date >= cutoffStr);
    if (!recent.length) return null;
    const sum = recent.reduce((a,b) => a + b.value, 0);
    return { avg: sum / recent.length, count: recent.length };
}

/* ═══════════════════════════════════════════
   V6.0a — ONBOARDING (5 écrans)
   ═══════════════════════════════════════════ */

const ONBOARD_KEY = 'lifeRPG_onboarded_v1';

function checkOnboarding() {
    const done = localStorage.getItem(ONBOARD_KEY);
    if (!done) {
        setTimeout(() => startOnboarding(), 500);
    }
}

const ONBOARD_SCREENS = [
    {
        title: 'Bienvenue dans Ascend',
        subtitle: 'Transforme ta vie en aventure',
        icon: '⚔️',
        body: `<p>Chaque action réelle de ta vie te fait gagner de l'XP et progresser dans <strong>5 compétences</strong> :</p>
            <div class="onboard-skill-grid">
                <div class="onboard-skill"><span style="color:#ff6b6b">💪</span> Endurance</div>
                <div class="onboard-skill"><span style="color:#4ecdc4">📚</span> Sagesse</div>
                <div class="onboard-skill"><span style="color:#9f7aea">🧘</span> Sérénité</div>
                <div class="onboard-skill"><span style="color:#3d8ef0">⚡</span> Maîtrise</div>
                <div class="onboard-skill"><span style="color:#f5c842">🏠</span> Discipline</div>
            </div>
            <p style="font-size:0.7rem;color:var(--text-dim);font-style:italic;margin-top:12px">Basé sur des recherches scientifiques (OMS, peer-reviewed studies)</p>`
    },
    {
        title: '🏠 Onglet Habitudes',
        subtitle: 'Le cœur de ta progression quotidienne',
        icon: '🏠',
        body: `<p>Ajoute des habitudes du quotidien et coche-les chaque jour. Tu gagnes <strong>15 XP</strong> par habitude + bonus de <strong>streak (+5%/jour)</strong>.</p>
            <div class="onboard-tip">
                <strong>💡 Conseil scientifique :</strong> 3-4 habitudes maintenues sont meilleures que 10 oubliées. Commence petit.
            </div>
            <p style="margin-top:12px">Une <strong>journée parfaite</strong> = toutes les habitudes cochées avant minuit.</p>`
    },
    {
        title: '⚡ Onglet Sessions',
        subtitle: 'Tes efforts mesurables',
        icon: '⚡',
        body: `<p>Une <strong>Session</strong> est un effort en minutes (sport, lecture, méditation, deep work...).</p>
            <p>Log ton temps après chaque effort, l'XP gagnée dépend de la durée.</p>
            <div class="onboard-tip">
                <strong>📊 Repères scientifiques :</strong><br>
                • Sport : 150 min/semaine (OMS)<br>
                • Méditation : 10 min/jour<br>
                • Lecture : 15 min/jour
            </div>`
    },
    {
        title: '⚔️ Onglet Campagne',
        subtitle: 'Ton aventure RPG',
        icon: '⚔️',
        body: `<p>Affronte <strong>17 boss</strong> sur 5 actes — chaque XP gagnée endommage le boss actif.</p>
            <p>Bats-le avant la deadline (jusqu'à 14 jours, alignée lundi) pour <strong>looter une arme</strong> qui boost ton XP.</p>
            <div class="onboard-tip">
                <strong>🎁 Drop rare :</strong> 10 raretés Fer → Céleste, jusqu'à <strong>+85% XP</strong> sur la compétence équipée.
            </div>`
    },
    {
        title: 'Tu es prêt, Hero',
        subtitle: 'Quelques derniers conseils',
        icon: '🎯',
        body: `<div class="onboard-tip">
                <strong>💾 Sauvegarde régulière :</strong> Va dans Paramètres → Exporter mes données. Sans ça, tu peux perdre ta progression si ton navigateur est nettoyé.
            </div>
            <div class="onboard-tip" style="margin-top:10px">
                <strong>💭 Note ton humeur :</strong> Le bouton flottant en bas à droite — 1 tap par jour pour suivre ton bien-être.
            </div>
            <p style="margin-top:14px;text-align:center;font-family:'Cinzel',serif;color:var(--gold)">L'aventure commence maintenant.</p>`
    }
];

let _onboardIdx = 0;

function startOnboarding() {
    _onboardIdx = 0;
    renderOnboardScreen();
}

function renderOnboardScreen() {
    const screen = ONBOARD_SCREENS[_onboardIdx];
    const isLast = _onboardIdx === ONBOARD_SCREENS.length - 1;
    const isFirst = _onboardIdx === 0;

    // Remove existing
    const existing = document.getElementById('onboard-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay onboard-overlay';
    overlay.id = 'onboard-overlay';

    const dotsHtml = ONBOARD_SCREENS.map((_, i) =>
        `<div class="onboard-dot ${i === _onboardIdx ? 'active' : ''} ${i < _onboardIdx ? 'done' : ''}"></div>`
    ).join('');

    overlay.innerHTML = `
        <div class="modal-box onboard-box">
            <div class="onboard-icon-big">${screen.icon}</div>
            <div class="onboard-title">${screen.title}</div>
            <div class="onboard-subtitle">${screen.subtitle}</div>
            <div class="onboard-body">${screen.body}</div>
            <div class="onboard-dots">${dotsHtml}</div>
            <div class="onboard-actions">
                ${isFirst ? '' : '<button class="btn-cancel onboard-prev" onclick="onboardPrev()">‹ Précédent</button>'}
                ${isLast
                    ? '<button class="btn-gold onboard-next" onclick="finishOnboarding()">Commencer ⚔️</button>'
                    : '<button class="btn-gold onboard-next" onclick="onboardNext()">Suivant ›</button>'}
            </div>
            <button class="onboard-skip" onclick="finishOnboarding()">Passer</button>
        </div>`;
    document.body.appendChild(overlay);
}

function onboardNext() {
    if (_onboardIdx < ONBOARD_SCREENS.length - 1) {
        _onboardIdx++;
        renderOnboardScreen();
    }
}

function onboardPrev() {
    if (_onboardIdx > 0) {
        _onboardIdx--;
        renderOnboardScreen();
    }
}

function finishOnboarding() {
    localStorage.setItem(ONBOARD_KEY, '1');
    const overlay = document.getElementById('onboard-overlay');
    if (overlay) overlay.remove();
    toast('🎯 Bonne aventure !', 'success');
}

// Replay onboarding from settings (optional future entry)
function replayOnboarding() {
    localStorage.removeItem(ONBOARD_KEY);
    startOnboarding();
}

/* ═══════════════════════════════════════════
   INIT — moved to end of file (V6.0b)
   to avoid Temporal Dead Zone with later const/let declarations
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   V6.0b — L'INNOMMABLE — Système de conditions
   ═══════════════════════════════════════════ */

const INNOMMABLE_CONDITIONS = [
    {
        id: 'perfectDays',
        label: 'Perfect Days',
        target: 40,
        description: '40 journées parfaites sur les 66 jours de combat',
        check: (days) => {
            // Count perfect days during the boss fight period
            const c = gameState.campaign;
            if (!c.bossStartDate) return 0;
            const start = new Date(c.bossStartDate);
            let count = 0;
            const xp = gameState.xpHistory || [];
            const datesWithDiscipline = new Set();
            xp.forEach(e => {
                if (e.skill === 'discipline' && e.label && e.label.includes('Perfect') && new Date(e.date) >= start) {
                    datesWithDiscipline.add(e.date);
                }
            });
            // Fallback: count perfect days from stats if available
            return datesWithDiscipline.size || (gameState.stats?.perfectDays || 0);
        }
    },
    {
        id: 'globalLevel',
        label: 'Niveau Global 100',
        target: 100,
        description: 'Atteindre le niveau global 100',
        check: () => getGlobalLevel()
    },
    {
        id: 'allSkills75',
        label: 'Toutes compétences Lv 75+',
        target: 5,
        description: 'Chacune des 5 compétences au niveau 75 minimum',
        check: () => {
            return Object.values(gameState.skills).filter(s => s.level >= 75).length;
        }
    },
    {
        id: 'noBrokenWeapon',
        label: 'Aucune arme cassée',
        target: 1,
        description: 'Pas d\'arme brisée pendant les 66 jours',
        check: () => {
            const c = gameState.campaign;
            const anyBroken = Object.values(c.weapons || {}).some(w => w?.broken);
            return anyBroken ? 0 : 1;
        }
    },
    {
        id: 'weeklyRecommendations',
        label: 'Sessions hebdo (8/9 sem)',
        target: 8,
        description: 'Atteindre les recommandations 8 semaines sur 9',
        check: () => {
            // Approximation: count weeks during fight where all session targets were met
            const c = gameState.campaign;
            if (!c.bossStartDate) return 0;
            // Simplified: count completed weeks based on session activity
            // Will be enriched in V6.0c with real weekly tracking
            const start = new Date(c.bossStartDate);
            const weeksElapsed = Math.floor((getNow() - start) / (7 * 86400000));
            // Conservative: assume current session activity continues
            return Math.min(8, Math.max(0, weeksElapsed - 1));
        }
    },
    {
        id: 'persoHabits',
        label: '3 habits perso sans interruption',
        target: 3,
        description: '3 habitudes personnelles sans gap > 1 jour pendant 66j',
        check: () => {
            // Count personal (non-recommended) habits with active streak
            const persoHabits = gameState.habits.filter(h => !h.isRecommended);
            // Habits with streak >= 30 days qualify (~half the boss duration sustained)
            return persoHabits.filter(h => (h.streak || 0) >= 30).length;
        }
    }
];

function getInnommableProgress() {
    return INNOMMABLE_CONDITIONS.map(cond => ({
        ...cond,
        current: cond.check(),
        complete: cond.check() >= cond.target
    }));
}

function checkInnommableVictory() {
    const c = gameState.campaign;
    if (!c || c.currentBossId !== 'b17') return false;
    const progress = getInnommableProgress();
    const allComplete = progress.every(p => p.complete);
    if (allComplete) {
        const innommable = BOSS_DATA.find(b => b.id === 'b17');
        defeatBoss(innommable);
        return true;
    }
    return false;
}

/* ═══════════════════════════════════════════
   V6.0b — MULTI-PERIOD GRAPHS (skills + mood)
   ═══════════════════════════════════════════ */

const GRAPH_PERIODS = [
    { key:'7d',  label:'7j',  days:7,   bucket:'day',   buckets:7  },
    { key:'30d', label:'30j', days:30,  bucket:'day',   buckets:30 },
    { key:'3m',  label:'3m',  days:90,  bucket:'week',  buckets:13 },
    { key:'6m',  label:'6m',  days:180, bucket:'week',  buckets:26 },
    { key:'1y',  label:'1an', days:365, bucket:'month', buckets:12 }
];

// State for current selected period per skill (and mood)
const _graphPeriod = { mood:'30d' };

function setGraphPeriod(target, periodKey) {
    _graphPeriod[target] = periodKey;
    renderUI();
}

// Aggregate XP gains by bucket for a given skill
function getSkillXPHistory(skillKey, periodKey) {
    const period = GRAPH_PERIODS.find(p => p.key === periodKey) || GRAPH_PERIODS[1];
    const now = getNow();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - period.days);
    cutoff.setHours(0,0,0,0);

    const entries = (gameState.xpHistory || []).filter(e =>
        e.skill === skillKey && new Date(e.date) >= cutoff
    );

    const buckets = [];
    if (period.bucket === 'day') {
        for (let i = period.buckets - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateStr(d);
            const xp = entries.filter(e => e.date === dateStr).reduce((s,e) => s + (e.amount||0), 0);
            buckets.push({ label: `${d.getDate()}/${d.getMonth()+1}`, value: xp, date: dateStr });
        }
    } else if (period.bucket === 'week') {
        for (let i = period.buckets - 1; i >= 0; i--) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);
            const startStr = getLocalDateStr(weekStart);
            const endStr = getLocalDateStr(weekEnd);
            const xp = entries.filter(e => e.date >= startStr && e.date <= endStr).reduce((s,e) => s + (e.amount||0), 0);
            buckets.push({ label: `${weekStart.getDate()}/${weekStart.getMonth()+1}`, value: xp });
        }
    } else if (period.bucket === 'month') {
        for (let i = period.buckets - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const startStr = getLocalDateStr(monthStart);
            const endStr = getLocalDateStr(monthEnd);
            const xp = entries.filter(e => e.date >= startStr && e.date <= endStr).reduce((s,e) => s + (e.amount||0), 0);
            const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
            buckets.push({ label: monthNames[d.getMonth()], value: xp });
        }
    }
    return buckets;
}

// Generic SVG bar graph builder (used for skills XP and mood)
function buildBarGraphSVG(buckets, color, periodKey) {
    if (!buckets || buckets.length === 0) {
        return '<div class="graph-empty">Pas de données sur cette période.</div>';
    }
    const W = 300, H = 80, padding = 6;
    const innerW = W - 2*padding;
    const innerH = H - 2*padding;
    const max = Math.max(...buckets.map(b => b.value), 1);
    const barW = innerW / buckets.length;
    const total = buckets.reduce((s,b) => s + b.value, 0);

    const barsHtml = buckets.map((b, i) => {
        const h = (b.value / max) * innerH;
        const x = padding + i * barW + 1;
        const y = H - padding - h;
        const w = Math.max(1, barW - 2);
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${b.value > 0 ? 0.9 : 0}" rx="1">
            <title>${b.label}: ${b.value} XP</title>
        </rect>`;
    }).join('');

    const periodSelector = GRAPH_PERIODS.map(p => {
        const active = p.key === periodKey;
        return `<button class="graph-period-btn ${active?'active':''}" data-period="${p.key}">${p.label}</button>`;
    }).join('');

    return `<div class="graph-stat-row">
        <span class="graph-total">${total.toLocaleString()} XP</span>
        <span class="graph-period-label">sur la période</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" class="graph-svg" preserveAspectRatio="none">
        <line x1="${padding}" y1="${H-padding}" x2="${W-padding}" y2="${H-padding}" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
        ${barsHtml}
    </svg>`;
}

function buildSkillGraph(skillKey) {
    const periodKey = _graphPeriod[skillKey] || '30d';
    const buckets = getSkillXPHistory(skillKey, periodKey);
    const cfg = SKILL_CONFIG[skillKey];

    const periodBtns = GRAPH_PERIODS.map(p => {
        const active = p.key === periodKey;
        return `<button class="graph-period-btn ${active?'active':''}" onclick="setGraphPeriod('${skillKey}','${p.key}')">${p.label}</button>`;
    }).join('');

    return `<div class="skill-xp-graph">
        <div class="graph-period-row">${periodBtns}</div>
        ${buildBarGraphSVG(buckets, cfg.color, periodKey)}
    </div>`;
}

/* ═══════════════════════════════════════════
   V7.0 — JOURNAL
   ═══════════════════════════════════════════ */

// 365 questions, indexed by day-of-year (0..364). Same question every year
// on the same calendar day so users can compare entries across years.
const JOURNAL_QUESTIONS = [
    // Janvier (0–30)
    "Quelle est ton intention principale pour cette nouvelle année ?",
    "Qu'est-ce que tu veux laisser derrière toi ?",
    "Quelle habitude veux-tu vraiment ancrer cette année ?",
    "Décris la personne que tu veux devenir.",
    "Quelle peur veux-tu affronter cette année ?",
    "Quel est ton plus grand rêve en ce moment ?",
    "Qu'est-ce qui te rend vivant ?",
    "À qui veux-tu dire merci aujourd'hui ?",
    "Quelle conversation as-tu peur d'avoir ?",
    "Quel livre, film, ou personne t'a marqué récemment ?",
    "Quand t'es-tu senti le plus fier dernièrement ?",
    "Quel petit bonheur as-tu vécu hier ?",
    "Qu'est-ce que tu repousses depuis trop longtemps ?",
    "Quelles sont tes trois priorités cette semaine ?",
    "Comment décris-tu ton humeur d'aujourd'hui en un mot ?",
    "Quel souvenir d'enfance te revient souvent ?",
    "Quelle personne t'inspire le plus en ce moment ?",
    "De quoi as-tu vraiment besoin aujourd'hui ?",
    "Quel a été ton plus beau geste envers quelqu'un récemment ?",
    "Qu'est-ce qui te bloque actuellement ?",
    "Quelle décision est mûre mais que tu n'as pas encore prise ?",
    "Si tu pouvais effacer une habitude, laquelle ?",
    "Quelle compétence veux-tu développer en priorité ?",
    "Quel est le dernier compliment qui t'a touché ?",
    "Qu'est-ce que tu aimes chez toi en ce moment ?",
    "Quand t'es-tu senti aligné cette semaine ?",
    "Comment voudrais-tu que les gens te décrivent ?",
    "Quelle promesse veux-tu te tenir aujourd'hui ?",
    "Qu'est-ce qui t'apaise ?",
    "Quelle activité te fait perdre la notion du temps ?",
    "Quel rêve abandonné mérite peut-être un retour ?",
    // Février (31–58)
    "Qu'est-ce que l'amour signifie pour toi en ce moment ?",
    "À qui penses-tu sans le lui dire ?",
    "Quelle relation veux-tu cultiver ?",
    "Quelle limite dois-tu poser ?",
    "Quel est ton refuge mental ?",
    "Quelle est ta plus belle qualité ?",
    "Qu'est-ce qui te manque sans que tu l'admettes ?",
    "Quelle personne du passé te manque ?",
    "Quel mot revient souvent dans ta tête ces jours-ci ?",
    "Quelle est ta plus grande source d'énergie ?",
    "Comment veux-tu te sentir ce soir ?",
    "Quelle erreur récente t'a appris quelque chose ?",
    "Qu'est-ce que tu refuses d'admettre ?",
    "Quelle est ta plus belle réussite cette semaine ?",
    "Si tu avais 24h tranquilles, qu'en ferais-tu ?",
    "Qu'est-ce qui te rend curieux en ce moment ?",
    "Quel sentiment essaies-tu d'éviter ?",
    "Quelle ambition tu n'oses pas dire à voix haute ?",
    "Quelle question reviens-tu souvent à te poser ?",
    "Qu'est-ce qui te fait sourire facilement ?",
    "Quel défi as-tu relevé cette semaine ?",
    "Quel petit changement aurait un grand impact ?",
    "Qu'est-ce que tu veux apprendre à dire non ?",
    "À quoi rêvais-tu enfant ?",
    "Quelle musique te calme en ce moment ?",
    "Quel est ton mot du jour ?",
    "Qu'as-tu envie de pardonner ?",
    "Quel souvenir veux-tu créer ce mois-ci ?",
    "Quelle personne t'a écouté récemment ?",
    // Mars (59–89)
    "Quel printemps intérieur arrive ?",
    "Quelle vieille habitude doit céder la place ?",
    "Qu'est-ce qui pousse en toi en ce moment ?",
    "Quelle promesse t'es-tu faite il y a longtemps ?",
    "Quel rêve mérite d'être semé ?",
    "Quel est ton projet le plus excitant ?",
    "Quelle peur te paralyse encore ?",
    "À quoi ressemble ton matin idéal ?",
    "Qui t'inspire de la confiance ?",
    "Quel rituel veux-tu adopter ?",
    "Comment veux-tu être présent aujourd'hui ?",
    "Quelle conversation veux-tu enfin avoir ?",
    "Qu'est-ce qui te rend impatient ?",
    "Quel est ton plus grand levier de bonheur ?",
    "Quel travail te donne du sens ?",
    "Quel est ton plus beau souvenir de cette semaine ?",
    "Qu'est-ce qui te freine encore ?",
    "Quelle valeur défends-tu sans compromis ?",
    "À qui veux-tu écrire une lettre ?",
    "Quelle question te poses-tu en boucle ?",
    "Qu'est-ce qui mérite plus d'attention ?",
    "Quel est ton plus grand atout en ce moment ?",
    "Comment veux-tu finir ce mois ?",
    "Quel a été ton moment de gratitude aujourd'hui ?",
    "Quelle chose nouvelle veux-tu essayer ?",
    "À quoi penses-tu le plus souvent ?",
    "Quel mot te décrit aujourd'hui ?",
    "Qu'est-ce qui te paraît important mais que tu négliges ?",
    "Quelle déception veux-tu transformer ?",
    "Quelle énergie veux-tu cultiver ?",
    "Quel défi te stimule ?",
    // Avril (90–119)
    "Qu'est-ce qui te renouvelle ?",
    "Quel changement attends-tu ?",
    "Quelle est ta priorité aujourd'hui ?",
    "Qu'est-ce qui te rend léger ?",
    "Quel rêve te semble plus accessible aujourd'hui ?",
    "Quelle personne mériterait un message de toi ?",
    "Qu'est-ce que tu négliges chez toi ?",
    "Quelle est ta forme physique en ce moment ?",
    "Qu'est-ce qui te nourrit l'âme ?",
    "Quel objectif t'a échappé récemment ?",
    "Quelle est ta plus belle leçon du mois ?",
    "Quel souvenir te fait sourire aujourd'hui ?",
    "Quelle relation t'épuise ?",
    "Quelle relation te ressource ?",
    "Quelle phrase te revient en ce moment ?",
    "Quel a été ton meilleur moment de la semaine ?",
    "Quel est ton lieu préféré pour penser ?",
    "Quelle est ta plus grande peur en ce moment ?",
    "Quel courage as-tu eu récemment ?",
    "Qu'est-ce que tu veux célébrer aujourd'hui ?",
    "Quelle conversation te trotte dans la tête ?",
    "Quel acte de gentillesse veux-tu poser ?",
    "Qu'est-ce que tu veux apprendre cette semaine ?",
    "Quelle est ta plus belle qualité humaine ?",
    "Quel défaut acceptes-tu mieux qu'avant ?",
    "À quoi penses-tu juste avant de dormir ?",
    "Quel est ton équilibre actuel entre travail et repos ?",
    "Qu'est-ce qui t'a touché aujourd'hui ?",
    "Quelle est ta source d'inspiration du moment ?",
    "Quel pas veux-tu faire demain ?",
    // Mai (120–150)
    "Quelle saison de ta vie traverses-tu ?",
    "Quel sentiment domine cette semaine ?",
    "Qu'est-ce qui te rend curieux du futur ?",
    "Quelle est ta routine préférée ?",
    "Qu'est-ce qui pousse en toi malgré toi ?",
    "Quelle personne te manque ce mois-ci ?",
    "Quel a été ton plus beau geste cette semaine ?",
    "Qu'est-ce que tu admires chez les autres ?",
    "Quel rêve d'enfant veux-tu réveiller ?",
    "Quelle activité te connecte à toi-même ?",
    "Quelle vérité veux-tu accueillir ?",
    "Qu'est-ce que tu repousses encore ?",
    "Quel défi as-tu surmonté récemment ?",
    "Quel est ton mantra du moment ?",
    "Quelle peur as-tu apprivoisée ?",
    "Quelle joie veux-tu cultiver ?",
    "Comment veux-tu te sentir dans un mois ?",
    "Quel petit changement veux-tu instaurer ?",
    "Quelle est ta priorité émotionnelle ?",
    "Qu'est-ce qui te paraît injuste en ce moment ?",
    "Quel acte de courage veux-tu poser ?",
    "Quel est ton terrain de jeu préféré ?",
    "Quelle pensée veux-tu lâcher ?",
    "Quelle qualité veux-tu développer ?",
    "À quoi penses-tu pendant tes pauses ?",
    "Quelle est ta plus grande force aujourd'hui ?",
    "Quel rêve te semble proche ?",
    "Qu'est-ce qui te fait rire en ce moment ?",
    "Quel souvenir veux-tu garder ?",
    "Quelle leçon retiens-tu de cette semaine ?",
    "Quel mot caractérise ton printemps ?",
    // Juin (151–180)
    "Quelle promesse veux-tu honorer cet été ?",
    "Qu'est-ce qui te connecte au présent ?",
    "Quel est ton projet d'été ?",
    "Quelle est ta plus belle découverte récente ?",
    "Quelle est ta couleur émotionnelle aujourd'hui ?",
    "Qui veux-tu mieux comprendre ?",
    "Qu'est-ce qui t'apporte de la paix ?",
    "Quelle compétence veux-tu pratiquer ?",
    "Quel souvenir t'apaise ?",
    "Quel rêve mérite plus d'attention ?",
    "Quelle est ta plus belle réalisation du mois ?",
    "À quoi veux-tu dire oui ?",
    "À quoi veux-tu dire non ?",
    "Quel défi mental traverses-tu ?",
    "Quelle personne mérite plus de ton temps ?",
    "Qu'est-ce qui te rend impatient ?",
    "Quel rituel veux-tu instaurer cet été ?",
    "Quelle est ta plus belle motivation ?",
    "Qu'est-ce qui te rend vraiment heureux ?",
    "Quel risque vaut la peine d'être pris ?",
    "Quel est ton mot d'ordre du jour ?",
    "Quelle est ta plus belle qualité en ce moment ?",
    "Quel petit pas changerait tout ?",
    "Quelle est ta priorité du week-end ?",
    "Quel souvenir d'été veux-tu créer ?",
    "Quelle est ta plus belle ressource intérieure ?",
    "Quelle personne t'a manqué récemment ?",
    "Quel projet te stimule ?",
    "Quel défi physique veux-tu relever ?",
    "Quelle est ta phrase préférée ces jours-ci ?",
    // Juillet (181–211)
    "Quel est ton plus beau souvenir d'été ?",
    "Qu'est-ce qui te détend vraiment ?",
    "Quel est ton lieu préféré pour rêver ?",
    "Quel rythme veux-tu adopter cet été ?",
    "Quelle est ta plus belle aventure récente ?",
    "Qu'est-ce qui te rend vivant en ce moment ?",
    "Quelle personne veux-tu remercier aujourd'hui ?",
    "Quelle est ta plus grande joie du mois ?",
    "Qu'est-ce qui te rend serein ?",
    "Quel rêve veux-tu préparer ?",
    "Quelle activité veux-tu redécouvrir ?",
    "Quel souvenir d'enfance te revient ?",
    "Qu'est-ce que tu veux apprendre cet été ?",
    "Quelle est ta plus belle conversation récente ?",
    "Quel défi as-tu réussi à dépasser ?",
    "Quelle relation veux-tu approfondir ?",
    "Qu'est-ce qui te rend impatient pour la rentrée ?",
    "Quel souvenir veux-tu écrire en détail ?",
    "Quelle est ta plus grande gratitude ?",
    "Qu'est-ce qui te fait te sentir libre ?",
    "Quelle est ton ambition secrète ?",
    "Quel acte de bienveillance veux-tu poser ?",
    "Quel rêve te semble réalisable ?",
    "Quelle personne veux-tu mieux écouter ?",
    "Qu'est-ce qui te fait te sentir aligné ?",
    "Quelle est ta plus belle leçon de l'été ?",
    "Quel projet veux-tu lancer en automne ?",
    "Quelle est ta couleur intérieure du jour ?",
    "Qu'est-ce qui t'a ému aujourd'hui ?",
    "Quelle est ta plus belle source d'énergie ?",
    "Quel défi veux-tu transformer en opportunité ?",
    // Août (212–242)
    "Quel rituel d'été veux-tu préserver à la rentrée ?",
    "Quelle est ta plus belle observation récente ?",
    "Quel est ton moment de grâce de la semaine ?",
    "Quelle personne veux-tu surprendre ?",
    "Qu'est-ce qui t'inspire en ce moment ?",
    "Quel souvenir veux-tu honorer ?",
    "Quelle question reste sans réponse ?",
    "Quel défi te paraît plus simple aujourd'hui ?",
    "Quelle est ta plus belle motivation ?",
    "Qu'est-ce qui te ressource vraiment ?",
    "Quel rêve veux-tu commencer à concrétiser ?",
    "Quelle conversation veux-tu provoquer ?",
    "Qu'est-ce que tu veux laisser derrière toi cet été ?",
    "Quel souvenir d'été marquera l'année ?",
    "Quelle est ta plus belle découverte personnelle ?",
    "Quel risque a payé ?",
    "Quel mot symbolise ton été ?",
    "Quelle leçon retiens-tu de ces derniers mois ?",
    "Qu'est-ce que tu veux préparer pour la rentrée ?",
    "Quelle est ta plus belle qualité d'écoute ?",
    "Quelle personne t'a marqué cette saison ?",
    "Quel rêve t'a échappé cet été ?",
    "Qu'est-ce qui te rend nostalgique ?",
    "Quel défi mental veux-tu relever ?",
    "Quelle énergie veux-tu garder pour septembre ?",
    "Qu'est-ce qui t'attend dans les mois à venir ?",
    "Quelle est ta plus belle promesse à toi-même ?",
    "Quel projet veux-tu finaliser ?",
    "Quel souvenir veux-tu graver ?",
    "Quelle est ta plus grande source de fierté ?",
    "Qu'est-ce qui te paraît évident aujourd'hui ?",
    // Septembre (243–272)
    "Quel est ton plan pour la rentrée ?",
    "Quelle habitude veux-tu reprendre ?",
    "Quel défi veux-tu poser ce mois-ci ?",
    "Qu'est-ce que tu veux apprendre cet automne ?",
    "Quelle personne veux-tu retrouver ?",
    "Qu'est-ce qui te motive en cette rentrée ?",
    "Quel rêve veux-tu remettre en mouvement ?",
    "Quelle est ta plus belle intention pour la fin d'année ?",
    "Quel objectif clair veux-tu te donner ?",
    "Quelle est ta plus grande priorité actuelle ?",
    "Quelle peur te suit depuis trop longtemps ?",
    "Quel rituel veux-tu réintroduire ?",
    "Qu'est-ce qui te paraît plus clair qu'avant ?",
    "Quel souvenir veux-tu cultiver ?",
    "Quelle conversation veux-tu avoir ?",
    "Quel petit défi veux-tu te lancer ?",
    "Quelle est ta plus belle motivation à long terme ?",
    "Quel est ton lieu d'ancrage ?",
    "Quelle personne mérite plus de ton attention ?",
    "Qu'est-ce que tu repousses encore ?",
    "Quelle est ta plus belle qualité au travail ?",
    "Quel est ton moteur principal aujourd'hui ?",
    "Quelle leçon récente veux-tu intégrer ?",
    "Quel rêve mérite plus d'audace ?",
    "Quelle est ta plus belle gratitude ?",
    "Qu'est-ce qui t'apporte de la clarté ?",
    "Quel défi te paraît surmontable maintenant ?",
    "Quelle est ta plus belle force intérieure ?",
    "Quel projet veux-tu protéger ?",
    "Quelle phrase veux-tu retenir aujourd'hui ?",
    // Octobre (273–303)
    "Quel changement t'apporte automne ?",
    "Quelle est ta couleur intérieure du moment ?",
    "Qu'est-ce qui mérite plus de patience ?",
    "Quelle est ta plus belle réussite récente ?",
    "Quel équilibre cherches-tu en ce moment ?",
    "Quelle relation veux-tu nourrir ?",
    "Quel défi te grandit ?",
    "Qu'est-ce que tu veux ralentir ?",
    "Quelle peur veux-tu remettre à sa place ?",
    "Quel est ton plus beau souvenir d'automne ?",
    "Quelle personne t'apporte de la paix ?",
    "Quel rêve veux-tu déposer sur papier ?",
    "Qu'est-ce qui te rend vraiment toi ?",
    "Quelle est ta plus belle qualité d'écoute ?",
    "Quel rituel te recentre ?",
    "Quelle est ta plus belle prise de conscience ?",
    "Quel défi physique veux-tu relever ?",
    "Quelle conversation t'a marqué récemment ?",
    "Quel rêve revient régulièrement ?",
    "Qu'est-ce qui te connecte aux autres ?",
    "Quelle est ta plus belle leçon récente ?",
    "Quel objectif veux-tu valider avant fin d'année ?",
    "Quel rêve te paraît plus tangible ?",
    "Quelle peur veux-tu accueillir avec douceur ?",
    "Quel est ton plus beau geste récent ?",
    "Qu'est-ce qui te paraît essentiel aujourd'hui ?",
    "Quelle est ta plus belle ressource du moment ?",
    "Quel souvenir d'automne veux-tu créer ?",
    "Quelle personne veux-tu honorer ?",
    "Quel défi te stimule en ce moment ?",
    "Quel mot résume ton mois ?",
    // Novembre (304–333)
    "Quelle est ta plus belle gratitude du jour ?",
    "Qu'est-ce que tu veux préserver à l'approche de l'hiver ?",
    "Quelle personne mérite tes remerciements ?",
    "Quel souvenir te tient chaud au cœur ?",
    "Quelle est ta plus belle qualité d'attention ?",
    "Quel défi veux-tu boucler avant l'hiver ?",
    "Quelle peur de l'hiver veux-tu apprivoiser ?",
    "Qu'est-ce qui te ressource quand il fait sombre ?",
    "Quel rêve veux-tu garder vivant ?",
    "Quelle est ta plus belle leçon de l'année jusqu'ici ?",
    "Quel projet veux-tu finaliser avant décembre ?",
    "Quelle est ta plus belle qualité humaine ?",
    "Qu'est-ce que tu veux abandonner avant la nouvelle année ?",
    "Quelle est ta plus belle relation actuellement ?",
    "Quel souvenir veux-tu chérir ?",
    "Quelle est ta plus belle qualité de cœur ?",
    "Quelle conversation te manque ?",
    "Quel défi mental traverses-tu ?",
    "Quel projet te paraît plus mûr ?",
    "Qu'est-ce qui te rend fier en ce moment ?",
    "Quelle est ta plus belle promesse pour décembre ?",
    "Quelle peur veux-tu désamorcer ?",
    "Quel rêve veux-tu murmurer à voix haute ?",
    "Qu'est-ce que tu veux nettoyer dans ta vie ?",
    "Quelle est ta plus belle qualité d'écoute ?",
    "Quelle personne veux-tu mieux comprendre ?",
    "Quel rituel veux-tu instaurer cet hiver ?",
    "Quel souvenir veux-tu rejouer mentalement ?",
    "Quelle est ta plus belle motivation actuelle ?",
    "Quel défi te paraît plus accessible aujourd'hui ?",
    // Décembre (334–364)
    "Quel est ton bilan émotionnel de l'année ?",
    "Quelle est ta plus belle réussite de l'année ?",
    "Quelle leçon retiens-tu de cette année ?",
    "Quelle personne a marqué ton année ?",
    "Quel souvenir veux-tu emporter dans la nouvelle année ?",
    "Quelle peur as-tu dépassée cette année ?",
    "Quel rêve as-tu réalisé ou approché ?",
    "Quelle est ta plus belle qualité développée ?",
    "Quel défi as-tu surmonté ?",
    "Quelle est ta plus belle gratitude de l'année ?",
    "Qu'est-ce que tu veux laisser derrière toi ?",
    "Quel rituel veux-tu emporter dans la prochaine année ?",
    "Quelle personne mérite tes excuses ?",
    "Quelle conversation veux-tu avoir avant la fin de l'année ?",
    "Quel souvenir veux-tu honorer ?",
    "Quelle est ta plus belle leçon de relation ?",
    "Quel mot symbolise ton année ?",
    "Quelle énergie veux-tu garder pour janvier ?",
    "Qu'est-ce que tu veux remercier de cette année ?",
    "Quel défi veux-tu reprendre l'année prochaine ?",
    "Quelle est ta plus belle qualité humaine de l'année ?",
    "Quel rêve veux-tu nourrir en silence ?",
    "Quelle est ta plus belle découverte sur toi ?",
    "Quel cadeau veux-tu te faire ?",
    "Quelle est ta plus belle paix intérieure ?",
    "Quel souvenir te fait pleurer de joie ?",
    "Quelle promesse veux-tu te faire ?",
    "Quel est ton mot d'ordre pour l'année à venir ?",
    "Quelle peur veux-tu laisser derrière toi ?",
    "Qu'est-ce que tu emportes de cette année dans la suivante ?",
    "Quelle est ta plus belle intention pour demain ?"
];

// Day of year (0-indexed). Leap-year safe.
function getDayOfYear(date) {
    const d = date || getNow();
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000);
    const day = Math.floor(diff / 86400000) - 1;
    return Math.min(JOURNAL_QUESTIONS.length - 1, Math.max(0, day));
}

function getJournalQuestionForDate(date) {
    const idx = getDayOfYear(date);
    return JOURNAL_QUESTIONS[idx] || JOURNAL_QUESTIONS[0];
}

function getJournalEntry(dateStr) {
    return (gameState.journal?.entries || {})[dateStr] || null;
}

function hasJournalContent(dateStr) {
    const e = getJournalEntry(dateStr);
    if (!e) return false;
    return !!((e.answer && e.answer.trim()) || (e.freeText && e.freeText.trim()));
}

// Compute streak of consecutive days with at least one journal entry,
// allowing 1 day of grace just like habits.
function computeJournalStreak() {
    const entries = gameState.journal?.entries || {};
    const dates = Object.keys(entries).filter(d => hasJournalContent(d));
    if (dates.length === 0) return 0;
    const set = new Set(dates);

    const now = getNow();
    const todayStr = getLocalDateStr(now);
    const y1 = new Date(now); y1.setDate(y1.getDate()-1);
    const y2 = new Date(now); y2.setDate(y2.getDate()-2);

    if (!set.has(todayStr) && !set.has(getLocalDateStr(y1)) && !set.has(getLocalDateStr(y2))) return 0;

    let streak = 0;
    let graceUsed = false;
    const d = new Date(now); d.setHours(0,0,0,0);
    if (set.has(getLocalDateStr(d))) streak++;
    d.setDate(d.getDate()-1);
    for (let i=0; i<1000; i++) {
        const ds = getLocalDateStr(d);
        if (set.has(ds)) { streak++; graceUsed = false; }
        else if (!graceUsed) graceUsed = true;
        else break;
        d.setDate(d.getDate()-1);
    }
    return streak;
}

// Find entries from previous years for the same calendar day (month-day)
function getYearsAgoEntries(dateStr) {
    const ref = new Date(dateStr + 'T12:00:00');
    const refMonth = ref.getMonth();
    const refDay = ref.getDate();
    const refYear = ref.getFullYear();
    const entries = gameState.journal?.entries || {};
    const result = [];
    Object.keys(entries).forEach(k => {
        const d = new Date(k + 'T12:00:00');
        if (d.getMonth() === refMonth && d.getDate() === refDay && d.getFullYear() < refYear) {
            const e = entries[k];
            if (hasJournalContent(k)) {
                result.push({ date: k, year: d.getFullYear(), yearsAgo: refYear - d.getFullYear(), entry: e });
            }
        }
    });
    return result.sort((a,b) => a.yearsAgo - b.yearsAgo);
}

// SHA-256 hash for PIN (Web Crypto). Not encryption — just storage hash.
async function hashPin(pin) {
    const enc = new TextEncoder().encode(String(pin));
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function setJournalPin(pin) {
    const hash = await hashPin(pin);
    gameState.journal.pinHash = hash;
    saveGameState();
}

async function verifyJournalPin(pin) {
    const h = gameState.journal?.pinHash;
    if (!h) return true;
    return (await hashPin(pin)) === h;
}

function removeJournalPin() {
    if (gameState.journal) gameState.journal.pinHash = null;
    saveGameState();
}

// V7.0b: autosave with 2s debounce. Silent (no XP toast); flashes a status indicator.
let _journalAutosaveTimer = null;
let _journalAutosaveDirty = false;
// Unlocked session flag (resets on page refresh/reload — security by design)
let _journalUnlocked = false;

function scheduleJournalAutosave() {
    _journalAutosaveDirty = true;
    showJournalStatus('typing');
    clearTimeout(_journalAutosaveTimer);
    _journalAutosaveTimer = setTimeout(() => {
        runJournalAutosave();
    }, 2000);
}

function runJournalAutosave() {
    if (!_journalAutosaveDirty) return;
    const today = getLocalDateStr(getNow());
    const dateStr = _journalEditingDate || today;
    const answerEl   = document.getElementById('journal-answer');
    const freeEl     = document.getElementById('journal-freetext');
    if (!answerEl && !freeEl) return; // panel not in DOM anymore
    const answer   = answerEl ? answerEl.value : undefined;
    const freeText = freeEl ? freeEl.value : undefined;
    saveJournalEntry(dateStr, { answer, freeText }, { silent: true });
    _journalAutosaveDirty = false;
    showJournalStatus('saved');
}

function showJournalStatus(state) {
    const el = document.getElementById('journal-status');
    if (!el) return;
    if (state === 'typing') {
        el.textContent = '✏️ modification…';
        el.className = 'journal-status typing';
    } else if (state === 'saved') {
        el.textContent = '✓ enregistré';
        el.className = 'journal-status saved';
        // Fade out after 2s
        setTimeout(() => {
            if (el.textContent === '✓ enregistré' && !_journalAutosaveDirty) {
                el.className = 'journal-status idle';
            }
        }, 2000);
    } else {
        el.textContent = '';
        el.className = 'journal-status idle';
    }
}

// Flush pending autosave when navigating away or closing
function flushJournalAutosave() {
    if (_journalAutosaveTimer) {
        clearTimeout(_journalAutosaveTimer);
        _journalAutosaveTimer = null;
    }
    if (_journalAutosaveDirty) runJournalAutosave();
}



// Save a journal entry (today only for new XP, but past edits allowed)
// V7.0b: opts.silent = true → no toast (used by autosave)
function saveJournalEntry(dateStr, { answer, freeText, mood }, opts = {}) {
    const silent = !!opts.silent;
    if (!gameState.journal) gameState.journal = { pinHash:null, entries:{}, streak:0, longestStreak:0, lastEntryDate:null, xpAwardedDates:[] };
    if (!gameState.journal.entries[dateStr]) {
        gameState.journal.entries[dateStr] = {
            question: getJournalQuestionForDate(new Date(dateStr + 'T12:00:00')),
            answer: '',
            freeText: '',
            mood: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
    const entry = gameState.journal.entries[dateStr];
    if (answer !== undefined)   entry.answer = answer;
    if (freeText !== undefined) entry.freeText = freeText;
    if (mood !== undefined)     entry.mood = mood;
    entry.updatedAt = new Date().toISOString();

    // Mirror mood to gameState.moods if set
    if (mood !== null && mood !== undefined) {
        if (!gameState.moods) gameState.moods = [];
        const existing = gameState.moods.find(m => m.date === dateStr);
        if (existing) existing.value = mood;
        else gameState.moods.push({ date: dateStr, value: mood, timestamp: new Date().toISOString() });
    }

    // XP: only once per day, only when content actually exists
    const todayStr = getLocalDateStr(getNow());
    const hasContent = hasJournalContent(dateStr);
    let xpAwarded = false;
    if (hasContent && dateStr === todayStr) {
        if (!gameState.journal.xpAwardedDates.includes(dateStr)) {
            gameState.journal.xpAwardedDates.push(dateStr);
            // Bonus streak (after pushing this date, recompute then use streak-1 since today contributes)
            const newStreak = computeJournalStreak();
            const streakBonus = Math.max(0, newStreak - 1) * 5;
            const xp = Math.floor(20 * (1 + streakBonus/100));
            gainSkillXP('serenite', xp, `Journal — ${dateStr}`);
            xpAwarded = true;
            if (!silent) toast(`📖 Journal sauvegardé — +${xp} XP Sérénité`, 'success');
        } else if (!silent) {
            toast('Journal mis à jour ✓', 'info');
        }
    } else if (!silent) {
        toast('Entrée mise à jour ✓', 'info');
    }

    // Update streak
    gameState.journal.streak = computeJournalStreak();
    if (gameState.journal.streak > (gameState.journal.longestStreak||0)) {
        gameState.journal.longestStreak = gameState.journal.streak;
    }
    gameState.journal.lastEntryDate = dateStr;
    saveGameState();
    if (typeof updateJournalDot === 'function') updateJournalDot();
    return { xpAwarded };
}

// Delete an entry
function deleteJournalEntry(dateStr) {
    if (!gameState.journal?.entries) return;
    delete gameState.journal.entries[dateStr];
    gameState.journal.xpAwardedDates = (gameState.journal.xpAwardedDates||[]).filter(d => d !== dateStr);
    gameState.journal.streak = computeJournalStreak();
    saveGameState();
}

// ─── UI ──────────────────────────────────────────────────────────────

let _journalCalendarMonth = null;  // Date pointing to displayed month
let _journalEditingDate = null;    // currently editing entry date (null = today)

function switchProfSubtab(name) {
    document.querySelectorAll('.prof-subtab').forEach(b => {
        b.classList.toggle('active', b.dataset.subtab === name);
    });
    const pProf = document.getElementById('prof-content-profil');
    const pJour = document.getElementById('prof-content-journal');
    if (pProf) pProf.style.display = name === 'profil'  ? '' : 'none';
    if (pJour) pJour.style.display = name === 'journal' ? '' : 'none';
    if (name === 'journal') renderJournalPage();
    if (name === 'profil')  renderProfilPage();
    localStorage.setItem('lifeRPG_profSubtab', name);
}

// V7.0b: badge on the Journal sub-tab when today's entry is missing
function updateJournalDot() {
    const dot = document.getElementById('prof-journal-dot');
    if (!dot) return;
    const today = getLocalDateStr(getNow());
    dot.style.display = hasJournalContent(today) ? 'none' : 'inline-block';
}

function renderJournalPage() {
    const el = document.getElementById('journal-content');
    if (!el) return;

    // Locked state — PIN exists and not unlocked
    if (gameState.journal?.pinHash && !_journalUnlocked) {
        el.innerHTML = renderJournalLockScreen();
        return;
    }

    // No PIN set up yet — gentle prompt + main view
    el.innerHTML = renderJournalMain();
}

function renderJournalLockScreen() {
    return `
    <div class="journal-lock-screen">
        <div class="journal-lock-icon">🔒</div>
        <div class="journal-lock-title">Journal protégé</div>
        <div class="journal-lock-sub">Entre ton code pour déverrouiller</div>
        <input type="password" inputmode="numeric" maxlength="6" id="journal-pin-input"
               class="journal-pin-input" placeholder="••••" autocomplete="off"
               onkeypress="if(event.key==='Enter') submitJournalPin()" />
        <button class="btn-gold" onclick="submitJournalPin()">Déverrouiller</button>
        <div class="journal-lock-help">PIN oublié ? <a href="javascript:void(0)" onclick="resetJournalPinFlow()">Réinitialiser le journal</a></div>
    </div>`;
}

async function submitJournalPin() {
    const input = document.getElementById('journal-pin-input');
    if (!input) return;
    const pin = input.value.trim();
    if (!pin) { toast('Entre ton code', 'info'); return; }
    const ok = await verifyJournalPin(pin);
    if (ok) {
        _journalUnlocked = true;
        toast('Journal déverrouillé ✓', 'success');
        renderJournalPage();
    } else {
        input.value = '';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
        toast('Code incorrect', 'error');
    }
}

function resetJournalPinFlow() {
    showModal({
        type: 'danger',
        title: '⚠️ Réinitialiser le journal ?',
        body: 'Cette action <strong>supprimera définitivement</strong> toutes les entrées du journal et retirera le code PIN. Continue ?',
        confirmLabel: 'Tout supprimer',
        onConfirm: () => {
            gameState.journal = { pinHash:null, entries:{}, streak:0, longestStreak:0, lastEntryDate:null, xpAwardedDates:[] };
            _journalUnlocked = true;
            saveGameState();
            toast('Journal réinitialisé', 'info');
            renderJournalPage();
        }
    });
}

function renderJournalMain() {
    const today = getLocalDateStr(getNow());
    const dateToShow = _journalEditingDate || today;
    const entry = getJournalEntry(dateToShow) || {
        question: getJournalQuestionForDate(new Date(dateToShow + 'T12:00:00')),
        answer: '', freeText: '', mood: null
    };
    const isToday = dateToShow === today;
    const friendlyDate = formatJournalDate(dateToShow);
    const streak = computeJournalStreak();
    const longest = gameState.journal?.longestStreak || 0;

    const yearsAgo = getYearsAgoEntries(dateToShow);

    const hasPin = !!gameState.journal?.pinHash;

    const moodBtns = [1,2,3,4,5].map(v => {
        const cfg = MOOD_OPTIONS.find(m => m.value === v);
        const active = entry.mood === v ? 'active' : '';
        return `<button class="journal-mood-btn ${active}" style="background:${cfg.color}"
                        onclick="setJournalMood(${v})" title="${cfg.label}"></button>`;
    }).join('');

    return `
    <div class="journal-header">
        <div class="journal-date-bar">
            <button class="journal-nav-btn" onclick="journalGoToDate('prev')" title="Jour précédent">‹</button>
            <div class="journal-date-label">${friendlyDate}</div>
            <button class="journal-nav-btn" onclick="journalGoToDate('next')" title="Jour suivant" ${isToday?'disabled':''}>›</button>
        </div>
        <div class="journal-toolbar">
            <button class="journal-tool-btn" onclick="openJournalCalendarModal()">📅 Calendrier</button>
            ${!isToday ? `<button class="journal-tool-btn" onclick="journalBackToToday()">Aujourd'hui</button>` : ''}
            <div class="journal-streak">
                🔥 <strong>${streak}</strong> j ${longest > 0 ? `· record ${longest}` : ''}
            </div>
        </div>
        ${renderJournalStatsRow()}
    </div>

    <div class="journal-mood-row">
        <span class="journal-mood-label">Humeur :</span>
        <div class="journal-mood-buttons">${moodBtns}</div>
        ${entry.mood ? `<button class="journal-mood-clear" onclick="setJournalMood(null)" title="Retirer">✕</button>` : ''}
    </div>

    <div class="journal-section">
        <div class="journal-section-head">
            <div class="journal-section-title">Question du jour</div>
            ${!entry.altQuestionUsed && isToday ? `<button class="journal-alt-q-btn" onclick="useAlternativeQuestion()" title="Piocher une autre question (1×/jour)">🔄 Autre question</button>` : ''}
        </div>
        <div class="journal-question">${entry.question}</div>
        <textarea id="journal-answer" class="journal-textarea"
                  oninput="scheduleJournalAutosave()"
                  placeholder="Ta réponse…" rows="4">${escapeHtml(entry.answer || '')}</textarea>
    </div>

    <div class="journal-section">
        <div class="journal-section-title">Texte libre</div>
        <textarea id="journal-freetext" class="journal-textarea"
                  oninput="scheduleJournalAutosave()"
                  placeholder="Écris ce que tu veux : pensées, ressenti, événements…" rows="8">${escapeHtml(entry.freeText || '')}</textarea>
    </div>

    <div class="journal-actions">
        <button class="btn-gold journal-save-btn" onclick="commitJournalEntry()">💾 Sauvegarder</button>
        <span id="journal-status" class="journal-status idle"></span>
        ${(entry.answer || entry.freeText) ? `<button class="btn-cancel" onclick="confirmDeleteJournalEntry('${dateToShow}')">Supprimer cette entrée</button>` : ''}
    </div>

    ${yearsAgo.length > 0 ? renderJournalYearsAgo(yearsAgo) : ''}

    <div class="journal-settings">
        <button class="journal-tool-btn" onclick="openJournalPinSettings()">
            ${hasPin ? '🔒 Changer / retirer le code PIN' : '🔓 Activer un code PIN'}
        </button>
    </div>`;
}

function renderJournalYearsAgo(list) {
    return `
    <div class="journal-section journal-years-ago">
        <div class="journal-section-title">⏳ À cette date, les années passées</div>
        ${list.map(item => `
            <div class="journal-year-card">
                <div class="journal-year-card-head">
                    <strong>${item.yearsAgo === 1 ? 'Il y a 1 an' : `Il y a ${item.yearsAgo} ans`}</strong>
                    <span class="journal-year-card-date">${formatJournalDate(item.date)}</span>
                </div>
                ${item.entry.question ? `<div class="journal-year-card-q">« ${item.entry.question} »</div>` : ''}
                ${item.entry.answer  ? `<div class="journal-year-card-a">${escapeHtml(item.entry.answer)}</div>` : ''}
                ${item.entry.freeText ? `<div class="journal-year-card-free">${escapeHtml(item.entry.freeText)}</div>` : ''}
                <button class="journal-tool-btn" style="margin-top:6px;" onclick="journalJumpTo('${item.date}')">Ouvrir ce jour</button>
            </div>
        `).join('')}
    </div>`;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[c]);
}

function formatJournalDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const today = getLocalDateStr(getNow());
    if (dateStr === today) return `Aujourd'hui · ${d.toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}`;
    return d.toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
}

// V7.0b: small stats row above the entry editor (only when there's at least 1 entry)
function renderJournalStatsRow() {
    const stats = computeJournalStats();
    if (stats.total === 0) return '';
    return `
    <div class="journal-stats-row">
        <div class="journal-stat">
            <div class="journal-stat-val">${stats.total}</div>
            <div class="journal-stat-lbl">entrée${stats.total>1?'s':''}</div>
        </div>
        <div class="journal-stat">
            <div class="journal-stat-val">${stats.longest}</div>
            <div class="journal-stat-lbl">plus long série</div>
        </div>
        <div class="journal-stat">
            <div class="journal-stat-val journal-stat-month">${stats.topMonth}</div>
            <div class="journal-stat-lbl">mois ${stats.topCount > 1 ? `(${stats.topCount}×)` : ''}</div>
        </div>
    </div>`;
}

// V7.0b: pick another random question different from the current one.
// Once per day; persisted on entry.altQuestionUsed.
function useAlternativeQuestion() {
    const today = getLocalDateStr(getNow());
    const dateStr = _journalEditingDate || today;
    // Flush any pending autosave first so we don't lose typing
    flushJournalAutosave();
    // Ensure entry exists
    if (!gameState.journal.entries[dateStr]) {
        gameState.journal.entries[dateStr] = {
            question: getJournalQuestionForDate(new Date(dateStr + 'T12:00:00')),
            answer: '', freeText: '', mood: null,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
    }
    const entry = gameState.journal.entries[dateStr];
    if (entry.altQuestionUsed) {
        toast('Tu as déjà changé la question pour ce jour', 'info');
        return;
    }
    const current = entry.question;
    // Pick random until different from current
    let next = current;
    let tries = 0;
    while (next === current && tries < 20) {
        next = JOURNAL_QUESTIONS[Math.floor(Math.random() * JOURNAL_QUESTIONS.length)];
        tries++;
    }
    entry.question = next;
    entry.altQuestionUsed = true;
    entry.updatedAt = new Date().toISOString();
    saveGameState();
    renderJournalPage();
    toast('🔄 Nouvelle question piochée', 'success');
}

// V7.0b: compute journal stats (total, longest streak, most-written month)
function computeJournalStats() {
    const entries = gameState.journal?.entries || {};
    const dates = Object.keys(entries).filter(d => hasJournalContent(d));
    const total = dates.length;
    const longest = gameState.journal?.longestStreak || 0;

    // Count per YYYY-MM
    const monthCount = {};
    dates.forEach(d => {
        const ym = d.slice(0, 7);
        monthCount[ym] = (monthCount[ym] || 0) + 1;
    });
    let topMonth = null, topCount = 0;
    Object.entries(monthCount).forEach(([ym, c]) => {
        if (c > topCount) { topCount = c; topMonth = ym; }
    });
    let topMonthLabel = '—';
    if (topMonth) {
        const [y, m] = topMonth.split('-');
        const d = new Date(parseInt(y), parseInt(m)-1, 1);
        topMonthLabel = d.toLocaleDateString('fr-FR', { month:'short', year:'numeric' });
    }
    return { total, longest, topMonth: topMonthLabel, topCount };
}

function setJournalMood(v) {
    const today = getLocalDateStr(getNow());
    const dateStr = _journalEditingDate || today;
    if (!gameState.journal.entries[dateStr]) {
        gameState.journal.entries[dateStr] = {
            question: getJournalQuestionForDate(new Date(dateStr + 'T12:00:00')),
            answer: '', freeText: '', mood: null,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
    }
    gameState.journal.entries[dateStr].mood = v;
    // Mirror to gameState.moods
    if (!gameState.moods) gameState.moods = [];
    const existing = gameState.moods.find(m => m.date === dateStr);
    if (v === null) {
        if (existing) gameState.moods = gameState.moods.filter(m => m.date !== dateStr);
    } else {
        if (existing) existing.value = v;
        else gameState.moods.push({ date: dateStr, value: v, timestamp: new Date().toISOString() });
    }
    saveGameState();
    renderJournalPage();
    if (typeof updateMoodFab === 'function') updateMoodFab();
}

function commitJournalEntry() {
    const today = getLocalDateStr(getNow());
    const dateStr = _journalEditingDate || today;
    const answer   = document.getElementById('journal-answer')?.value || '';
    const freeText = document.getElementById('journal-freetext')?.value || '';
    saveJournalEntry(dateStr, { answer, freeText });
    renderJournalPage();
}

function confirmDeleteJournalEntry(dateStr) {
    showModal({
        type:'danger',
        title:'Supprimer cette entrée ?',
        body:`L'entrée du <strong>${formatJournalDate(dateStr)}</strong> sera définitivement supprimée.`,
        confirmLabel:'Supprimer',
        onConfirm: () => {
            deleteJournalEntry(dateStr);
            toast('Entrée supprimée', 'info');
            renderJournalPage();
        }
    });
}

function journalBackToToday() {
    _journalEditingDate = null;
    renderJournalPage();
}

function journalJumpTo(dateStr) {
    if (typeof flushJournalAutosave === 'function') flushJournalAutosave();
    const today = getLocalDateStr(getNow());
    _journalEditingDate = (dateStr === today) ? null : dateStr;
    renderJournalPage();
}

function journalGoToDate(direction) {
    const today = getLocalDateStr(getNow());
    const cur = _journalEditingDate || today;
    const d = new Date(cur + 'T12:00:00');
    d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
    const ds = getLocalDateStr(d);
    if (ds > today) { toast('Pas de saut dans le futur 😉', 'info'); return; }
    journalJumpTo(ds);
}

// ─── Calendar modal ──────────────────────────────────────────────────

function openJournalCalendarModal() {
    const today = getNow();
    _journalCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    document.querySelectorAll('#journal-calendar-modal').forEach(m => m.remove());

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'journal-calendar-modal';
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:360px;">
            <div class="modal-title gold">📅 Naviguer dans le journal</div>
            <div class="calendar-nav">
                <button class="cal-nav-btn" onclick="journalCalendarPrevMonth()">‹</button>
                <span class="cal-month-label" id="journal-cal-month-label"></span>
                <button class="cal-nav-btn" onclick="journalCalendarNextMonth()">›</button>
            </div>
            <div class="calendar-grid" id="journal-cal-grid"></div>
            <div class="modal-actions" style="margin-top:12px;">
                <button class="btn-cancel" onclick="document.getElementById('journal-calendar-modal').remove()">Fermer</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    renderJournalCalendarGrid();
}

function journalCalendarPrevMonth() {
    _journalCalendarMonth.setMonth(_journalCalendarMonth.getMonth() - 1);
    renderJournalCalendarGrid();
}
function journalCalendarNextMonth() {
    _journalCalendarMonth.setMonth(_journalCalendarMonth.getMonth() + 1);
    renderJournalCalendarGrid();
}

function renderJournalCalendarGrid() {
    const label = document.getElementById('journal-cal-month-label');
    const grid  = document.getElementById('journal-cal-grid');
    if (!label || !grid) return;

    const m = _journalCalendarMonth;
    label.textContent = m.toLocaleDateString('fr-FR', { month:'long', year:'numeric' });

    const firstDay = new Date(m.getFullYear(), m.getMonth(), 1);
    const lastDay  = new Date(m.getFullYear(), m.getMonth()+1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const days = lastDay.getDate();
    const today = getLocalDateStr(getNow());

    // V7.0c: use proven .cal-day-names + .cal-days structure (same as habits calendar)
    // — avoids relying on .calendar-grid which has no CSS layout.
    let html = '<div class="cal-day-names">';
    ['L','M','M','J','V','S','D'].forEach(d => html += `<div class="cal-day-name">${d}</div>`);
    html += '</div><div class="cal-days">';
    for (let i = 0; i < startDow; i++) html += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= days; d++) {
        const dt = new Date(m.getFullYear(), m.getMonth(), d);
        const ds = getLocalDateStr(dt);
        const has = hasJournalContent(ds);
        const isToday = ds === today;
        const isFuture = ds > today;
        const cls = ['cal-day'];
        if (has)     cls.push('has-entry');
        if (isToday) cls.push('today');
        if (isFuture) cls.push('future');
        const click = isFuture ? '' : `onclick="journalJumpTo('${ds}');document.getElementById('journal-calendar-modal').remove();"`;
        html += `<div class="${cls.join(' ')}" ${click}>${d}${has?'<span class="cal-dot"></span>':''}</div>`;
    }
    html += '</div>';
    grid.innerHTML = html;
}

// ─── PIN settings ────────────────────────────────────────────────────

function openJournalPinSettings() {
    const hasPin = !!gameState.journal?.pinHash;
    document.querySelectorAll('#journal-pin-modal').forEach(m => m.remove());
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'journal-pin-modal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-title gold">🔒 Code PIN du journal</div>
            <div class="modal-body" style="text-align:left;">
                ${hasPin ?
                    `<p>Tu peux retirer le code actuel ou le remplacer.</p>` :
                    `<p>Définis un code de 4 à 6 chiffres pour protéger l'accès au journal.</p>
                     <p style="color:var(--text-dim);font-size:0.8rem;">⚠️ Le code n'est pas chiffré, juste haché. Les données restent visibles dans l'export JSON.</p>`}
                <input type="password" inputmode="numeric" maxlength="6" id="new-pin-input"
                       class="journal-pin-input" placeholder="${hasPin?'Nouveau code':'Code (4-6 chiffres)'}" autocomplete="off" />
                <input type="password" inputmode="numeric" maxlength="6" id="new-pin-confirm"
                       class="journal-pin-input" placeholder="Confirme" autocomplete="off" />
            </div>
            <div class="modal-actions">
                ${hasPin ? `<button class="btn-cancel" onclick="confirmRemoveJournalPin()">Retirer le code</button>` : ''}
                <button class="btn-cancel" onclick="document.getElementById('journal-pin-modal').remove()">Annuler</button>
                <button class="btn-gold" onclick="commitJournalPinChange()">Valider</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function commitJournalPinChange() {
    const a = document.getElementById('new-pin-input')?.value.trim();
    const b = document.getElementById('new-pin-confirm')?.value.trim();
    if (!a || a.length < 4) { toast('Code trop court (min 4)', 'error'); return; }
    if (a !== b) { toast('Les codes ne correspondent pas', 'error'); return; }
    if (!/^\d+$/.test(a)) { toast('Chiffres uniquement', 'error'); return; }
    await setJournalPin(a);
    document.getElementById('journal-pin-modal')?.remove();
    toast('Code défini ✓', 'success');
    renderJournalPage();
}

function confirmRemoveJournalPin() {
    showModal({
        type:'danger',
        title:'Retirer le code PIN ?',
        body:'Le journal redeviendra accessible sans code.',
        confirmLabel:'Retirer',
        onConfirm: () => {
            removeJournalPin();
            document.getElementById('journal-pin-modal')?.remove();
            toast('Code retiré', 'info');
            renderJournalPage();
        }
    });
}


/* ═══════════════════════════════════════════
   V8.0 — TASKS (to-do list)
   ═══════════════════════════════════════════ */

const TASK_XP = 15;
let _taskCarryOverTodayDone = null; // memoized date to avoid running carry-over twice

function nextTaskId() {
    return (gameState.tasks || []).reduce((m, t) => Math.max(m, t.id || 0), 0) + 1;
}

// Add a new task — assigned to a skill, due today by default
function addTask(name, skill) {
    if (!name || !name.trim()) return null;
    if (!gameState.tasks) gameState.tasks = [];
    const today = getLocalDateStr(getNow());
    const task = {
        id: nextTaskId(),
        name: name.trim(),
        skill: skill || 'discipline',
        createdDate: today,
        dueDate: today,
        completed: false,
        completedDate: null,
        carriedOver: 0
    };
    gameState.tasks.push(task);
    saveGameState();
    return task;
}

// Toggle a task's completion. Awards/removes XP, updates streak.
function toggleTask(taskId) {
    const task = (gameState.tasks || []).find(t => t.id === taskId);
    if (!task) return;
    const today = getLocalDateStr(getNow());
    if (!task.completed) {
        // Mark complete
        task.completed = true;
        task.completedDate = today;
        // Track today as a "task day" for streak
        if (!gameState.taskCompletionDates.includes(today)) {
            gameState.taskCompletionDates.push(today);
        }
        gameState.taskStreak = computeTaskStreak();
        if (gameState.taskStreak > (gameState.longestTaskStreak||0)) {
            gameState.longestTaskStreak = gameState.taskStreak;
        }
        // XP with streak bonus
        const streakBonus = Math.max(0, gameState.taskStreak - 1) * 5;
        const xp = Math.floor(TASK_XP * (1 + streakBonus/100));
        gainSkillXP(task.skill || 'discipline', xp, `Tâche — ${task.name}`);
        const mult = getWeaponBoostMult(task.skill || 'discipline');
        const boosted = Math.floor(xp * mult);
        const hasBonus = boosted > xp;
        const bonusText = hasBonus ? ` (+${Math.round((mult-1)*100)}% ⚔️)` : '';
        const xpText = hasBonus ? `+${xp} → +${boosted}` : `+${xp}`;
        toast(`📋 "${task.name}" — ${xpText} XP${bonusText}`, 'success');
    } else {
        // Un-mark: only allow if completed today (to avoid breaking past streaks)
        if (task.completedDate !== today) {
            toast('Tâche déjà clôturée — non décochable', 'info');
            return;
        }
        task.completed = false;
        task.completedDate = null;
        // Remove XP for this task
        const streakBonus = Math.max(0, gameState.taskStreak - 1) * 5;
        const xp = Math.floor(TASK_XP * (1 + streakBonus/100));
        removeSkillXP(task.skill || 'discipline', xp);
        // If no other task completed today, remove today from completionDates
        const stillOneDoneToday = gameState.tasks.some(t => t.completed && t.completedDate === today);
        if (!stillOneDoneToday) {
            gameState.taskCompletionDates = gameState.taskCompletionDates.filter(d => d !== today);
            gameState.taskStreak = computeTaskStreak();
        }
    }
    saveGameState();
    updateHabitsTasksDot();
    renderTasksPage();
}

// Validate yesterday's task (J-1 button)
function toggleTaskYesterday(taskId) {
    const task = (gameState.tasks || []).find(t => t.id === taskId);
    if (!task) return;
    if (task.completed) { toast('Déjà complétée', 'info'); return; }
    const y = new Date(getNow()); y.setDate(y.getDate()-1);
    const yStr = getLocalDateStr(y);
    task.completed = true;
    task.completedDate = yStr;
    if (!gameState.taskCompletionDates.includes(yStr)) {
        gameState.taskCompletionDates.push(yStr);
    }
    gameState.taskStreak = computeTaskStreak();
    if (gameState.taskStreak > (gameState.longestTaskStreak||0)) {
        gameState.longestTaskStreak = gameState.taskStreak;
    }
    const streakBonus = Math.max(0, gameState.taskStreak - 1) * 5;
    const xp = Math.floor(TASK_XP * (1 + streakBonus/100));
    gainSkillXP(task.skill || 'discipline', xp, `Tâche — ${task.name} (hier)`);
    saveGameState();
    updateHabitsTasksDot();
    renderTasksPage();
    toast(`✅ "${task.name}" validée pour hier — +${xp} XP`, 'success');
}

// Delete a task (whether completed or not)
function deleteTask(taskId) {
    const task = (gameState.tasks||[]).find(t => t.id === taskId);
    if (!task) return;
    // If it was completed today, also remove its XP (clean exit)
    const today = getLocalDateStr(getNow());
    if (task.completed && task.completedDate === today) {
        const streakBonus = Math.max(0, gameState.taskStreak - 1) * 5;
        const xp = Math.floor(TASK_XP * (1 + streakBonus/100));
        removeSkillXP(task.skill || 'discipline', xp);
        const stillOneDoneToday = gameState.tasks.some(t => t !== task && t.completed && t.completedDate === today);
        if (!stillOneDoneToday) {
            gameState.taskCompletionDates = gameState.taskCompletionDates.filter(d => d !== today);
        }
    }
    gameState.tasks = gameState.tasks.filter(t => t.id !== taskId);
    gameState.taskStreak = computeTaskStreak();
    saveGameState();
    updateHabitsTasksDot();
    renderTasksPage();
    toast('Tâche supprimée', 'info');
}

// Compute streak of consecutive days with ≥1 task completed, with 1-day grace (like habits)
function computeTaskStreak() {
    const dates = gameState.taskCompletionDates || [];
    if (dates.length === 0) return 0;
    const set = new Set(dates);
    const now = getNow();
    const todayStr = getLocalDateStr(now);
    const y1 = new Date(now); y1.setDate(y1.getDate()-1);
    const y2 = new Date(now); y2.setDate(y2.getDate()-2);
    if (!set.has(todayStr) && !set.has(getLocalDateStr(y1)) && !set.has(getLocalDateStr(y2))) return 0;
    let streak = 0, graceUsed = false;
    const d = new Date(now); d.setHours(0,0,0,0);
    if (set.has(getLocalDateStr(d))) streak++;
    d.setDate(d.getDate()-1);
    for (let i=0; i<1000; i++) {
        const ds = getLocalDateStr(d);
        if (set.has(ds)) { streak++; graceUsed = false; }
        else if (!graceUsed) graceUsed = true;
        else break;
        d.setDate(d.getDate()-1);
    }
    return streak;
}

// Carry over any pending (non-completed) task whose dueDate < today to today.
// Increments carriedOver count for visibility.
function carryOverPendingTasks() {
    const today = getLocalDateStr(getNow());
    if (_taskCarryOverTodayDone === today) return; // already done this session for today
    let changed = 0;
    (gameState.tasks || []).forEach(t => {
        if (!t.completed && t.dueDate && t.dueDate < today) {
            t.dueDate = today;
            t.carriedOver = (t.carriedOver || 0) + 1;
            changed++;
        }
    });
    _taskCarryOverTodayDone = today;
    if (changed > 0) saveGameState();
}

// Update streak from completion dates each day (in case grace just expired)
function refreshTaskStreak() {
    if (!gameState.taskCompletionDates) gameState.taskCompletionDates = [];
    gameState.taskStreak = computeTaskStreak();
}

// ─── UI ──────────────────────────────────────────────────────────────

function switchHabitsSubtab(name) {
    document.querySelectorAll('.habits-subtab').forEach(b => {
        b.classList.toggle('active', b.dataset.subtab === name);
    });
    const pH = document.getElementById('habits-content-habits');
    const pT = document.getElementById('habits-content-tasks');
    if (pH) pH.style.display = name === 'habits' ? '' : 'none';
    if (pT) pT.style.display = name === 'tasks'  ? '' : 'none';
    if (name === 'tasks')  renderTasksPage();
    if (name === 'habits') renderHabitsPage();
    localStorage.setItem('lifeRPG_habitsSubtab', name);
}

// Badge on Tasks sub-tab: shown when there's at least 1 pending task due today
function updateHabitsTasksDot() {
    const dot = document.getElementById('habits-tasks-dot');
    if (!dot) return;
    const today = getLocalDateStr(getNow());
    const hasPending = (gameState.tasks || []).some(t => !t.completed && t.dueDate <= today);
    dot.style.display = hasPending ? 'inline-block' : 'none';
}

function renderTasksPage() {
    const el = document.getElementById('tasks-content');
    if (!el) return;
    carryOverPendingTasks();
    refreshTaskStreak();

    const today = getLocalDateStr(getNow());
    const yesterday = (() => { const d = new Date(getNow()); d.setDate(d.getDate()-1); return getLocalDateStr(d); })();
    const tasks = gameState.tasks || [];

    // Buckets
    const dueToday = tasks.filter(t => !t.completed && t.dueDate <= today);
    const doneToday = tasks.filter(t => t.completed && t.completedDate === today);
    const doneOlder = tasks.filter(t => t.completed && t.completedDate && t.completedDate < today)
                            .sort((a,b) => b.completedDate.localeCompare(a.completedDate))
                            .slice(0, 5);

    const streak = gameState.taskStreak || 0;
    const longest = gameState.longestTaskStreak || 0;

    el.innerHTML = `
    <div class="tasks-header">
        <div class="tasks-header-top">
            <div class="section-title" style="margin:0;">Tâches du jour</div>
            <div class="tasks-streak">🔥 <strong>${streak}</strong> j ${longest > 0 ? `· record ${longest}` : ''}</div>
        </div>
        <div class="add-habit-form" style="margin-top:8px;">
            <input type="text" id="task-input" placeholder="Ajouter une tâche..."
                   onkeypress="if(event.key==='Enter') openAddTaskModal()" />
            <button class="btn-gold" onclick="openAddTaskModal()">Ajouter</button>
        </div>
    </div>

    <div class="tasks-section">
        ${dueToday.length === 0
            ? `<div class="tasks-empty">Rien à faire aujourd'hui 🎉</div>`
            : dueToday.map(t => renderTaskCard(t, 'pending')).join('')}
    </div>

    ${doneToday.length > 0 ? `
        <div class="section-title" style="margin-top:18px;">Faites aujourd'hui (${doneToday.length})</div>
        <div class="tasks-section">
            ${doneToday.map(t => renderTaskCard(t, 'done-today')).join('')}
        </div>
    ` : ''}

    ${doneOlder.length > 0 ? `
        <div class="section-title" style="margin-top:18px;">Récemment complétées</div>
        <div class="tasks-section">
            ${doneOlder.map(t => renderTaskCard(t, 'done-older')).join('')}
        </div>
    ` : ''}
    `;
}

function renderTaskCard(task, kind) {
    const sk = SKILL_CONFIG[task.skill] || SKILL_CONFIG['discipline'];
    const skillIcon = sk?.icon || '⚙️';
    const skillName = sk?.name || task.skill;
    const carriedBadge = task.carriedOver > 0
        ? `<span class="task-carried" title="Reportée ${task.carriedOver}×">↻ ${task.carriedOver}</span>`
        : '';

    if (kind === 'pending') {
        const yesterday = (() => { const d = new Date(getNow()); d.setDate(d.getDate()-1); return getLocalDateStr(d); })();
        const todayStr = getLocalDateStr(getNow());
        const showJM1 = task.createdDate <= yesterday;
        return `
        <div class="task-card">
            <button class="task-check" onclick="toggleTask(${task.id})" title="Marquer comme faite">○</button>
            <div class="task-body">
                <div class="task-name">${escapeHtml(task.name)}</div>
                <div class="task-meta">
                    <span class="task-skill" style="color:${sk?.color || 'var(--text-dim)'};">${skillIcon} ${skillName}</span>
                    ${carriedBadge}
                </div>
            </div>
            <div class="task-actions">
                ${showJM1 ? `<button class="task-mini-btn" onclick="toggleTaskYesterday(${task.id})" title="Validée hier">J-1</button>` : ''}
                <button class="task-mini-btn task-delete" onclick="confirmDeleteTask(${task.id})" title="Supprimer">🗑</button>
            </div>
        </div>`;
    } else if (kind === 'done-today') {
        return `
        <div class="task-card done">
            <button class="task-check checked" onclick="toggleTask(${task.id})" title="Décocher">✓</button>
            <div class="task-body">
                <div class="task-name">${escapeHtml(task.name)}</div>
                <div class="task-meta">
                    <span class="task-skill" style="color:${sk?.color || 'var(--text-dim)'};">${skillIcon} ${skillName}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-mini-btn task-delete" onclick="confirmDeleteTask(${task.id})" title="Supprimer">🗑</button>
            </div>
        </div>`;
    } else {
        // done-older
        return `
        <div class="task-card done older">
            <span class="task-check checked frozen" title="Validée le ${task.completedDate}">✓</span>
            <div class="task-body">
                <div class="task-name">${escapeHtml(task.name)}</div>
                <div class="task-meta">
                    <span class="task-skill" style="color:${sk?.color || 'var(--text-dim)'};">${skillIcon} ${skillName}</span>
                    <span class="task-done-date">${task.completedDate}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-mini-btn task-delete" onclick="confirmDeleteTask(${task.id})" title="Supprimer">🗑</button>
            </div>
        </div>`;
    }
}

// Add-task modal
function openAddTaskModal() {
    const input = document.getElementById('task-input');
    const prefill = input ? input.value.trim() : '';
    document.querySelectorAll('#add-task-modal').forEach(m => m.remove());

    const skillOpts = Object.entries(SKILL_CONFIG).map(([k, cfg]) => `
        <button class="task-skill-pick" data-skill="${k}" onclick="selectTaskSkillPick('${k}')" style="border-color:${cfg.color}40;">
            <span style="color:${cfg.color}">${cfg.icon}</span> ${cfg.name}
        </button>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'add-task-modal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-title gold">📋 Nouvelle tâche</div>
            <div class="modal-body" style="text-align:left;">
                <label class="modal-label">Nom</label>
                <input type="text" id="new-task-name" class="modal-input" placeholder="ex: Appeler le médecin" value="${escapeHtml(prefill)}" />
                <label class="modal-label" style="margin-top:12px;">Compétence</label>
                <div class="task-skill-picker" id="task-skill-picker">${skillOpts}</div>
                <input type="hidden" id="new-task-skill" value="discipline" />
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="document.getElementById('add-task-modal').remove()">Annuler</button>
                <button class="btn-gold" onclick="commitAddTask()">Ajouter</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    // Pre-select discipline
    selectTaskSkillPick('discipline');
    setTimeout(() => document.getElementById('new-task-name')?.focus(), 50);
}

function selectTaskSkillPick(skill) {
    document.querySelectorAll('#task-skill-picker .task-skill-pick').forEach(b => {
        b.classList.toggle('active', b.dataset.skill === skill);
    });
    const hidden = document.getElementById('new-task-skill');
    if (hidden) hidden.value = skill;
}

function commitAddTask() {
    const name = document.getElementById('new-task-name')?.value.trim();
    const skill = document.getElementById('new-task-skill')?.value || 'discipline';
    if (!name) { toast('Donne un nom à la tâche', 'error'); return; }
    addTask(name, skill);
    document.getElementById('add-task-modal')?.remove();
    const input = document.getElementById('task-input');
    if (input) input.value = '';
    updateHabitsTasksDot();
    renderTasksPage();
    toast('Tâche ajoutée ✓', 'success');
}

function confirmDeleteTask(id) {
    const task = (gameState.tasks||[]).find(t => t.id === id);
    if (!task) return;
    showModal({
        type: 'danger',
        title: 'Supprimer la tâche ?',
        body: `<strong>${escapeHtml(task.name)}</strong> sera définitivement supprimée.`,
        confirmLabel: 'Supprimer',
        onConfirm: () => deleteTask(id)
    });
}


loadGameState();
renderDebugToggleBtn();
const savedTab = localStorage.getItem('lifeRPG_tab_v3') || 'habits';
switchTab(savedTab);

if (typeof updateMoodFab === 'function') updateMoodFab();
if (typeof checkOnboarding === 'function') checkOnboarding();
if (typeof checkBackupReminder === 'function') checkBackupReminder();

// V7.0: restore profile subtab
const savedProfSubtab = localStorage.getItem('lifeRPG_profSubtab');
if (savedProfSubtab === 'journal' && typeof switchProfSubtab === 'function') {
    // Defer so DOM exists
    setTimeout(() => { if (savedTab === 'profil') switchProfSubtab('journal'); }, 0);
}

// V8.0: restore habits subtab
const savedHabitsSubtab = localStorage.getItem('lifeRPG_habitsSubtab');
if (savedHabitsSubtab === 'tasks' && typeof switchHabitsSubtab === 'function') {
    setTimeout(() => { if (savedTab === 'habits') switchHabitsSubtab('tasks'); }, 0);
}
// V8.0: initial dot update
setTimeout(() => { if (typeof updateHabitsTasksDot === 'function') updateHabitsTasksDot(); }, 0);

// V7.0b: flush pending journal autosave when page is about to be hidden/closed
window.addEventListener('beforeunload', () => {
    if (typeof flushJournalAutosave === 'function') flushJournalAutosave();
});
window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && typeof flushJournalAutosave === 'function') {
        flushJournalAutosave();
    }
});

/* ═══════════════════════════════════════════
   V6.0d — AUTO-BACKUP REMINDER
   ═══════════════════════════════════════════ */
function checkBackupReminder() {
    const last = gameState._lastBackup;
    if (!last) {
        // Never backed up — show first time after 3 days of usage
        const firstUse = gameState._firstUse;
        if (!firstUse) {
            gameState._firstUse = new Date().toISOString();
            saveGameState();
            return;
        }
        const daysSinceFirst = Math.floor((Date.now() - new Date(firstUse)) / 86400000);
        if (daysSinceFirst >= 3 && !gameState._backupReminderShown) {
            gameState._backupReminderShown = new Date().toISOString();
            saveGameState();
            setTimeout(() => showBackupReminder(true), 2000);
        }
    } else {
        // Already backed up — remind every 7 days
        const daysSinceBackup = Math.floor((Date.now() - new Date(last)) / 86400000);
        if (daysSinceBackup >= 7) {
            const lastReminder = gameState._lastBackupReminder ? new Date(gameState._lastBackupReminder) : null;
            const daysSinceReminder = lastReminder ? Math.floor((Date.now() - lastReminder) / 86400000) : 999;
            if (daysSinceReminder >= 7) {
                gameState._lastBackupReminder = new Date().toISOString();
                saveGameState();
                setTimeout(() => showBackupReminder(false, daysSinceBackup), 2000);
            }
        }
    }
}

function showBackupReminder(firstTime, daysSince) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:340px;border-color:rgba(245,200,66,0.4)">
            <div class="modal-title gold">💾 Sauvegarde recommandée</div>
            <div style="font-size:0.85rem;color:var(--text);line-height:1.5;margin-bottom:14px">
                ${firstTime
                    ? "Tu utilises Ascend depuis quelques jours. <strong>Pense à exporter tes données régulièrement</strong> pour ne pas tout perdre si ton navigateur est nettoyé ou si tu changes d'appareil."
                    : `Ta dernière sauvegarde date de <strong>${daysSince} jours</strong>. Pour ta sécurité, exporte tes données maintenant.`
                }
            </div>
            <div style="font-size:0.7rem;color:var(--text-dim);background:rgba(255,82,82,0.08);border:1px solid rgba(255,82,82,0.2);border-radius:6px;padding:8px;margin-bottom:14px">
                ⚠️ Sans sauvegarde, tu peux perdre toute ta progression : cache vidé, navigateur changé, téléphone perdu...
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Plus tard</button>
                <button class="btn-gold" onclick="this.closest('.modal-overlay').remove();exportGameData()">💾 Exporter</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

/* ═══════════════════════════════════════════
   V6.0d — CONFETTI & DOPAMINE
   ═══════════════════════════════════════════ */
function triggerHabitCelebration(habitId) {
    // Vibration légère sur mobile
    if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch(e) {}
    }
    // Confetti dorés/noirs autour de la case cochée
    const checkboxEl = document.getElementById(`hc-${habitId}`);
    if (!checkboxEl) return;
    const rect = checkboxEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors = ['#f5c842', '#fde68a', '#1a1a1a', '#3a3a3a', '#ffffff'];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const distance = 40 + Math.random() * 30;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        particle.style.setProperty('--rot', `${Math.random() * 360}deg`);
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
    }
}
