# SpirdoApp

PWA pubblicata esclusivamente con GitHub Pages: https://misciandosky.github.io/SpirdoApp/

## Carica dal telefono

1. Apri l’app e premi **Admin** in alto a destra, inserisci il codice e premi **Aggiungi suoni**.
2. Accedi al tuo account GitHub e scegli **choose your files**.
3. Seleziona gli audio dal telefono (MP3 consigliato, massimo 25 MB per file nel caricamento web GitHub).
4. Premi **Commit changes** e conferma su `main`.
5. Aspetta che la pubblicazione in **Actions** sia verde, poi torna sull’app e ricarica.

Ogni file in `dist/audio/` crea automaticamente un pulsante. `Campanello.mp3` diventa **Campanello**. Sono supportati MP3, WAV, M4A, OGG, AAC, FLAC e WEBM; la riproduzione dipende dal browser. L’etichetta corrisponde sempre al nome del file senza estensione, mantenendo spazi e altri caratteri. Non va inserita manualmente; per cambiarla rinomina il file. Per rimuovere un suono elimina il file da GitHub.

Chi ha il link ascolta senza login. Solo i collaboratori con permessi di scrittura GitHub possono modificare la raccolta. La schermata Admin richiede un codice prima di mostrare i collegamenti di gestione. Il controllo avviene nel browser ed è aggirabile: non è una barriera di sicurezza. GitHub gestisce le vere autorizzazioni sui file; conoscere il codice non conferisce permessi sul repository. Nessun token GitHub viene pubblicato. Repository e audio sono pubblici.

L’app si installa dal menu del browser o su iPhone da Safari → Condividi → Aggiungi alla schermata Home. Audio e aggiornamenti richiedono connessione; l’interfaccia e l’ultimo catalogo caricato possono essere consultati offline.

## Sviluppo

`npm run build` genera `dist/sounds.json` dagli audio. `npm test` verifica nomi, etichette, URL e selezione dei file. Non servono dipendenze o server esterni. GitHub Actions genera il catalogo e pubblica `dist/` dopo ogni commit su `main`.
