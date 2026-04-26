---
name: claude-design-to-code
description: Transformer un mockup Claude Design (HTML + rationale) en composant Angular standalone prêt à brancher. Déclencher quand Victor a un HTML mockup issu de Claude Design et veut le composant Angular correspondant sans faire le layout à la main.
---

# Skill : Claude Design → Angular

Traduit le HTML mockup généré par Claude Design en composant Angular standalone (template + SCSS), prêt pour Victor qui branche ensuite la logique métier et les données.

## Workflow complet

```
1. Screenshots de l'app existante (PNG)
2. Claude Design — prompt décrivant la feature/écran voulu
   → Output : HTML mockup + texte rationale de conception
3. Ce skill — agent lit le HTML + contexte FSTG
   → Output : composant Angular (template + SCSS)
4. Victor — branche la logique métier, les services, les données
```

---

## Étape 0 — Charger le contexte projet

Lire :
- `CLAUDE.md` du projet FSTG (conventions Angular, stack, nommage)
- Le HTML mockup fourni par Victor (chemin ou contenu copié)
- Le texte rationale Claude Design si fourni (décisions de conception à respecter)

---

## Étape 1 — Parser le HTML mockup

Depuis le HTML Claude Design, extraire :

**CSS → SCSS :**
- Relever toutes les classes CSS définies (`fstg-card`, `fstg-stencil`, etc.)
- Identifier les tokens de couleur (ex: `#E8A53C`, `#151515`, `#1c1c1c`)
- Repérer les patterns répétés → candidats à des mixins SCSS

**Structure HTML → template Angular :**
- Identifier les sections principales (header, contenu, actions)
- Repérer les éléments répétables → `@for`
- Repérer les éléments conditionnels → `@if`
- Identifier les interactions (boutons, toggles) → event handlers à laisser vides (`(click)="onXxx()"`)

---

## Étape 2 — Générer le composant Angular

**Conventions FSTG obligatoires :**
- `standalone: true` — toujours
- `inject()` pour les services — jamais de constructeur
- Signals pour l'état local : `signal()`, `computed()`
- Lazy loading : le composant est chargé via `loadComponent()` par la route parente
- Pas de `any` — typer les inputs avec des interfaces

**Nommage :**
- Fichier : `kebab-case.component.ts` / `.scss` / `.html`
- Classe : `PascalCaseComponent`
- Inputs : `input<Type>()` (signal-based inputs Angular 17+)

**Structure générée :**

```typescript
// [nom].component.ts
import { Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
// imports Angular Material si nécessaire

@Component({
  selector: 'app-[nom]',
  standalone: true,
  imports: [CommonModule, /* Material modules */],
  templateUrl: './[nom].component.html',
  styleUrl: './[nom].component.scss'
})
export class [Nom]Component {
  // Inputs depuis le composant parent
  // data = input<Type>();

  // État local
  // isFollowing = signal(false);

  // Actions — logique à brancher par Victor
  // onFollow(): void { }
}
```

**Template :**
- Convertir le HTML Claude Design en syntaxe Angular
- Remplacer les données statiques par des bindings (`{{ data.name }}`, `[attr]`, `@for`)
- Laisser les event handlers vides et commentés : `(click)="onFollow() // TODO: brancher"`

**SCSS :**
- Extraire les styles du `<style>` Claude Design
- Supprimer les classes non utilisées dans ce composant
- Garder les tokens couleur FSTG existants si déjà définis globalement — sinon les déclarer en variables SCSS locales
- `:host { display: block; }` en tête

---

## Étape 3 — Présenter à Victor

Afficher dans l'ordre :
1. **Arborescence des fichiers** à créer
2. **`.component.ts`** — complet
3. **`.component.html`** — complet
4. **`.component.scss`** — complet
5. **TODO list** — ce que Victor doit brancher (services, données, event handlers)

Format de la TODO list :
```
### À brancher par Victor
- [ ] Injecter [ServiceName] et appeler [méthode] sur onXxx()
- [ ] Alimenter [input] depuis le composant parent
- [ ] Gérer l'état [isFollowing] via l'API
```

---

## Règles absolues

- **Ne jamais inventer la logique métier** — laisser les handlers vides avec un commentaire `// TODO`
- **Respecter le design Claude Design à 95%** — ne pas "améliorer" le layout sans demander
- **Un composant = un fichier HTML + un .ts + un .scss** — pas de styles inline dans le template
- **Pas de `ngClass` verbeux** — préférer les classes conditionnelles avec `@if` sur le wrapper
- **Angular Material si déjà utilisé dans FSTG** — ne pas réinventer des composants existants (toggle → `mat-slide-toggle`, bouton → `mat-button`)
