# README

## Come lanciare il progetto

1. Assicurati di avere tutti i prerequisiti elencati nel file `requirements.txt`. Puoi installarli utilizzando il comando `pip install -r requirements.txt`.

2. Si consiglia di utilizzare un ambiente virtuale (venv) per isolare le dipendenze del progetto. Ecco come creare e attivare un ambiente virtuale con Python:

    ```bash
    python -m venv .venv
    source .venv/bin/activate
    ```

    Per disattivare l'ambiente virtuale, esegui il comando:

    ```bash
    deactivate
    ```

3. Se è la prima volta che hai clonato il repository, esegui il comando `python manage.py migrate` per applicare le migrazioni al database.

4. Per avviare il server, esegui il comando `python manage.py runserver`. Il server sarà accessibile all'indirizzo `127.0.0.1:8000`.

5. Per creare un utente amministratore, utilizza il comando `python manage.py createsuperuser`. Con questo utente, potrai accedere all'area amministrativa all'indirizzo `127.0.0.1:8000/admin` e verificare se gli utenti registrati sono stati salvati correttamente nel database.
