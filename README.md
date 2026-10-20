# SpirdoApp

PWA con raccolta audio condivisa e accesso amministratore in alto a destra. Il codice amministratore si imposta nella variabile d’ambiente `ADMIN_CODE`, senza inserirlo nel repository. Senza accesso si possono ascoltare i suoni; dopo l'accesso si possono aggiungere, rinominare e rimuovere. Le autorizzazioni sono verificate dal server su tutte le modifiche. Il codice non è incluso nei file inviati al browser.

## Avvio

Richiede Node.js 20 o successivo, nessuna dipendenza esterna.

```sh
ADMIN_CODE="codice-scelto" node server.mjs
```

Aprire http://localhost:3000. Non aprire direttamente index.html: l'app richiede il server. File e catalogo sono salvati in `data/`, da conservare su un volume persistente e includere nei backup. `PORT` cambia porta; `DATA_DIR` cambia directory archivio; `ADMIN_CODE` è obbligatoria e definisce il codice di accesso. Non servire l'intera cartella progetto con un server statico: codice server, test e dati non devono essere pubblici.

## Pubblicazione

Pubblicare su un hosting Node.js con disco persistente, HTTPS e `NODE_ENV=production` (cookie Secure). Usare un'unica istanza del server; la sessione amministratore dura 8 ore e viene invalidata al riavvio. Non è sufficiente pubblicare solo `dist/`. Il link consente a tutti l'ascolto; il codice autorizza le modifiche. Cinque codici errati comportano un blocco di 15 minuti per indirizzo visto dal server. Dietro un proxy lo stesso limite può riguardare più visitatori.

I file audio possono pesare fino a 20 MB ciascuno. La raccolta viene aggiornata all'apertura e quando si torna sull'app. Gli audio della vecchia versione salvati in IndexedDB non sono trasferiti automaticamente: ricaricarli dal pannello amministratore.

Installazione dal menu del browser: “Installa app”, oppure su iPhone Safari → Condividi → Aggiungi alla schermata Home. L'interfaccia è disponibile offline dopo il primo accesso; raccolta condivisa, audio e amministrazione richiedono connessione.

## Verifica

```sh
node test.mjs
```

Test delle richieste al gestore server: accesso, codice errato, autorizzazioni, caricamento, ascolto pubblico, etichette, rimozione, uscita, controllo origine e limite tentativi. Test superati. Non è stato possibile avviare un server HTTP nel sandbox (porte bloccate); verifica nel browser non eseguita.

Il repository contiene il progetto completo. Per usare un link pubblico serve un hosting Node.js con HTTPS e disco persistente: GitHub Pages non esegue il server e non supporta questo archivio condiviso.
